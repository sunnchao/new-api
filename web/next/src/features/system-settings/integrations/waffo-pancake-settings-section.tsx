"use client";

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
import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  createWaffoPancakePair,
  listWaffoPancakeCatalog,
  saveWaffoPancakeConfig,
} from '../api'
import type {
  WaffoPancakeCatalogStore,
  WaffoPancakePairResult,
} from '../types'
import { SettingsSection } from '../components/settings-section'
import { useUpdateOption } from '../hooks/use-update-option'
import { removeTrailingSlash } from './utils'

export interface WaffoPancakeSettingsValues {
  WaffoPancakeMerchantID: string
  WaffoPancakePrivateKey: string
  WaffoPancakeStoreID: string
  WaffoPancakeProductID: string
  WaffoPancakeReturnURL: string
  WaffoPancakeUnitPrice: number
  WaffoPancakeMinTopUp: number
}

interface Props {
  defaultValues: WaffoPancakeSettingsValues
}

const PANCAKE_DASHBOARD_URL = 'https://pancake.waffo.ai/merchant/dashboard'
const DEFAULT_NEW_STORE_NAME = 'new-api-store'
const DEFAULT_NEW_PRODUCT_NAME = 'new-api-charge-product'
const DEFAULT_NEW_PAIR_NAME = `${DEFAULT_NEW_STORE_NAME} + ${DEFAULT_NEW_PRODUCT_NAME}`

function getErrorText(value: unknown): string | undefined {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'error' in value) {
    const error = (value as { error?: unknown }).error
    return typeof error === 'string' ? error : undefined
  }
  return undefined
}

export function WaffoPancakeSettingsSection(props: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const updateOption = useUpdateOption()
  const [values, setValues] = React.useState<WaffoPancakeSettingsValues>(
    props.defaultValues
  )
  const [savedBinding, setSavedBinding] = React.useState({
    storeID: props.defaultValues.WaffoPancakeStoreID,
    productID: props.defaultValues.WaffoPancakeProductID,
  })
  const [catalog, setCatalog] = React.useState<WaffoPancakeCatalogStore[]>([])
  const [selectedStoreID, setSelectedStoreID] = React.useState(
    props.defaultValues.WaffoPancakeStoreID
  )
  const [selectedProductID, setSelectedProductID] = React.useState(
    props.defaultValues.WaffoPancakeProductID
  )
  const [loadingCatalog, setLoadingCatalog] = React.useState(false)
  const [creatingPair, setCreatingPair] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  const {
    WaffoPancakeMerchantID,
    WaffoPancakePrivateKey,
    WaffoPancakeStoreID,
    WaffoPancakeProductID,
    WaffoPancakeReturnURL,
    WaffoPancakeUnitPrice,
    WaffoPancakeMinTopUp,
  } = props.defaultValues

  React.useEffect(() => {
    setValues({
      WaffoPancakeMerchantID,
      WaffoPancakePrivateKey,
      WaffoPancakeStoreID,
      WaffoPancakeProductID,
      WaffoPancakeReturnURL,
      WaffoPancakeUnitPrice,
      WaffoPancakeMinTopUp,
    })
    setSavedBinding({
      storeID: WaffoPancakeStoreID,
      productID: WaffoPancakeProductID,
    })
    setSelectedStoreID(WaffoPancakeStoreID)
    setSelectedProductID(WaffoPancakeProductID)
  }, [
    WaffoPancakeMerchantID,
    WaffoPancakePrivateKey,
    WaffoPancakeStoreID,
    WaffoPancakeProductID,
    WaffoPancakeReturnURL,
    WaffoPancakeUnitPrice,
    WaffoPancakeMinTopUp,
  ])

  const setValue = React.useCallback(
    <K extends keyof WaffoPancakeSettingsValues>(
      key: K,
      value: WaffoPancakeSettingsValues[K]
    ) => {
      setValues((previous) => ({ ...previous, [key]: value }))
    },
    []
  )

  const storeSelectItems = React.useMemo(() => {
    const items = catalog.map((store) => ({
      value: store.id,
      label: `${store.name} (${store.id})`,
    }))
    if (selectedStoreID && !catalog.some((store) => store.id === selectedStoreID)) {
      items.push({ value: selectedStoreID, label: selectedStoreID })
    }
    return items
  }, [catalog, selectedStoreID])

  const productsForSelectedStore = React.useMemo(() => {
    if (!selectedStoreID) return []
    return (
      catalog.find((store) => store.id === selectedStoreID)?.onetimeProducts ??
      []
    )
  }, [catalog, selectedStoreID])

  const productSelectItems = React.useMemo(() => {
    const items = productsForSelectedStore.map((product) => ({
      value: product.id,
      label: `${product.name} (${product.id})`,
    }))
    if (
      selectedProductID &&
      !productsForSelectedStore.some((product) => product.id === selectedProductID)
    ) {
      items.push({ value: selectedProductID, label: selectedProductID })
    }
    return items
  }, [productsForSelectedStore, selectedProductID])

  const loadCatalog = React.useCallback(
    async (preselect?: { storeID?: string; productID?: string }) => {
      const merchantID = values.WaffoPancakeMerchantID.trim()
      const privateKey = values.WaffoPancakePrivateKey.trim()
      const credsEdited =
        merchantID !== props.defaultValues.WaffoPancakeMerchantID.trim() ||
        privateKey.length > 0
      const requestMerchantID = credsEdited ? merchantID : ''
      const requestPrivateKey = credsEdited ? privateKey : ''

      if (credsEdited && (!requestMerchantID || !requestPrivateKey)) {
        toast.error(t('Merchant ID and API Private Key are required'))
        return
      }

      if (!credsEdited && !props.defaultValues.WaffoPancakeMerchantID.trim()) {
        toast.error(t('Merchant ID and API Private Key are required'))
        return
      }

      setLoadingCatalog(true)
      try {
        const response = await listWaffoPancakeCatalog(
          requestMerchantID,
          requestPrivateKey
        )

        if (response.message !== 'success' || !response.data) {
          toast.error(
            getErrorText(response.data) ||
              t('Credentials verification failed')
          )
          return
        }

        if (typeof response.data === 'string') {
          toast.error(response.data || t('Credentials verification failed'))
          return
        }

        const stores = response.data.stores ?? []
        setCatalog(stores)

        if (preselect?.storeID || preselect?.productID) {
          setSelectedStoreID(preselect.storeID ?? '')
          setSelectedProductID(preselect.productID ?? '')
          return
        }

        if (selectedProductID) {
          const boundStore = stores.find((store) =>
            store.onetimeProducts.some(
              (product) => product.id === selectedProductID
            )
          )
          if (boundStore) {
            setSelectedStoreID(boundStore.id)
            return
          }
        }

        const firstStoreWithProducts = stores.find(
          (store) => store.onetimeProducts.length > 0
        )
        if (firstStoreWithProducts) {
          setSelectedStoreID(firstStoreWithProducts.id)
          setSelectedProductID(firstStoreWithProducts.onetimeProducts[0].id)
        }
      } catch (error) {
        toast.error(
          `${t('Credentials verification failed')}: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      } finally {
        setLoadingCatalog(false)
      }
    },
    [props.defaultValues.WaffoPancakeMerchantID, selectedProductID, t, values]
  )

  const handleCreatePair = async () => {
    const merchantID = values.WaffoPancakeMerchantID.trim()
    const privateKey = values.WaffoPancakePrivateKey.trim()
    if (!merchantID || !privateKey) {
      toast.error(t('Merchant ID and API Private Key are required'))
      return
    }

    setCreatingPair(true)
    try {
      const response = await createWaffoPancakePair({
        merchantID,
        privateKey,
        returnURL: removeTrailingSlash(values.WaffoPancakeReturnURL),
      })

      if (response.message !== 'success' || !response.data) {
        toast.error(getErrorText(response.data) || t('Creation failed'))
        return
      }

      if (typeof response.data === 'string') {
        toast.error(response.data || t('Creation failed'))
        return
      }

      const created = response.data as WaffoPancakePairResult
      setSelectedStoreID(created.store_id)
      setSelectedProductID(created.product_id)
      await loadCatalog({
        storeID: created.store_id,
        productID: created.product_id,
      })
      toast.success(t('Store + product created'))
    } catch (error) {
      toast.error(
        `${t('Creation failed')}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setCreatingPair(false)
    }
  }

  const handleSave = async () => {
    const merchantID = values.WaffoPancakeMerchantID.trim()
    const privateKey = values.WaffoPancakePrivateKey.trim()
    const returnURL = removeTrailingSlash(values.WaffoPancakeReturnURL)

    if (!merchantID) {
      toast.error(t('Merchant ID is required'))
      return
    }

    if (!selectedStoreID || !selectedProductID) {
      toast.error(t('Pick or create both a store and a product before saving.'))
      return
    }

    if (Number(values.WaffoPancakeUnitPrice) <= 0) {
      toast.error(t('Unit price must be greater than 0'))
      return
    }

    if (Number(values.WaffoPancakeMinTopUp) < 1) {
      toast.error(t('Minimum top-up amount must be at least 1'))
      return
    }

    setSaving(true)
    try {
      if (
        values.WaffoPancakeUnitPrice !==
        props.defaultValues.WaffoPancakeUnitPrice
      ) {
        await updateOption.mutateAsync({
          key: 'WaffoPancakeUnitPrice',
          value: String(values.WaffoPancakeUnitPrice),
        })
      }

      if (
        values.WaffoPancakeMinTopUp !==
        props.defaultValues.WaffoPancakeMinTopUp
      ) {
        await updateOption.mutateAsync({
          key: 'WaffoPancakeMinTopUp',
          value: String(values.WaffoPancakeMinTopUp),
        })
      }

      const response = await saveWaffoPancakeConfig({
        merchantID,
        privateKey,
        returnURL,
        storeID: selectedStoreID,
        productID: selectedProductID,
      })

      if (response.message !== 'success') {
        toast.error(getErrorText(response.data) || t('Waffo Pancake save failed'))
        return
      }

      if (response.data && typeof response.data === 'object') {
        const saved = response.data
        const nextBinding = {
          storeID: saved.store_id,
          productID: saved.product_id,
        }
        setSavedBinding(nextBinding)
        setSelectedStoreID(nextBinding.storeID)
        setSelectedProductID(nextBinding.productID)
        setValues((previous) => ({
          ...previous,
          WaffoPancakeStoreID: saved.store_id,
          WaffoPancakeProductID: saved.product_id,
        }))
      }
      queryClient.invalidateQueries({ queryKey: ['system-options'] })
      toast.success(t('Waffo Pancake settings saved'))
    } catch (error) {
      toast.error(
        `${t('Waffo Pancake save failed')}: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <SettingsSection
      title={t('Waffo Pancake MoR')}
      description={t(
        'Configure Waffo Pancake hosted checkout integration for USD-priced top-ups'
      )}
    >
      <Alert>
        <AlertDescription className='text-xs'>
          {t('Webhook URL (Test):')}{' '}
          <code>{'<ServerAddress>/api/waffo-pancake/webhook/test'}</code>
          <br />
          {t('Webhook URL (Production):')}{' '}
          <code>{'<ServerAddress>/api/waffo-pancake/webhook/prod'}</code>
          <br />
          {t('Configure at:')}{' '}
          <a
            href={PANCAKE_DASHBOARD_URL}
            target='_blank'
            rel='noreferrer'
            className='underline hover:no-underline'
          >
            {t('Waffo Pancake Dashboard')}
          </a>
        </AlertDescription>
      </Alert>

      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='grid gap-1.5'>
          <Label>{t('Merchant ID')}</Label>
          <Input
            placeholder='MER_xxx'
            value={values.WaffoPancakeMerchantID}
            onChange={(event) =>
              setValue('WaffoPancakeMerchantID', event.target.value)
            }
          />
        </div>

        <div className='grid gap-1.5'>
          <Label>{t('API Private Key')}</Label>
          <Textarea
            rows={3}
            placeholder={t('Leave blank to keep the existing key')}
            value={values.WaffoPancakePrivateKey}
            onChange={(event) =>
              setValue('WaffoPancakePrivateKey', event.target.value)
            }
            className='font-mono text-xs'
          />
        </div>

        <div className='grid gap-1.5'>
          <Label>{t('Unit price (local currency / USD)')}</Label>
          <Input
            type='number'
            step={0.01}
            min={0}
            value={values.WaffoPancakeUnitPrice}
            onChange={(event) =>
              setValue(
                'WaffoPancakeUnitPrice',
                event.target.value === '' ? 0 : event.target.valueAsNumber
              )
            }
          />
        </div>

        <div className='grid gap-1.5'>
          <Label>{t('Minimum top-up quantity')}</Label>
          <Input
            type='number'
            min={1}
            value={values.WaffoPancakeMinTopUp}
            onChange={(event) =>
              setValue(
                'WaffoPancakeMinTopUp',
                event.target.value === '' ? 1 : event.target.valueAsNumber
              )
            }
          />
        </div>
      </div>

      <div className='space-y-3'>
        <div className='grid gap-1.5'>
          <Label>{t('Payment return URL')}</Label>
          <div className='flex flex-col gap-2 sm:flex-row'>
            <Input
              placeholder='https://example.com/console/topup'
              value={values.WaffoPancakeReturnURL}
              onChange={(event) =>
                setValue('WaffoPancakeReturnURL', event.target.value)
              }
              className='flex-1'
            />
            <Button
              type='button'
              variant='outline'
              onClick={handleCreatePair}
              disabled={creatingPair || loadingCatalog}
            >
              {creatingPair
                ? t('Creating...')
                : `+ ${t('Create')} ${DEFAULT_NEW_PAIR_NAME}`}
            </Button>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={() => void loadCatalog()}
            disabled={loadingCatalog}
          >
            {loadingCatalog ? t('Verifying...') : t('Verify and load catalog')}
          </Button>
        </div>

        {storeSelectItems.length > 0 ? (
          <div className='grid gap-4 lg:grid-cols-2'>
            <div className='grid gap-1.5'>
              <Label>{t('Store')}</Label>
              <Select
                items={storeSelectItems}
                value={selectedStoreID}
                onValueChange={(value) => {
                  setSelectedStoreID(value)
                  setSelectedProductID('')
                }}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('Select a store')} />
                </SelectTrigger>
                <SelectContent>
                  {storeSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('Product')}</Label>
              <Select
                items={productSelectItems}
                value={selectedProductID}
                onValueChange={setSelectedProductID}
                disabled={!selectedStoreID || productSelectItems.length === 0}
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder={t('Select a product')} />
                </SelectTrigger>
                <SelectContent>
                  {productSelectItems.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {savedBinding.storeID || savedBinding.productID ? (
          <div className='text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 text-xs'>
            {savedBinding.storeID ? (
              <span>
                {t('Bound store:')}{' '}
                <code className='bg-muted rounded px-1 py-0.5'>
                  {savedBinding.storeID}
                </code>
              </span>
            ) : null}
            {savedBinding.productID ? (
              <span>
                {t('Bound product:')}{' '}
                <code className='bg-muted rounded px-1 py-0.5'>
                  {savedBinding.productID}
                </code>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <Button onClick={handleSave} disabled={saving || loadingCatalog}>
        {saving ? t('Saving...') : t('Save Waffo Pancake settings')}
      </Button>
    </SettingsSection>
  )
}
