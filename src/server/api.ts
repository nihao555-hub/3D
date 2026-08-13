import type { User } from '@supabase/supabase-js';
import { getAnonSupabaseClient } from './supabaseClient';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: corsHeaders,
  });
}

export function preflight() {
  return new Response('ok', { headers: corsHeaders });
}

export function methodNotAllowed() {
  return json({ error: 'method_not_allowed' }, 405);
}

export function isUnauthorizedError(error: unknown) {
  return error instanceof Error && error.message === 'Unauthorized';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function requireUser(request: Request): Promise<User> {
  const supabase = getAnonSupabaseClient({
    global: {
      headers: { Authorization: request.headers.get('Authorization') ?? '' },
    },
  });
  const { data, error } = await supabase.auth.getUser();
  // 匿名（访客）用户没有邮箱，仅要求存在有效用户
  if (error || !data.user) throw new Error('Unauthorized');
  return data.user;
}
