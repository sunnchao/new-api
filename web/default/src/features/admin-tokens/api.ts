import { api } from '@/lib/api'
import type {
  GetAdminTokensParams,
  GetAdminTokensResponse,
  SearchAdminTokensParams,
} from './types'

export async function getAdminTokens(
  params: GetAdminTokensParams = {}
): Promise<GetAdminTokensResponse> {
  const { p = 1, page_size = 20 } = params
  const res = await api.get(
    `/api/admin/token/list?p=${p}&page_size=${page_size}`
  )
  return res.data
}

export async function searchAdminTokens(
  params: SearchAdminTokensParams = {}
): Promise<GetAdminTokensResponse> {
  const { keyword = '', token = '', p = 1, page_size = 20 } = params
  const queryParams = new URLSearchParams()
  if (keyword) queryParams.set('keyword', keyword)
  if (token) queryParams.set('token', token)
  queryParams.set('p', String(p))
  queryParams.set('page_size', String(page_size))

  const res = await api.get(`/api/admin/token/search?${queryParams.toString()}`)
  return res.data
}
