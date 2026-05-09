import { api } from '@/lib/api'
import type {
  AdminIssueInvoicePayload,
  ApiResponse,
  CreateInvoicePayload,
  CreateRealNameSessionPayload,
  CreateRealNameSessionResponse,
  InvoiceProfile,
  InvoiceProfiles,
  InvoiceRequestRecord,
  InvoiceableTopUp,
  PageResponse,
  RealNameStatusMap,
  UpdateInvoiceProfilePayload,
} from './types'

export async function getEligibleTopUps(params: {
  p: number
  page_size: number
  keyword?: string
}): Promise<ApiResponse<PageResponse<InvoiceableTopUp>>> {
  const res = await api.get('/api/invoice/eligible-topups', { params })
  return res.data
}

export async function getSelfInvoices(params: {
  p: number
  page_size: number
  status?: string
}): Promise<ApiResponse<PageResponse<InvoiceRequestRecord>>> {
  const res = await api.get('/api/invoice/self', { params })
  return res.data
}

export async function getInvoiceDetail(
  id: number
): Promise<ApiResponse<InvoiceRequestRecord>> {
  const res = await api.get(`/api/invoice/${id}`)
  return res.data
}

export async function createInvoice(
  payload: CreateInvoicePayload
): Promise<ApiResponse<InvoiceRequestRecord>> {
  const res = await api.post('/api/invoice', payload)
  return res.data
}

export async function cancelInvoice(id: number): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/${id}/cancel`)
  return res.data
}

export async function getInvoiceProfiles(): Promise<
  ApiResponse<InvoiceProfiles>
> {
  const res = await api.get('/api/invoice/profile')
  return res.data
}

export async function updateInvoiceProfile(
  payload: UpdateInvoiceProfilePayload
): Promise<ApiResponse<InvoiceProfile>> {
  const res = await api.put('/api/invoice/profile', payload)
  return res.data
}

export async function getRealNameStatus(): Promise<
  ApiResponse<RealNameStatusMap>
> {
  const res = await api.get('/api/realname/status')
  return res.data
}

export async function createRealNameSession(
  payload: CreateRealNameSessionPayload
): Promise<ApiResponse<CreateRealNameSessionResponse>> {
  const res = await api.post('/api/realname/session', payload)
  return res.data
}

export async function getAdminInvoices(params: {
  p: number
  page_size: number
  status?: string
  keyword?: string
}): Promise<ApiResponse<PageResponse<InvoiceRequestRecord>>> {
  const res = await api.get('/api/invoice/admin', { params })
  return res.data
}

export async function approveInvoice(id: number): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/admin/${id}/approve`)
  return res.data
}

export async function rejectInvoice(
  id: number,
  rejectReason: string
): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/admin/${id}/reject`, {
    reject_reason: rejectReason,
  })
  return res.data
}

export async function issueInvoice(
  id: number,
  payload: AdminIssueInvoicePayload
): Promise<ApiResponse> {
  const res = await api.post(`/api/invoice/admin/${id}/issue`, payload)
  return res.data
}
