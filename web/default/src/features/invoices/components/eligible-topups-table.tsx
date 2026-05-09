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
import { formatInvoiceMoney, formatUnixTime } from '../lib/format'
import type { InvoiceableTopUp } from '../types'

type Props = {
  items: InvoiceableTopUp[]
  selectedIds: number[]
  onSelectedIdsChange: (ids: number[]) => void
  loading?: boolean
}

export function EligibleTopUpsTable({
  items,
  selectedIds,
  onSelectedIdsChange,
  loading,
}: Props) {
  const { t } = useTranslation()
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])
  const allSelected =
    items.length > 0 && items.every((item) => selectedSet.has(item.id))
  const partiallySelected =
    items.some((item) => selectedSet.has(item.id)) && !allSelected

  const toggleOne = (id: number, checked: boolean) => {
    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, id])])
      return
    }
    onSelectedIdsChange(selectedIds.filter((itemId) => itemId !== id))
  }

  const toggleAll = (checked: boolean) => {
    const pageIds = items.map((item) => item.id)
    if (checked) {
      onSelectedIdsChange([...new Set([...selectedIds, ...pageIds])])
      return
    }
    const pageIdSet = new Set(pageIds)
    onSelectedIdsChange(selectedIds.filter((id) => !pageIdSet.has(id)))
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
            <TableHead>{t('Order number')}</TableHead>
            <TableHead>{t('Payment provider')}</TableHead>
            <TableHead>{t('Completed at')}</TableHead>
            <TableHead className='text-right'>{t('Amount')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5}>
                <LoadingState size='sm' />
              </TableCell>
            </TableRow>
          ) : items.length === 0 ? (
            <TableEmpty
              colSpan={5}
              title={t('No invoiceable top-ups')}
              description={t(
                'Successful online top-ups that have not been invoiced will appear here.'
              )}
            />
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                data-state={selectedSet.has(item.id) ? 'selected' : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedSet.has(item.id)}
                    onCheckedChange={(value) =>
                      toggleOne(item.id, value === true)
                    }
                    aria-label={t('Select order')}
                  />
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
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
