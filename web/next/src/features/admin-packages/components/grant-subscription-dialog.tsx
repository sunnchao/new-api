/*
Copyright (C) 2025 QuantumNous

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
'use client'

import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useDebounce } from '@/hooks'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { getAdminPlans, grantSubscription, searchUsers } from '../api'
import type { AdminSearchUser, AdminPlan } from '../types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GrantSubscriptionDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchText, setSearchText] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminSearchUser | null>(null)
  const [selectedPlanType, setSelectedPlanType] = useState<string>('')
  const [allowStack, setAllowStack] = useState(false)

  const debouncedSearch = useDebounce(searchText, 400)

  const plansQuery = useQuery({
    queryKey: ['admin-packages', 'plans'],
    queryFn: getAdminPlans,
    enabled: open,
  })
  const plans: AdminPlan[] = plansQuery.data?.data || []

  const usersQuery = useQuery({
    queryKey: ['admin-packages', 'user-search', debouncedSearch],
    queryFn: () => searchUsers(debouncedSearch),
    enabled: open && debouncedSearch.length >= 2,
  })

  const users: AdminSearchUser[] = useMemo(() => {
    const data = usersQuery.data?.data
    if (!data) return []
    if (Array.isArray(data)) return data
    return data.users || []
  }, [usersQuery.data])

  useEffect(() => {
    if (!open) {
      setSearchText('')
      setSelectedUser(null)
      setSelectedPlanType('')
      setAllowStack(false)
    }
  }, [open])

  const grantMutation = useMutation({
    mutationFn: grantSubscription,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || t('Subscription granted successfully'))
        queryClient.invalidateQueries({
          queryKey: ['admin-packages', 'subscriptions'],
        })
        onOpenChange(false)
      } else {
        toast.error(res.message || t('Failed to grant subscription'))
      }
    },
    onError: () => toast.error(t('Failed to grant subscription')),
  })

  const handleGrant = () => {
    if (!selectedUser || !selectedPlanType) {
      toast.warning(t('Please select a user and a plan'))
      return
    }
    grantMutation.mutate({
      user_id: selectedUser.id,
      plan_type: selectedPlanType,
      allow_stack: allowStack,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('Grant Subscription')}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* User search */}
          <div className='space-y-2'>
            <Label>{t('Select User')}</Label>
            <Input
              placeholder={t('Search by email or username')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {users.length > 0 && (
              <div className='max-h-48 space-y-1 overflow-y-auto rounded-md border p-1'>
                {users.map((user) => (
                  <button
                    key={user.id}
                    type='button'
                    className={cn(
                      'w-full rounded-sm px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--accent)]',
                      selectedUser?.id === user.id && 'bg-[var(--accent)]'
                    )}
                    onClick={() => setSelectedUser(user)}
                  >
                    {user.email || user.username || `#${user.id}`}
                  </button>
                ))}
              </div>
            )}
            {selectedUser && (
              <p className='text-muted-foreground text-xs'>
                {t('Selected')}:{' '}
                {selectedUser.email ||
                  selectedUser.username ||
                  `#${selectedUser.id}`}
              </p>
            )}
          </div>

          {/* Plan select */}
          <div className='space-y-2'>
            <Label>{t('Select Plan')}</Label>
            <Select
              value={selectedPlanType}
              onValueChange={setSelectedPlanType}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('Please select a plan')} />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.type}>
                    {plan.name || plan.type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Allow stack */}
          <div className='flex items-center justify-between'>
            <Label>{t('Allow Stacking')}</Label>
            <Switch checked={allowStack} onCheckedChange={setAllowStack} />
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            {t('Cancel')}
          </Button>
          <Button disabled={grantMutation.isPending} onClick={handleGrant}>
            {t('Confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
