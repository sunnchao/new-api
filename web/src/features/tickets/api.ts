import { api } from '@/lib/api'
import type {
  TicketCategory,
  TicketDetailResponse,
  CreateTicketRequest,
  SendTicketMessageRequest,
  UpdateTicketStatusRequest,
  AssignTicketRequest,
} from './types'

export async function getUserTickets(
  params: {
    p?: number
    page_size?: number
    status?: number
  } = {}
) {
  const { p = 1, page_size = 10, status } = params
  const query = new URLSearchParams({
    p: String(p),
    page_size: String(page_size),
  })
  if (status) query.set('status', String(status))
  const res = await api.get(`/api/ticket/self?${query}`)
  return res.data
}

export async function searchUserTickets(params: {
  keyword?: string
  p?: number
  page_size?: number
}) {
  const { keyword = '', p = 1, page_size = 10 } = params
  const res = await api.get(
    `/api/ticket/self/search?keyword=${keyword}&p=${p}&page_size=${page_size}`
  )
  return res.data
}

export async function getTicketDetail(
  id: number
): Promise<{ success: boolean; data?: TicketDetailResponse }> {
  const res = await api.get(`/api/ticket/${id}`)
  return res.data
}

export async function createTicket(data: CreateTicketRequest) {
  const res = await api.post('/api/ticket/', data)
  return res.data
}

export async function sendTicketMessage(
  id: number,
  data: SendTicketMessageRequest
) {
  const res = await api.post(`/api/ticket/${id}/message`, data)
  return res.data
}

export async function uploadTicketAttachment(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await api.post('/api/ticket/attachments', formData, {
    skipBusinessError: true,
    skipErrorHandler: true,
  })
  return res.data
}

export async function closeTicket(id: number) {
  const res = await api.put(`/api/ticket/${id}/close`)
  return res.data
}

export async function getAllTickets(
  params: {
    p?: number
    page_size?: number
    status?: number
    category?: string
    priority?: number
    assigned_admin_id?: number
  } = {}
) {
  const { p = 1, page_size = 10, ...rest } = params
  const query = new URLSearchParams({
    p: String(p),
    page_size: String(page_size),
  })
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== '') query.set(k, String(v))
  })
  const res = await api.get(`/api/ticket/?${query}`)
  return res.data
}

export async function searchTickets(params: {
  keyword?: string
  status?: number
  p?: number
  page_size?: number
}) {
  const { keyword = '', status, p = 1, page_size = 10 } = params
  const query = new URLSearchParams({
    keyword,
    p: String(p),
    page_size: String(page_size),
  })
  if (status) query.set('status', String(status))
  const res = await api.get(`/api/ticket/search?${query}`)
  return res.data
}

export async function updateTicketStatus(
  id: number,
  data: UpdateTicketStatusRequest
) {
  const res = await api.put(`/api/ticket/${id}/status`, data)
  return res.data
}

export async function assignTicket(id: number, data: AssignTicketRequest) {
  const res = await api.put(`/api/ticket/${id}/assign`, data)
  return res.data
}

export async function deleteTicket(id: number) {
  const res = await api.delete(`/api/ticket/${id}`)
  return res.data
}

export async function getTicketCategories(): Promise<{
  success: boolean
  data?: TicketCategory[]
}> {
  const res = await api.get('/api/ticket/categories')
  return res.data
}

export async function updateTicketCategories(categories: TicketCategory[]) {
  const res = await api.put('/api/ticket/categories', categories)
  return res.data
}
