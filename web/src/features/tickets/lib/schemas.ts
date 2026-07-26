import { z } from 'zod'

export const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  category: z.string().min(1, 'Category is required'),
  priority: z.number().min(1).max(3),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
})

export const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
})

export const updateStatusSchema = z.object({
  status: z.number().min(0).max(4).optional(),
  priority: z.number().min(1).max(3).optional(),
})

export type CreateTicketForm = z.infer<typeof createTicketSchema>
export type SendMessageForm = z.infer<typeof sendMessageSchema>
export type UpdateStatusForm = z.infer<typeof updateStatusSchema>
