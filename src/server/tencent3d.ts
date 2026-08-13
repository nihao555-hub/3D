import type { SupabaseClient } from '@supabase/supabase-js';
import type { Model } from '@shared/types';
import { env } from './env';
import { logError } from './serverLog';

// 腾讯云 TokenHub 混元生3D 适配器。
// 提交/轮询模式（无需 webhook 公网回调），图片走 Base64（无需公网取图），
// 因此本地开发不依赖任何隧道。文档：
// https://cloud.tencent.com/document/product/1823/130082
const DEFAULT_BASE_URL = 'https://tokenhub.tencentmaas.com';

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

// UI 档位 → TokenHub 模型与附加参数。
// ultra=专业版3.1+PBR（约30积分），quality=专业版3.0（20积分），
// fast=极速版（15积分）。
function tencentModelFor(model: Model): {
  hyModel: string;
  extra: Record<string, unknown>;
} {
  if (model === 'ultra') {
    return { hyModel: 'HY-3D-3.1', extra: { enable_pbr: true } };
  }
  if (model === 'fast') {
    return { hyModel: 'HY-3D-Express', extra: {} };
  }
  return { hyModel: 'HY-3D-3.0', extra: {} };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function pick(obj: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return undefined;
}

async function tokenhubPost(
  path: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env('TENCENT3D_API_KEY').trim()}`,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`TokenHub ${path} 非 JSON 响应: ${text.slice(0, 200)}`);
  }
  if (!isRecord(data)) {
    throw new Error(`TokenHub ${path} 响应格式异常: ${text.slice(0, 200)}`);
  }
  const error = data.error ?? data.Error;
  if (!response.ok || error) {
    const message = isRecord(error)
      ? (error.message_zh ?? error.message ?? JSON.stringify(error))
      : text.slice(0, 300);
    throw new Error(`TokenHub ${path} 失败(${response.status}): ${message}`);
  }
  // 部分接口把有效负载包在 Response/response 字段里
  const inner = data.Response ?? data.response;
  return isRecord(inner) ? inner : data;
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

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return Buffer.from(buffer).toString('base64');
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
  const { hyModel, extra } = tencentModelFor(options.model);

  try {
    // 图生3D 优先：下载用户/前序图片转 Base64；否则文生3D 直出
    let imageBase64: string | undefined;
    if (images && images.length > 0) {
      const { data: blob, error } = await supabaseClient.storage
        .from('images')
        .download(`${userId}/${conversationId}/${images[0]}`);
      if (error || !blob) {
        throw new Error(`下载输入图片失败: ${error?.message ?? 'empty'}`);
      }
      imageBase64 = arrayBufferToBase64(await blob.arrayBuffer());
    }
    if (!imageBase64 && !text) {
      throw new Error('缺少生成输入（文本或图片）');
    }

    const submitted = await tokenhubPost('/v1/api/3d/submit', {
      model: hyModel,
      result_format: 'GLB',
      ...extra,
      ...(imageBase64 ? { image_base64: imageBase64 } : { prompt: text }),
    });
    const jobId = pick(submitted, 'id', 'job_id', 'JobId');
    if (typeof jobId !== 'string' || !jobId) {
      throw new Error(
        `TokenHub 未返回任务ID: ${JSON.stringify(submitted).slice(0, 200)}`,
      );
    }

    // 轮询任务状态
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    let fileUrl: string | undefined;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      const result = await tokenhubPost('/v1/api/3d/query', {
        model: hyModel,
        id: jobId,
      });
      const status = String(
        pick(result, 'status', 'Status') ?? '',
      ).toUpperCase();
      const errorCode = pick(result, 'error_code', 'ErrorCode');
      if (errorCode) {
        throw new Error(
          `生成失败: ${String(pick(result, 'error_message', 'ErrorMessage') ?? errorCode)}`,
        );
      }
      if (status === 'DONE') {
        const rawFiles = pick(result, 'result_file_3ds', 'ResultFile3Ds');
        const files = Array.isArray(rawFiles) ? rawFiles.filter(isRecord) : [];
        const glb =
          files.find(
            (f) =>
              String(pick(f, 'type', 'Type') ?? '').toUpperCase() === 'GLB',
          ) ?? files[0];
        fileUrl = glb
          ? (pick(glb, 'url', 'Url') as string | undefined)
          : undefined;
        if (!fileUrl) {
          throw new Error(
            `任务完成但未返回模型文件: ${JSON.stringify(result).slice(0, 300)}`,
          );
        }
        break;
      }
      if (status === 'FAIL' || status === 'FAILED') {
        throw new Error(
          `生成失败: ${String(pick(result, 'error_message', 'ErrorMessage') ?? status)}`,
        );
      }
      // WAIT / RUN / 空状态 → 继续轮询
    }
    if (!fileUrl) {
      throw new Error('TokenHub 任务超时（15 分钟）');
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
      additionalContext: { meshId, hyModel },
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
