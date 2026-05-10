import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableEmpty } from '@/components/data-table'
import { LoadingState } from '@/components/loading-state'
import {
  formatInvoiceMoney,
  formatUnixTime,
  getInvoiceSourceTypeLabelKey,
} from '../lib/format'
import type { InvoiceableRecord } from '../types'

type Props = {
  items: InvoiceableRecord[]
  selectedKeys: string[]
  onSelectedKeysChange: (keys: string[]) => void
  loading?: boolean
}

function getRecordKey(
  item: Pick<InvoiceableRecord, 'source_type' | 'source_id'>
) {
  return `${item.source_type}:${item.source_id}`
}

export function EligibleRecordsTable({
  items,
  selectedKeys,
  onSelectedKeysChange,
  loading,
}: Props) {
  const { t } = useTranslation()
  const selectedSet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const allSelected =
    items.length > 0 &&
    items.every((item) => selectedSet.has(getRecordKey(item)))
  const partiallySelected =
    items.some((item) => selectedSet.has(getRecordKey(item))) && !allSelected

  const toggleOne = (key: string, checked: boolean) => {
    if (checked) {
      onSelectedKeysChange([...new Set([...selectedKeys, key])])
      return
    }
    onSelectedKeysChange(selectedKeys.filter((itemKey) => itemKey !== key))
  }

  const toggleAll = (checked: boolean) => {
    const pageKeys = items.map(getRecordKey)
    if (checked) {
      onSelectedKeysChange([...new Set([...selectedKeys, ...pageKeys])])
      return
    }
    const pageKeySet = new Set(pageKeys)
    onSelectedKeysChange(selectedKeys.filter((key) => !pageKeySet.has(key)))
  }

  return (
    <div className='overflow-hidden rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-10'>
              <Checkbox
                checked={allSelected}
                indeterminate={partiallySelected}
                onCheckedChange={(value) => toggleAll(value === true)}
                aria-label={t('Select all')}
              />
            </TableHead>
            <TableHead>{t('Record type')}</TableHead>
            <TableHead>{t('Order number')}</TableHead>
            <TableHead>{t('Payment provider')}</TableHead>
            <TableHead>{t('Completed at')}</TableHead>
            <TableHead className='text-right'>{t('Amount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6}>
                <LoadingState size='sm' />
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableEmpty
              colSpan={6}
              title={t('No invoiceable records')}
              description={t(
                'Successful online top-ups and subscription purchases that have not been invoiced will appear here.'
              )}
            />
          ) : (
            items.map((item) => {
              const key = getRecordKey(item)
              return (
                <TableRow
                  key={key}
                  data-state={selectedSet.has(key) ? 'selected' : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedSet.has(key)}
                      onCheckedChange={(value) =>
                        toggleOne(key, value === true)
                      }
                      aria-label={t('Select order')}
                    />
                  </TableCell>
                  <TableCell>
                    {t(getInvoiceSourceTypeLabelKey(item.source_type))}
                  </TableCell>
                  <TableCell className='max-w-[240px] truncate font-mono text-xs'>
                    {item.trade_no}
                  </TableCell>
                  <TableCell>
                    <div className='max-w-[160px] truncate'>
                      {item.payment_provider || item.payment_method || '-'}
                    </div>
                  </TableCell>
                  <TableCell className='text-muted-foreground font-mono text-xs'>
                    {formatUnixTime(item.complete_time)}
                  </TableCell>
                  <TableCell className='text-right font-medium'>
                    {formatInvoiceMoney(item.money)}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
