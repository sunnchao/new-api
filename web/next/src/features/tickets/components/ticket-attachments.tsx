'use client'

import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { uploadTicketAttachment } from '../api'
import { MAX_ATTACHMENT_COUNT } from '../constants'

function resolveAttachmentUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return url.startsWith('/') ? url : `/${url}`
}

export function parseAttachmentUrls(urlStr: string | undefined): string[] {
  if (!urlStr) return []
  return urlStr
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
}

export function serializeAttachmentUrls(urls: string[]): string {
  return urls.join(',')
}

export function TicketAttachmentList(props: {
  urls: string[]
  onRemove?: (url: string) => void
}) {
  const { t } = useTranslation()
  if (props.urls.length === 0) return null

  return (
    <div className='grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2'>
      {props.urls.map((url) => (
        <div
          key={url}
          className='group bg-muted relative aspect-square overflow-hidden rounded-md border'
        >
          <a
            href={resolveAttachmentUrl(url)}
            target='_blank'
            rel='noreferrer'
            title={t('Open attachment')}
          >
            <img
              src={resolveAttachmentUrl(url)}
              alt={t('Attachment image')}
              loading='lazy'
              className='size-full object-cover'
            />
          </a>
          {props.onRemove && (
            <button
              type='button'
              className='absolute top-1.5 right-1.5 inline-flex size-6 items-center justify-center rounded-full bg-black/60 text-white opacity-90 transition hover:bg-black/75'
              title={t('Remove attachment')}
              onClick={() => props.onRemove?.(url)}
            >
              <X className='size-3.5' />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

export function TicketAttachmentUploader(props: {
  value: string[]
  onChange: (urls: string[]) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploading, setUploading] = useState(false)

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const remaining = MAX_ATTACHMENT_COUNT - props.value.length
    if (remaining <= 0) {
      toast.error(t('You can upload up to 6 images'))
      return
    }

    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    )
    if (imageFiles.length !== files.length) {
      toast.error(t('Only image files are supported'))
    }
    if (imageFiles.length === 0) return

    const selectedFiles = imageFiles.slice(0, remaining)
    if (imageFiles.length > remaining) {
      toast.error(t('You can upload up to 6 images'))
    }

    setUploading(true)
    const uploadedUrls: string[] = []
    try {
      for (const file of selectedFiles) {
        const res = await uploadTicketAttachment(file)
        if (res.success && res.data?.url) {
          uploadedUrls.push(res.data.url)
        } else {
          toast.error(res.message || t('Attachment upload failed'))
        }
      }
      if (uploadedUrls.length > 0) {
        props.onChange([...props.value, ...uploadedUrls])
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t('Attachment upload failed')
      toast.error(message)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className='space-y-2'>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        multiple
        className='hidden'
        onChange={(event) => uploadFiles(event.target.files)}
      />
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={
            props.disabled ||
            uploading ||
            props.value.length >= MAX_ATTACHMENT_COUNT
          }
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className='mr-2 size-4' />
          {uploading ? t('Uploading image') : t('Upload images')}
        </Button>
        <span className='text-muted-foreground text-xs'>
          {t('Only image files are supported')} · {props.value.length}/
          {MAX_ATTACHMENT_COUNT}
        </span>
      </div>
      <TicketAttachmentList
        urls={props.value}
        onRemove={
          props.disabled
            ? undefined
            : (url) =>
                props.onChange(props.value.filter((item) => item !== url))
        }
      />
    </div>
  )
}
