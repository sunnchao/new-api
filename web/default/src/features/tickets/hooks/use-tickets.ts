import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import * as ticketApi from '../api'
import { SUCCESS_MESSAGES } from '../constants'
import type { CreateTicketRequest, SendTicketMessageRequest, UpdateTicketStatusRequest, AssignTicketRequest } from '../types'

export function useUserTickets(params: { p?: number; page_size?: number; status?: number } = {}) {
  return useQuery({
    queryKey: ['tickets', 'user', params],
    queryFn: () => ticketApi.getUserTickets(params),
  })
}

export function useTicketDetail(id: number) {
  return useQuery({
    queryKey: ['ticket', id],
    queryFn: () => ticketApi.getTicketDetail(id),
    enabled: id > 0,
  })
}

export function useTicketCategories() {
  return useQuery({
    queryKey: ['ticket-categories'],
    queryFn: ticketApi.getTicketCategories,
  })
}

export function useAllTickets(params: { p?: number; page_size?: number; status?: number; category?: string; priority?: number } = {}) {
  return useQuery({
    queryKey: ['tickets', 'admin', params],
    queryFn: () => ticketApi.getAllTickets(params),
  })
}

export function useCreateTicket() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTicketRequest) => ticketApi.createTicket(data),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_CREATED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useSendTicketMessage(ticketId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: SendTicketMessageRequest) => ticketApi.sendTicketMessage(ticketId, data),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.MESSAGE_SENT))
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useCloseTicket() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ticketApi.closeTicket(id),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_CLOSED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useUpdateTicketStatus(ticketId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTicketStatusRequest) => ticketApi.updateTicketStatus(ticketId, data),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.STATUS_UPDATED))
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}

export function useAssignTicket(ticketId: number) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignTicketRequest) => ticketApi.assignTicket(ticketId, data),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_ASSIGNED))
      queryClient.invalidateQueries({ queryKey: ['ticket', ticketId] })
    },
  })
}

export function useDeleteTicket() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => ticketApi.deleteTicket(id),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_DELETED))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
    },
  })
}
