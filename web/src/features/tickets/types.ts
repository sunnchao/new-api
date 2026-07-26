import { z } from 'zod'

export const ticketSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  title: z.string(),
  category: z.string(),
  priority: z.number(),
  status: z.number(),
  description: z.string(),
  attachment_urls: z.string(),
  created_at: z.number(),
  updated_at: z.number(),
  closed_at: z.number(),
  assigned_admin_id: z.number(),
})

export const ticketMessageSchema = z.object({
  id: z.number(),
  ticket_id: z.number(),
  user_id: z.number(),
  is_admin: z.boolean(),
  content: z.string(),
  attachment_urls: z.string().optional().default(''),
  created_at: z.number(),
})

export const ticketCategorySchema = z.object({
  value: z.string(),
  label: z.string(),
})

export type Ticket = z.infer<typeof ticketSchema>
export type TicketMessage = z.infer<typeof ticketMessageSchema>
export type TicketCategory = z.infer<typeof ticketCategorySchema>

export interface TicketDetailResponse {
  ticket: Ticket
  messages: TicketMessage[]
  user_context?: Record<string, unknown>
}

export interface CreateTicketRequest {
  title: string
  category: string
  priority: number
  description: string
  attachment_urls?: string
}

export interface SendTicketMessageRequest {
  content: string
  attachment_urls?: string
}

export interface UpdateTicketStatusRequest {
  status?: number
  priority?: number
}

export interface AssignTicketRequest {
  admin_id: number
}
