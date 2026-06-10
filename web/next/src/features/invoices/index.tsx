import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useStatus } from '@/hooks/use-status'
import { useAuthStore } from '@/stores/auth-store'
import { ROLE } from '@/lib/roles'
import { SectionPageLayout } from '@/components/layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  approveInvoice,
  cancelInvoice,
  createInvoice,
  createRealNameSession,
  getAdminInvoices,
  getEligibleRecords,
  getInvoiceProfiles,
  getRealNameStatus,
  getSelfInvoices,
  issueInvoice,
  rejectInvoice,
  updateInvoiceProfile,
} from './api'
import { AdminInvoiceTable } from './components/admin-invoice-table'
import {
  type AdminInvoiceDialog,
} from './components/admin-invoice-dialogs'
import { EligibleRecordsTable } from './components/eligible-records-table'
import { InvoiceProfilePanel } from './components/invoice-profile-panel'
import { InvoiceRecordsTable } from './components/invoice-records-table'
import { InvoiceRequestForm } from './components/invoice-request-form'
import { VerificationStatusPanel } from './components/verification-status-panel'
import type {
  AdminIssueInvoicePayload,
  ApiResponse,
  InvoiceableRecord,
  InvoiceProfile,
  InvoiceRequestRecord,
  InvoiceType,
  PageResponse,
} from './types'
import './i18n'

const emptyRecordsPage: PageResponse<InvoiceableRecord> = {
  page: 1,
  page_size: 50,
  total: 0,
  items: [],
}

const emptyEligibleItems: InvoiceableRecord[] = []

const emptyInvoicesPage: PageResponse<InvoiceRequestRecord> = {
  page: 1,
  page_size: 20,
  total: 0,
  items: [],
}

function pageOrFallback<T>(
  response: ApiResponse<PageResponse<T>>,
  fallback: PageResponse<T>
) {
  return response.success && response.data ? response.data : fallback
}

function readStringOption(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

function readStringListOption(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (!Array.isArray(value)) continue
    const list = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
    if (list.length > 0) return list
  }
  return []
}

function normalizeProviderName(value: string) {
  return value.trim().toLowerCase()
}

function getConfiguredRealNameProvider(
  status: Record<string, unknown> | null,
  realNameStatus: Record<string, unknown> | null
) {
  const envProvider = normalizeProviderName(
    process.env.NEXT_PUBLIC_REALNAME_PROVIDER || ''
  )

  const providerKeys = [
    'realname_provider',
    'real_name_provider',
    'RealNameProvider',
    'REALNAME_PROVIDER',
  ]
  const providersKeys = [
    'realname_providers',
    'real_name_providers',
    'RealNameProviders',
    'REALNAME_PROVIDERS',
  ]

  const preferredProvider = normalizeProviderName(
    readStringOption(realNameStatus ?? {}, providerKeys) ||
      readStringOption(status ?? {}, providerKeys) ||
      envProvider
  )
  const realNameProviders = readStringListOption(
    realNameStatus ?? {},
    providersKeys
  )
  const statusProviders = readStringListOption(status ?? {}, providersKeys)
  const availableProviders = (
    realNameProviders.length > 0 ? realNameProviders : statusProviders
  ).map(normalizeProviderName)

  if (availableProviders.length === 0) return ''
  if (!preferredProvider) return availableProviders[0]
  if (availableProviders.includes(preferredProvider)) return preferredProvider
  return availableProviders[0]
}

export function Invoices() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.auth.user)
  const isAdmin = Boolean(user?.role && user.role >= ROLE.ADMIN)
  const { status } = useStatus()
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState('apply')
  const [adminDialog, setAdminDialog] = useState<AdminInvoiceDialog>(null)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  const eligibleQuery = useQuery({
    queryKey: ['invoice', 'eligible-records'],
    queryFn: async () =>
      pageOrFallback(
        await getEligibleRecords({ p: 1, page_size: 50 }),
        emptyRecordsPage
      ),
  })
  const profilesQuery = useQuery({
    queryKey: ['invoice', 'profiles'],
    queryFn: async () => {
      const response = await getInvoiceProfiles()
      return response.success ? response.data : undefined
    },
  })
  const realNameQuery = useQuery({
    queryKey: ['realname', 'status'],
    queryFn: async () => {
      const response = await getRealNameStatus()
      return response.success ? response.data : undefined
    },
  })
  const realNameProvider = getConfiguredRealNameProvider(
    status as Record<string, unknown> | null,
    (realNameQuery.data as Record<string, unknown> | null) ?? null
  )
  const selfInvoicesQuery = useQuery({
    queryKey: ['invoice', 'self'],
    queryFn: async () =>
      pageOrFallback(
        await getSelfInvoices({ p: 1, page_size: 20 }),
        emptyInvoicesPage
      ),
  })
  const adminInvoicesQuery = useQuery({
    queryKey: ['invoice', 'admin'],
    queryFn: async () =>
      pageOrFallback(
        await getAdminInvoices({ p: 1, page_size: 20 }),
        emptyInvoicesPage
      ),
    enabled: isAdmin,
  })

  const eligibleItems = eligibleQuery.data?.items ?? emptyEligibleItems
  const selectedRecords = useMemo(
    () =>
      eligibleItems.filter((item) =>
        selectedKeys.includes(`${item.source_type}:${item.source_id}`)
      ),
    [eligibleItems, selectedKeys]
  )
  const profiles = profilesQuery.data

  const invalidateUserInvoiceData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['invoice', 'eligible-records'],
      }),
      queryClient.invalidateQueries({ queryKey: ['invoice', 'self'] }),
      queryClient.invalidateQueries({ queryKey: ['invoice', 'profiles'] }),
    ])
  }

  const saveProfileMutation = useMutation({
    mutationFn: updateInvoiceProfile,
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Invoice profile saved'))
      await queryClient.invalidateQueries({ queryKey: ['invoice', 'profiles'] })
    },
  })

  const createInvoiceMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Invoice request submitted'))
      setSelectedKeys([])
      setActiveTab('history')
      await invalidateUserInvoiceData()
    },
  })

  const startVerificationMutation = useMutation({
    mutationFn: (type: InvoiceType) =>
      createRealNameSession({
        verify_type: type,
        provider: realNameProvider,
      }),
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Verification session created'))
      const redirectUrl = res.data?.session.redirect_url
      if (redirectUrl) window.open(redirectUrl, '_blank', 'noopener,noreferrer')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['realname', 'status'] }),
        queryClient.invalidateQueries({ queryKey: ['invoice', 'profiles'] }),
      ])
    },
  })

  const cancelMutation = useMutation({
    mutationFn: cancelInvoice,
    onMutate: (id) => setCancellingId(id),
    onSettled: () => setCancellingId(null),
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Invoice request cancelled'))
      await invalidateUserInvoiceData()
    },
  })

  const approveMutation = useMutation({
    mutationFn: approveInvoice,
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Invoice request approved'))
      await queryClient.invalidateQueries({ queryKey: ['invoice', 'admin'] })
    },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      rejectInvoice(id, reason),
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Invoice request rejected'))
      await queryClient.invalidateQueries({ queryKey: ['invoice', 'admin'] })
    },
  })
  const issueMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number
      payload: AdminIssueInvoicePayload
    }) => issueInvoice(id, payload),
    onSuccess: async (res) => {
      if (!res.success) return
      toast.success(t('Invoice marked as issued'))
      await queryClient.invalidateQueries({ queryKey: ['invoice', 'admin'] })
    },
  })

  const adminActionLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    issueMutation.isPending

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Invoices')}</SectionPageLayout.Title>
      <SectionPageLayout.Content>
        <div className='mx-auto flex w-full max-w-7xl flex-col gap-4'>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className='h-auto max-w-full flex-wrap justify-start'>
              <TabsTrigger value='apply'>{t('Apply')}</TabsTrigger>
              <TabsTrigger value='profiles'>{t('Invoice profiles')}</TabsTrigger>
              <TabsTrigger value='history'>{t('Invoice history')}</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value='admin'>{t('Admin review')}</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='apply' className='mt-4 space-y-4'>
              <Card className='rounded-lg'>
                <CardHeader>
                  <CardTitle>{t('Invoiceable records')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <EligibleRecordsTable
                    items={eligibleItems}
                    selectedKeys={selectedKeys}
                    onSelectedKeysChange={setSelectedKeys}
                    loading={eligibleQuery.isLoading}
                  />
                </CardContent>
              </Card>
              <InvoiceRequestForm
                selectedRecords={selectedRecords}
                personalProfile={profiles?.personal}
                companyProfile={profiles?.company}
                isLoading={createInvoiceMutation.isPending}
                onSubmit={(payload) =>
                  createInvoiceMutation
                    .mutateAsync(payload)
                    .then(() => undefined)
                }
              />
            </TabsContent>

            <TabsContent value='profiles' className='mt-4 space-y-4'>
              {!realNameProvider && (
                <div className='text-muted-foreground rounded-lg border p-3 text-sm'>
                  {t('Real-name provider not configured')}
                </div>
              )}
              <div className='grid gap-4 xl:grid-cols-2'>
                <div className='space-y-4'>
                  <VerificationStatusPanel
                    type='personal'
                    verification={realNameQuery.data?.personal}
                    providerConfigured={Boolean(realNameProvider)}
                    isLoading={startVerificationMutation.isPending}
                    onStart={(type) => startVerificationMutation.mutate(type)}
                  />
                  <InvoiceProfilePanel
                    type='personal'
                    profile={profiles?.personal}
                    isLoading={saveProfileMutation.isPending}
                    onSave={(profile: InvoiceProfile) =>
                      saveProfileMutation
                        .mutateAsync(profile)
                        .then(() => undefined)
                    }
                  />
                </div>
                <div className='space-y-4'>
                  <VerificationStatusPanel
                    type='company'
                    verification={realNameQuery.data?.company}
                    providerConfigured={Boolean(realNameProvider)}
                    isLoading={startVerificationMutation.isPending}
                    onStart={(type) => startVerificationMutation.mutate(type)}
                  />
                  <InvoiceProfilePanel
                    type='company'
                    profile={profiles?.company}
                    isLoading={saveProfileMutation.isPending}
                    onSave={(profile: InvoiceProfile) =>
                      saveProfileMutation
                        .mutateAsync(profile)
                        .then(() => undefined)
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value='history' className='mt-4'>
              <InvoiceRecordsTable
                items={selfInvoicesQuery.data?.items ?? []}
                onCancel={(invoiceId) => cancelMutation.mutate(invoiceId)}
                cancellingId={cancellingId}
              />
            </TabsContent>

            {isAdmin && (
              <TabsContent value='admin' className='mt-4'>
                <AdminInvoiceTable
                  items={adminInvoicesQuery.data?.items ?? []}
                  dialog={adminDialog}
                  onDialogChange={setAdminDialog}
                  isLoading={adminActionLoading}
                  onApprove={(invoiceId) =>
                    approveMutation.mutateAsync(invoiceId).then(() => undefined)
                  }
                  onReject={(invoiceId, reason) =>
                    rejectMutation
                      .mutateAsync({ id: invoiceId, reason })
                      .then(() => undefined)
                  }
                  onIssue={(invoiceId, payload) =>
                    issueMutation
                      .mutateAsync({ id: invoiceId, payload })
                      .then(() => undefined)
                  }
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
