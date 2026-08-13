import { useConversation } from '@/contexts/ConversationContext';
import { supabase } from '@/lib/supabase';
import { apiJson } from '@/services/api';
import { MeshData } from '@shared/types';
import { useQuery } from '@tanstack/react-query';

export const useMeshData = ({ id }: { id: string }) => {
  const { conversation } = useConversation();

  const dataQuery = useQuery({
    queryKey: ['meshData', id],
    enabled: !!id,
    queryFn: async () => {
      // Serverless 部署下没有常驻后台轮询，先让服务端驱动一次
      // 任务收尾（腾讯通道查询→完成则入库）；失败静默，下方照常读表。
      try {
        await apiJson('mesh-check', {
          method: 'POST',
          body: JSON.stringify({ meshId: id }),
        });
      } catch {
        // 忽略：老任务/fal 通道/网络抖动均直接落到读表
      }

      const { data, error } = await supabase
        .from('meshes')
        .select('*')
        .eq('id', id)
        .limit(1)
        .single()
        .overrideTypes<MeshData>();

      if (error) {
        throw error;
      }

      return data;
    },
    // Poll while pending to ensure UI progresses past 95% as soon as status flips
    refetchInterval: (query) => {
      const current = query.state.data as MeshData | undefined;
      return current && current.status === 'pending' ? 3000 : false;
    },
  });

  const blobQuery = useQuery({
    queryKey: ['mesh', id],
    enabled:
      !!id &&
      !dataQuery.isLoading &&
      dataQuery.data &&
      dataQuery.data.status === 'success',
    queryFn: async () => {
      const fileExtension = dataQuery.data?.file_type || 'glb';
      const { data, error } = await supabase.storage
        .from('meshes')
        .download(
          `${conversation.user_id}/${conversation.id}/${id}.${fileExtension}`,
        );

      if (error) {
        throw error;
      }

      return data;
    },
    refetchOnMount: false,
  });

  return {
    data: dataQuery,
    blob: blobQuery,
  };
};
