import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { useAdminTokens } from './admin-tokens-provider'

export function AdminTokensPrimaryButtons() {
  const { t } = useTranslation()
  const { setCurrentRow, setOpen } = useAdminTokens()

  return (
    <Button
      size='sm'
      onClick={() => {
        setCurrentRow(null)
        setOpen('create')
      }}
    >
      <Plus className='size-4' />
      {t('Create API Key')}
    </Button>
  )
}
