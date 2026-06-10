'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { createTicket, getTicketCategories, isTicketActionSuccess } from '../api'
import { TicketAttachmentUploader, serializeAttachmentUrls } from './ticket-attachments'

const createTicketSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  category: z.string().min(1, 'Category is required'),
  priority: z.number().min(1).max(3),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
})

type CreateTicketForm = z.infer<typeof createTicketSchema>

export function CreateTicketDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [attachments, setAttachments] = useState<string[]>([])

  const { data: categoriesData } = useQuery({
    queryKey: ['ticket-categories'],
    queryFn: getTicketCategories,
  })
  const categories = categoriesData?.data || []

  const createMutation = useMutation({
    mutationFn: createTicket,
    onSuccess: (response) => {
      if (!isTicketActionSuccess(response)) return

      toast.success(t('Ticket created successfully'))
      queryClient.invalidateQueries({ queryKey: ['tickets'] })
      form.reset()
      setAttachments([])
      props.onOpenChange(false)
    },
  })

  const form = useForm<CreateTicketForm>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: '', category: '', priority: 1, description: '' },
  })

  const onSubmit = (data: CreateTicketForm) => {
    createMutation.mutate({
      ...data,
      attachment_urls: serializeAttachmentUrls(attachments),
    })
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('Create Ticket')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Title')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='category'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Category')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('All Categories')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='priority'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Priority')}</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(Number(v))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='1'>{t('Low')}</SelectItem>
                      <SelectItem value='2'>{t('Medium')}</SelectItem>
                      <SelectItem value='3'>{t('High')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Description')}</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='space-y-2'>
              <FormLabel>{t('Attachments')}</FormLabel>
              <TicketAttachmentUploader
                value={attachments}
                onChange={setAttachments}
                disabled={createMutation.isPending}
              />
            </div>
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setAttachments([])
                  props.onOpenChange(false)
                }}
              >
                {t('Cancel')}
              </Button>
              <Button type='submit' disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? t('Creating') + '...'
                  : t('Create Ticket')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
