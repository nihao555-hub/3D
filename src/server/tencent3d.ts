import type { SupabaseClient } from '@supabase/supabase-js';
import type { Model } from '@shared/types';
import { env } from './env';
import { logError } from './serverLog';

// 腾讯混元生3D「OpenAI 兼容接口」适配器（专业版）。
// 提交/轮询模式（无需 webhook 公网回调），图片走 Base64 Data URI
// （无需公网取图），本地开发不依赖任何隧道。文档：
// https://cloud.tencent.com/document/product/1804/126189
//
// Serverless 兼容：提交后将 JobId 持久化到 mesh.prompt.tencent_job_id，
// 收尾动作（查询→下载→入库）由 checkTencent3dJobOnce 幂等驱动——
// 常驻进程里由后台循环调用，Serverless（Vercel 等）里由客户端轮询的
// /api/mesh-check 接口调用，两条路径可并存。
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
    // 客户端有轮询兜底，广播失败不影响最终一致性
  }
}

async function markFailure(
  supabaseClient: SupabaseClient,
  userId: string,
  meshId: string,
  conversationId: string,
) {
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
 * 查询一次腾讯任务并在完成时收尾（下载 GLB → 入库 → 更新状态 → 广播）。
 * 幂等设计：后台循环与 /api/mesh-check 接口可并发调用。
 * 瞬时网络错误按 pending 处理，不会把慢任务误标失败。
 */
export async function checkTencent3dJobOnce(options: {
  supabaseClient: SupabaseClient;
  userId: string;
  conversationId: string;
  meshId: string;
  jobId: string;
}): Promise<'pending' | 'success' | 'failure'> {
  const { supabaseClient, userId, conversationId, meshId, jobId } = options;

  let result: Record<string, unknown>;
  try {
    result = await ai3dPost('/v1/ai3d/query', { JobId: jobId });
  } catch (error) {
    // 查询接口报错（网络抖动/限频）→ 维持 pending，等待下次驱动
    console.warn('[tencent3d] 查询失败（保持 pending）:', error);
    return 'pending';
  }

  const status = String(result.Status ?? '').toUpperCase();
  if (result.ErrorCode || status === 'FAIL' || status === 'FAILED') {
    logError(
      new Error(
        `生成失败: ${String(result.ErrorMessage ?? result.ErrorCode ?? status)}`,
      ),
      {
        functionName: 'tencent3d',
        statusCode: 500,
        userId,
        conversationId,
        additionalContext: { meshId, jobId },
      },
    );
    await markFailure(supabaseClient, userId, meshId, conversationId);
    return 'failure';
  }
  if (status !== 'DONE') {
    return 'pending';
  }

  try {
    const rawFiles = result.ResultFile3Ds;
    const files = Array.isArray(rawFiles) ? rawFiles.filter(isRecord) : [];
    const glb =
      files.find((f) => String(f.Type ?? '').toUpperCase() === 'GLB') ??
      files[0];
    const fileUrl =
      glb && typeof glb.Url === 'string' && glb.Url ? glb.Url : undefined;
    if (!fileUrl) {
      throw new Error(
        `任务完成但未返回模型文件: ${JSON.stringify(result).slice(0, 300)}`,
      );
    }

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
    return 'success';
  } catch (error) {
    console.error('[tencent3d] 收尾失败:', error);
    logError(error, {
      functionName: 'tencent3d',
      statusCode: 500,
      userId,
      conversationId,
      additionalContext: { meshId, jobId },
    });
    await markFailure(supabaseClient, userId, meshId, conversationId);
    return 'failure';
  }
}

/**
 * 完整的腾讯混元生3D 流程：解析输入（文生3D 或 图生3D）→ 提交任务 →
 * 持久化 JobId → 轮询直至完成（常驻进程）。
 * Serverless 环境下本函数的轮询可能随实例冻结而中断，
 * 收尾由客户端驱动的 /api/mesh-check 兜底。
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

  let jobId: string;
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
    const submittedJobId = submitted.JobId;
    if (typeof submittedJobId !== 'string' || !submittedJobId) {
      throw new Error(
        `混元生3D 未返回任务ID: ${JSON.stringify(submitted).slice(0, 200)}`,
      );
    }
    jobId = submittedJobId;

    // 把 JobId 合并进 prompt(jsonb)，供 /api/mesh-check 在
    // Serverless 环境下驱动收尾
    const { data: meshRow } = await supabaseClient
      .from('meshes')
      .select('prompt')
      .eq('id', meshId)
      .single();
    const prompt = isRecord(meshRow?.prompt) ? meshRow.prompt : {};
    await supabaseClient
      .from('meshes')
      .update({ prompt: { ...prompt, tencent_job_id: jobId } })
      .eq('id', meshId);
  } catch (error) {
    console.error('[tencent3d] 提交失败:', error);
    logError(error, {
      functionName: 'tencent3d',
      statusCode: 500,
      userId,
      conversationId,
      additionalContext: { meshId, model: options.model },
    });
    await markFailure(supabaseClient, userId, meshId, conversationId);
    return;
  }

  // 常驻进程下的轮询驱动；超时不标失败（慢任务由 mesh-check 继续兜底）
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const status = await checkTencent3dJobOnce({
      supabaseClient,
      userId,
      conversationId,
      meshId,
      jobId,
    });
    if (status !== 'pending') return;
  }
}
