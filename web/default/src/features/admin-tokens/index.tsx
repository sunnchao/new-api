import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import { AdminTokensTable } from './components/admin-tokens-table'

export function AdminTokens() {
  const { t } = useTranslation()

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Token Management')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <AdminTokensTable />
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
