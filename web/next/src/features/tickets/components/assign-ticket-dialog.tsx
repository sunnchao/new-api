'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { assignTicket } from '../api'
import { SUCCESS_MESSAGES } from '../constants'

interface AssignTicketDialogProps {
  ticketId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AssignTicketDialog({
  ticketId,
  open,
  onOpenChange,
}: AssignTicketDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [adminId, setAdminId] = useState('')

  const mutation = useMutation({
    mutationFn: () => assignTicket(ticketId, { admin_id: Number(adminId) }),
    onSuccess: () => {
      toast.success(t(SUCCESS_MESSAGES.TICKET_ASSIGNED))
      queryClient.invalidateQueries({ queryKey: ['ticket-detail', ticketId] })
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      onOpenChange(false)
      setAdminId('')
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Assign Ticket')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label className='text-sm font-medium'>{t('Admin ID')}</label>
            <Input
              type='number'
              placeholder={t('Admin ID')}
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!adminId || mutation.isPending}
          >
            {t('Assign')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
