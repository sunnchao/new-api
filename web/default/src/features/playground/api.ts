import { api } from '@/lib/api'
import { API_ENDPOINTS } from './constants'
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ModelOption,
  GroupOption,
} from './types'

/**
 * Send chat completion request (non-streaming)
 */
export async function sendChatCompletion(
  payload: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  const res = await api.post(API_ENDPOINTS.CHAT_COMPLETIONS, payload, {
    skipErrorHandler: true,
  } as Record<string, unknown>)
  return res.data
}

/**
 * Get user available models, with per-model enable_groups mapping for client-side filtering.
 */
export async function getUserModels(): Promise<{
  models: ModelOption[]
  modelGroups: Record<string, string[]>
  autoGroups: string[]
}> {
  const res = await api.get(API_ENDPOINTS.USER_MODELS)
  const { data } = res

  if (!data.success || !Array.isArray(data.data)) {
    return { models: [], modelGroups: {}, autoGroups: [] }
  }

  const models = (data.data as string[]).map((model) => ({
    label: model,
    value: model,
  }))
  const modelGroups =
    (data.model_groups as Record<string, string[]> | undefined) ?? {}
  const autoGroups = (data.auto_groups as string[] | undefined) ?? []

  return { models, modelGroups, autoGroups }
}

/**
 * Get user groups
 */
export async function getUserGroups(): Promise<GroupOption[]> {
  const res = await api.get(API_ENDPOINTS.USER_GROUPS)
  const { data } = res

  if (!data.success || !data.data) {
    return []
  }

  const groupData = data.data as Record<string, { desc: string; ratio: number }>

  // label is for button display (name only); desc is for dropdown content
  return Object.entries(groupData).map(([group, info]) => ({
    label: group,
    value: group,
    ratio: info.ratio,
    desc: info.desc,
  }))
}
