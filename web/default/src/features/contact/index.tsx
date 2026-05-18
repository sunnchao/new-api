/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useState, type ElementType } from 'react'
import { Mail, MessageCircle, QrCode } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import './i18n'
import qqGroupQrCode from '@/assets/qq-group-qrcode.jpg'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CopyButton } from '@/components/copy-button'
import { PublicLayout } from '@/components/layout'

type ContactMethod = {
  title: string
  description: string
  value: string
  href?: string
  external?: boolean
  qrCodeSrc?: string
  icon: ElementType
  toneClassName: string
}

export function Contact() {
  const { t } = useTranslation()
  const [qrCodeMethod, setQrCodeMethod] = useState<ContactMethod | null>(null)
  const contactMethods: ContactMethod[] = [
    {
      title: t('Email support'),
      description: t('Reply within 24 hours.'),
      value: 'chirou.api@outlook.com',
      href: 'mailto:chirou.api@outlook.com',
      icon: Mail,
      toneClassName:
        'bg-sky-500/10 text-sky-600 ring-sky-500/20 dark:text-sky-300',
    },
    {
      title: t('QQ group'),
      description: t('User updates and community help.'),
      value: '924076327',
      qrCodeSrc: qqGroupQrCode,
      icon: MessageCircle,
      toneClassName:
        'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-300',
    },
  ]

  return (
    <PublicLayout showMainContainer={false}>
      <main className='mx-auto flex min-h-svh w-full max-w-6xl flex-col px-4 pt-24 pb-12 sm:px-6 lg:px-8'>
        <section className='mx-auto max-w-3xl text-center'>
          <Badge variant='outline' className='mb-4'>
            {t('Support channels')}
          </Badge>
          <h1 className='text-3xl leading-tight font-semibold tracking-tight sm:text-4xl'>
            {t('Contact us')}
          </h1>
          <p className='text-muted-foreground mt-4 text-base leading-7'>
            {t('Classic homepage contact details.')}
          </p>
        </section>

        <section className='mx-auto mt-10 grid w-full max-w-3xl gap-4 md:grid-cols-2'>
          {contactMethods.map((method) => {
            const Icon = method.icon

            return (
              <Card key={method.title} className='rounded-lg'>
                <CardHeader>
                  <div className='flex items-start justify-between gap-4'>
                    <div
                      className={cn(
                        'flex size-11 shrink-0 items-center justify-center rounded-lg ring-1',
                        method.toneClassName
                      )}
                    >
                      <Icon className='size-5' />
                    </div>
                    <div className='flex items-center gap-1'>
                      {method.qrCodeSrc ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => setQrCodeMethod(method)}
                                aria-label={t('View QR code')}
                              >
                                <QrCode className='size-4' />
                              </Button>
                            }
                          />
                          <TooltipContent>
                            <p>{t('View QR code')}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                      <CopyButton
                        value={method.value}
                        tooltip={t('Copy contact')}
                        successTooltip={t('Copied!')}
                        aria-label={t('Copy contact')}
                      />
                    </div>
                  </div>
                  <CardTitle>{method.title}</CardTitle>
                  <CardDescription>{method.description}</CardDescription>
                </CardHeader>
                <CardContent className='mt-auto space-y-4'>
                  {method.href ? (
                    <a
                      href={method.href}
                      target={method.external ? '_blank' : undefined}
                      rel={method.external ? 'noopener noreferrer' : undefined}
                      className='bg-muted/50 hover:bg-muted flex min-h-10 items-center justify-between gap-3 rounded-md px-3 py-2 font-mono text-sm break-all transition-colors'
                    >
                      <span>{method.value}</span>
                    </a>
                  ) : (
                    <p className='bg-muted/50 min-h-10 rounded-md px-3 py-2 font-mono text-sm break-all'>
                      {method.value}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </section>

        <Dialog
          open={Boolean(qrCodeMethod)}
          onOpenChange={(open) => {
            if (!open) setQrCodeMethod(null)
          }}
        >
          <DialogContent className='sm:max-w-lg'>
            <DialogHeader className='pr-8'>
              <DialogTitle>{t('QQ group QR code')}</DialogTitle>
              <DialogDescription>
                {t('Scan the QR code to join the QQ group.')}
              </DialogDescription>
            </DialogHeader>
            <div className='bg-muted/50 rounded-lg p-3'>
              {qrCodeMethod?.qrCodeSrc ? (
                <img
                  src={qrCodeMethod.qrCodeSrc}
                  alt={t('QQ group QR code')}
                  className='mx-auto max-h-[76vh] w-full rounded-md object-contain'
                />
              ) : null}
            </div>
            <p className='text-muted-foreground text-center font-mono text-xs'>
              {qrCodeMethod?.value}
            </p>
          </DialogContent>
        </Dialog>
      </main>
    </PublicLayout>
  )
}
