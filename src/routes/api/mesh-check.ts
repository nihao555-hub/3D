import { createFileRoute } from '@tanstack/react-router';
import {
  isRecord,
  isUnauthorizedError,
  json,
  methodNotAllowed,
  preflight,
  requireUser,
} from '@/server/api';
import { getServiceRoleSupabaseClient } from '@/server/supabaseClient';
import { checkTencent3dJobOnce, tencent3dEnabled } from '@/server/tencent3d';

// 客户端轮询驱动的网格任务收尾接口。
// Serverless 部署（Vercel 等）没有常驻进程做后台轮询，
// 由 MeshPreview 的既有轮询在 pending 期间调用本接口：
// 查询腾讯任务状态，完成则下载入库，保证任务生命周期闭环。
export const Route = createFileRoute('/api/mesh-check')({
  server: {
    handlers: {
      GET: methodNotAllowed,
      OPTIONS: preflight,
      POST: async ({ request }) => {
        let userId: string;
        try {
          userId = (await requireUser(request)).id;
        } catch (err) {
          if (isUnauthorizedError(err)) {
            return json({ error: 'Unauthorized' }, 401);
          }
          throw err;
        }

        const body: unknown = await request.json().catch(() => null);
        const meshId =
          isRecord(body) && typeof body.meshId === 'string'
            ? body.meshId
            : null;
        if (!meshId) {
          return json({ error: 'meshId required' }, 400);
        }

        const supabaseClient = getServiceRoleSupabaseClient();
        const { data: mesh, error } = await supabaseClient
          .from('meshes')
          .select('id, status, user_id, conversation_id, prompt')
          .eq('id', meshId)
          .single();
        if (error || !mesh) {
          return json({ error: 'not found' }, 404);
        }
        if (mesh.user_id !== userId) {
          return json({ error: 'forbidden' }, 403);
        }

        if (mesh.status !== 'pending' || !tencent3dEnabled()) {
          return json({ status: mesh.status });
        }
        const jobId = isRecord(mesh.prompt)
          ? mesh.prompt.tencent_job_id
          : undefined;
        if (typeof jobId !== 'string' || !jobId) {
          // 非腾讯任务（fal 通道走 webhook）或 JobId 尚未写入
          return json({ status: mesh.status });
        }

        const status = await checkTencent3dJobOnce({
          supabaseClient,
          userId,
          conversationId: mesh.conversation_id,
          meshId,
          jobId,
        });
        return json({ status });
      },
    },
  },
});
