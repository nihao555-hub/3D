import type { SupabaseClient } from '@supabase/supabase-js';
import type { Model } from '@shared/types';
import { env } from './env';
import { logError } from './serverLog';

// 腾讯混元生3D「OpenAI 兼容接口」适配器（专业版）。
// 提交/轮询模式（无需 webhook 公网回调），图片走 Base64 Data URI
// （无需公网取图），本地开发不依赖任何隧道。文档：
// https://cloud.tencent.com/document/product/1804/126189
const DEFAULT_BASE_URL = 'https://api.ai3d.cloud.tencent.com';

const POLL_INTERVAL_MS = 10_000;
const POLL_TIMEOUT_MS = 15 * 60_000;

export function tencent3dEnabled(): boolean {
  return Boolean(env('TENCENT3D_API_KEY').trim());
}

function baseUrl(): string {
  return (env('TENCENT3D_BASE_URL').trim() || DEFAULT_BASE_URL).replace(
    /\/+$/,
    '',
  );
}

// UI 档位 → 混元生3D 专业版参数。
// ultra=3.1+PBR（约30积分+格式5），quality=3.0 带纹理（20+5积分），
// fast=3.0 白模（15+5积分）。
function tencentParamsFor(model: Model): Record<string, unknown> {
  if (model === 'ultra') {
    return { Model: '3.1', EnablePBR: true };
  }
  if (model === 'fast') {
    return { Model: '3.0', GenerateType: 'Geometry' };
  }
  return { Model: '3.0' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function ai3dPost(
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: env('TENCENT3D_API_KEY').trim(),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`混元生3D ${path} 非 JSON 响应: ${text.slice(0, 200)}`);
  }
  const wrapped = isRecord(data) ? (data.Response ?? data) : undefined;
  if (!isRecord(wrapped)) {
    throw new Error(`混元生3D ${path} 响应格式异常: ${text.slice(0, 200)}`);
  }
  const error = wrapped.Error;
  if (isRecord(error)) {
    throw new Error(
      `混元生3D ${path} 失败: ${String(error.Code ?? '')} ${String(error.Message ?? '')}`,
    );
  }
  if (!response.ok) {
    throw new Error(`混元生3D ${path} HTTP ${response.status}`);
  }
  return wrapped;
}

async function broadcastMeshUpdate(
  supabaseClient: SupabaseClient,
  userId: string,
  meshId: string,
  conversationId: string,
  status: 'success' | 'failure',
) {
  try {
    const channel = supabaseClient.channel(`mesh-updates-${userId}`);
    await channel.send({
      type: 'broadcast',
      event: 'mesh-updated',
      payload: {
        kind: 'mesh',
        id: meshId,
        status,
        conversation_id: conversationId,
      },
    });
  } catch {
    // 客户端有 3 秒轮询兜底，广播失败不影响最终一致性
  }
}

// 依据图片魔数推断 Data URI 的 mime（混元要求 data:image/xxx;base64, 前缀）
function imageDataUri(bytes: Buffer): string {
  const mime =
    bytes[0] === 0xff && bytes[1] === 0xd8
      ? 'image/jpeg'
      : bytes[0] === 0x52 && bytes[1] === 0x49
        ? 'image/webp'
        : 'image/png';
  return `data:${mime};base64,${bytes.toString('base64')}`;
}

/**
 * 完整的腾讯混元生3D 流程：解析输入（文生3D 或 图生3D）→ 提交任务 →
 * 轮询直至完成 → 下载 GLB → 上传至存储 → 更新状态并广播。
 * 设计为在后台任务中运行（调用方不等待）。
 */
export async function submitTencent3dMeshJob(options: {
  supabaseClient: SupabaseClient;
  text: string | undefined;
  images: string[] | undefined;
  userId: string;
  conversationId: string;
  meshId: string;
  model: Model;
}): Promise<void> {
  const { supabaseClient, text, images, userId, conversationId, meshId } =
    options;

  try {
    // 图生3D 优先：下载用户/前序图片转 Data URI；否则文生3D 直出
    let imageUri: string | undefined;
    if (images && images.length > 0) {
      const { data: blob, error } = await supabaseClient.storage
        .from('images')
        .download(`${userId}/${conversationId}/${images[0]}`);
      if (error || !blob) {
        throw new Error(`下载输入图片失败: ${error?.message ?? 'empty'}`);
      }
      imageUri = imageDataUri(Buffer.from(await blob.arrayBuffer()));
    }
    if (!imageUri && !text) {
      throw new Error('缺少生成输入（文本或图片）');
    }

    const submitted = await ai3dPost('/v1/ai3d/submit', {
      ...tencentParamsFor(options.model),
      ResultFormat: 'GLB',
      ...(imageUri ? { ImageUrl: { Url: imageUri } } : { Prompt: text }),
    });
    const jobId = submitted.JobId;
    if (typeof jobId !== 'string' || !jobId) {
      throw new Error(
        `混元生3D 未返回任务ID: ${JSON.stringify(submitted).slice(0, 200)}`,
      );
    }

    // 轮询任务状态：WAIT / RUN → 继续；DONE → 取件；FAIL → 失败
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let fileUrl: string | undefined;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const result = await ai3dPost('/v1/ai3d/query', { JobId: jobId });
      const status = String(result.Status ?? '').toUpperCase();
      if (result.ErrorCode) {
        throw new Error(
          `生成失败: ${String(result.ErrorMessage ?? result.ErrorCode)}`,
        );
      }
      if (status === 'DONE') {
        const files = Array.isArray(result.ResultFile3Ds)
          ? result.ResultFile3Ds.filter(isRecord)
          : [];
        const glb =
          files.find((f) => String(f.Type ?? '').toUpperCase() === 'GLB') ??
          files[0];
        fileUrl =
          glb && typeof glb.Url === 'string' && glb.Url ? glb.Url : undefined;
        if (!fileUrl) {
          throw new Error(
            `任务完成但未返回模型文件: ${JSON.stringify(result).slice(0, 300)}`,
          );
        }
        break;
      }
      if (status === 'FAIL' || status === 'FAILED') {
        throw new Error(`生成失败: ${String(result.ErrorMessage ?? status)}`);
      }
    }
    if (!fileUrl) {
      throw new Error('混元生3D 任务超时（15 分钟）');
    }

    // 下载 GLB 并入库
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`下载生成模型失败: HTTP ${fileResponse.status}`);
    }
    const fileBytes = await fileResponse.arrayBuffer();
    const { error: uploadError } = await supabaseClient.storage
      .from('meshes')
      .upload(`${userId}/${conversationId}/${meshId}.glb`, fileBytes, {
        contentType: 'model/gltf-binary',
        upsert: true,
      });
    if (uploadError) {
      throw new Error(`模型入库失败: ${uploadError.message}`);
    }

    await supabaseClient
      .from('meshes')
      .update({ status: 'success' })
      .eq('id', meshId);
    await broadcastMeshUpdate(
      supabaseClient,
      userId,
      meshId,
      conversationId,
      'success',
    );
  } catch (error) {
    console.error('[tencent3d] 生成失败:', error);
    logError(error, {
      functionName: 'tencent3d',
      statusCode: 500,
      userId,
      conversationId,
      additionalContext: { meshId, model: options.model },
    });
    await supabaseClient
      .from('meshes')
      .update({ status: 'failure' })
      .eq('id', meshId);
    await broadcastMeshUpdate(
      supabaseClient,
      userId,
      meshId,
      conversationId,
      'failure',
    );
  }
}
