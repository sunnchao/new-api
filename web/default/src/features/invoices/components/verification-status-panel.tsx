import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import {
  getRealNameStatusLabelKey,
  getRealNameStatusVariant,
} from '../lib/format'
import type { InvoiceType, RealNameVerification } from '../types'

type Props = {
  type: InvoiceType
  verification?: RealNameVerification | null
  providerConfigured?: boolean
  isLoading?: boolean
  onStart: (type: InvoiceType) => void
}

export function VerificationStatusPanel({
  type,
  verification,
  providerConfigured = false,
  isLoading,
  onStart,
}: Props) {
  const { t } = useTranslation()
  const isVerified = verification?.status === 'verified'

  return (
    <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4'>
      <div className='flex min-w-0 items-center gap-3'>
        <ShieldCheck className='text-muted-foreground size-5 shrink-0' />
        <div className='min-w-0 space-y-1'>
          <div className='font-medium'>
            {t(
              type === 'company'
                ? 'Company verification'
                : 'Personal verification'
            )}
          </div>
          <StatusBadge
            copyable={false}
            variant={getRealNameStatusVariant(verification?.status)}
            label={t(getRealNameStatusLabelKey(verification?.status))}
          />
        </div>
      </div>
      <Button
        variant='outline'
        disabled={isLoading || isVerified || !providerConfigured}
        onClick={() => onStart(type)}
      >
        {t(isVerified ? 'Verified' : 'Start verification')}
      </Button>
    </div>
  )
}
