import type { ApiKey } from '@/features/keys/types'

export type AdminToken = ApiKey & {
  user_id: number
  user_name?: string
  backup_group?: string
  mj_model?: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
}

export interface GetAdminTokensParams {
  p?: number
  page_size?: number
}

export interface GetAdminTokensResponse {
  success: boolean
  message?: string
  data?: {
    items: AdminToken[]
    total: number
    page: number
    page_size: number
  }
}

export interface SearchAdminTokensParams {
  keyword?: string
  token?: string
  p?: number
  page_size?: number
}
