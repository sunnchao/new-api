import { useState } from 'react'
import type { Row } from '@tanstack/react-table'
import {
  Edit,
  Loader2,
  MoreHorizontal,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  API_KEY_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '@/features/keys/constants'
import { updateAdminTokenStatus } from '../api'
import type { AdminToken } from '../types'
import { useAdminTokens } from './admin-tokens-provider'

type AdminTokenRowActionsProps<TData> = {
  row: Row<TData>
}

export function AdminTokenRowActions<TData>({
  row,
}: AdminTokenRowActionsProps<TData>) {
  const { t } = useTranslation()
  const adminToken = row.original as AdminToken
  const { setCurrentRow, setOpen, triggerRefresh } = useAdminTokens()
  const [isTogglingStatus, setIsTogglingStatus] = useState(false)
  const isEnabled = adminToken.status === API_KEY_STATUS.ENABLED

  const handleToggleStatus = async (
    e?: React.MouseEvent<HTMLButtonElement>
  ) => {
    e?.stopPropagation()
    const nextStatus = isEnabled
      ? API_KEY_STATUS.DISABLED
      : API_KEY_STATUS.ENABLED

    setIsTogglingStatus(true)
    try {
      const result = await updateAdminTokenStatus(adminToken.id, nextStatus)
      if (result.success) {
        toast.success(
          t(
            isEnabled
              ? SUCCESS_MESSAGES.API_KEY_DISABLED
              : SUCCESS_MESSAGES.API_KEY_ENABLED
          )
        )
        triggerRefresh()
      } else {
        toast.error(result.message || t(ERROR_MESSAGES.STATUS_UPDATE_FAILED))
      }
    } catch {
      toast.error(t(ERROR_MESSAGES.UNEXPECTED))
    } finally {
      setIsTogglingStatus(false)
    }
  }

  return (
    <div className='flex items-center justify-end gap-1'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
              aria-label={isEnabled ? t('Disable') : t('Enable')}
              className={
                isEnabled
                  ? 'text-destructive hover:text-destructive'
                  : 'text-emerald-600 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400'
              }
            />
          }
        >
          {isTogglingStatus ? (
            <Loader2 className='size-4 animate-spin' />
          ) : isEnabled ? (
            <PowerOff className='size-4' />
          ) : (
            <Power className='size-4' />
          )}
        </TooltipTrigger>
        <TooltipContent>
          {isEnabled ? t('Disable') : t('Enable')}
        </TooltipContent>
      </Tooltip>

      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          render={
            <Button
              variant='ghost'
              className='data-popup-open:bg-muted flex h-8 w-8 p-0'
            />
          }
        >
          <MoreHorizontal className='size-4' />
          <span className='sr-only'>{t('Open menu')}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[180px]'>
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(adminToken)
              setOpen('update')
            }}
          >
            {t('Edit')}
            <DropdownMenuShortcut>
              <Edit className='size-4' />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setCurrentRow(adminToken)
              setOpen('delete')
            }}
            className='text-destructive focus:text-destructive'
          >
            {t('Delete')}
            <DropdownMenuShortcut>
              <Trash2 className='size-4' />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
