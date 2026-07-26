import { useTranslation } from 'react-i18next'
import { SectionPageLayout } from '@/components/layout'
import '@/features/keys/i18n'
import { AdminTokensDialogs } from './components/admin-tokens-dialogs'
import { AdminTokensPrimaryButtons } from './components/admin-tokens-primary-buttons'
import { AdminTokensProvider } from './components/admin-tokens-provider'
import { AdminTokensTable } from './components/admin-tokens-table'
import './i18n'

export function AdminTokens() {
  const { t } = useTranslation()

  return (
    <AdminTokensProvider>
      <SectionPageLayout>
        <SectionPageLayout.Title>
          {t('Token Management')}
        </SectionPageLayout.Title>
        <SectionPageLayout.Actions>
          <AdminTokensPrimaryButtons />
        </SectionPageLayout.Actions>
        <SectionPageLayout.Content>
          <AdminTokensTable />
        </SectionPageLayout.Content>
      </SectionPageLayout>

      <AdminTokensDialogs />
    </AdminTokensProvider>
  )
}
