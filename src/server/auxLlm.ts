import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { ProviderOptions } from '@ai-sdk/provider-utils';
import { env, requiredEnv } from './env';

// 辅助 AI 能力（提示词优化、自动会话标题、后续建议）的统一模型选择。
// 配置了中转（OPENROUTER_BASE_URL）时优先走中转（与主生成同一通道），
// 否则回落 Anthropic 直连（上游原始行为，使用 Haiku 小模型）。
export function auxLlmEnabled(): boolean {
  return Boolean(
    env('OPENROUTER_BASE_URL').trim() || env('ANTHROPIC_API_KEY').trim(),
  );
}

function normalizedAnthropicBaseURL(): string | undefined {
  const raw = env('ANTHROPIC_BASE_URL').trim();
  if (!raw) return undefined;
  const base = raw.replace(/\/+$/, '');
  return base.endsWith('/v1') ? base : `${base}/v1`;
}

// 辅助任务（标题/建议/提示词）是轻任务：推理模型走中转时压到最低
// 思考深度，延迟从 10-30s 降到 2-5s（实测推理 token 归零）。
export function auxProviderOptions(): ProviderOptions | undefined {
  if (env('OPENROUTER_BASE_URL').trim()) {
    return { openai: { reasoningEffort: 'low' } };
  }
  return undefined;
}

export function auxModel(): LanguageModel {
  const relayBase = env('OPENROUTER_BASE_URL').trim();
  if (relayBase) {
    const openai = createOpenAI({
      apiKey: requiredEnv('OPENROUTER_API_KEY'),
      baseURL: relayBase,
    });
    const modelId = (env('VITE_DEFAULT_MODEL').trim() || 'openai/gpt-5.6-sol')
      .split('/')
      .pop()!;
    return openai.responses(modelId);
  }
  const baseURL = normalizedAnthropicBaseURL();
  const anthropic = createAnthropic({
    apiKey: requiredEnv('ANTHROPIC_API_KEY'),
    ...(baseURL ? { baseURL } : {}),
  });
  return anthropic('claude-haiku-4-5');
}
