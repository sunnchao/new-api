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
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { migrateConsoleSetting } from '../api'
import { getOptionValue, useSystemOptions } from '../hooks/use-system-options'
import type { ContentSettings } from '../types'
import {
  CONTENT_DEFAULT_SECTION,
  getContentSectionContent,
} from './section-registry'

const legacyKeys = [
  'ApiInfo',
  'Announcements',
  'FAQ',
  'UptimeKumaUrl',
  'UptimeKumaSlug',
] as const

const defaultContentSettings: ContentSettings = {
  'console_setting.api_info': '[]',
  'console_setting.announcements': '[]',
  'console_setting.faq': '[]',
  'console_setting.uptime_kuma_groups': '[]',
  'console_setting.api_info_enabled': true,
  'console_setting.announcements_enabled': true,
  'console_setting.faq_enabled': true,
  'console_setting.uptime_kuma_enabled': false,
  DataExportEnabled: false,
  DataExportDefaultTime: 'hour',
  DataExportInterval: 5,
  Chats: '[]',
  DrawingEnabled: false,
  MjNotifyEnabled: false,
  MjAccountFilterEnabled: false,
  MjForwardUrlEnabled: false,
  MjModeClearEnabled: false,
  MjActionCheckSuccessEnabled: false,
}

export function ContentSettings({ sectionId }: { sectionId?: string }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data, isLoading } = useSystemOptions()
  const [showMigrationDialog, setShowMigrationDialog] = useState(false)

  const optionMap = useMemo(
    () => new Map((data?.data ?? []).map((item) => [item.key, item.value])),
    [data?.data]
  )

  const hasLegacyData = useMemo(
    () => legacyKeys.some((key) => Boolean(optionMap.get(key))),
    [optionMap]
  )

  const migrationMutation = useMutation({
    mutationFn: migrateConsoleSetting,
  })

  const settings = useMemo(() => {
    const resolved = getOptionValue(data?.data, defaultContentSettings)

    if (!optionMap.has('console_setting.announcements')) {
      const legacy = optionMap.get('Announcements')
      if (legacy !== undefined) {
        resolved['console_setting.announcements'] = legacy
      }
    }

    if (!optionMap.has('console_setting.api_info')) {
      const legacy = optionMap.get('ApiInfo')
      if (legacy !== undefined) {
        resolved['console_setting.api_info'] = legacy
      }
    }

    if (!optionMap.has('console_setting.faq')) {
      const legacy = optionMap.get('FAQ')
      if (legacy !== undefined) {
        resolved['console_setting.faq'] = legacy
      }
    }

    if (!optionMap.has('console_setting.uptime_kuma_groups')) {
      const legacyUrl = optionMap.get('UptimeKumaUrl')
      const legacySlug = optionMap.get('UptimeKumaSlug')
      if (legacyUrl && legacySlug) {
        resolved['console_setting.uptime_kuma_groups'] = JSON.stringify([
          {
            id: 1,
            categoryName: 'Legacy',
            url: legacyUrl,
            slug: legacySlug,
          },
        ])
      }
    }

    return resolved
  }, [data?.data, optionMap])

  useEffect(() => {
    if (hasLegacyData) {
      setShowMigrationDialog(true)
    }
  }, [hasLegacyData])

  const handleMigrate = async () => {
    try {
      const result = await migrationMutation.mutateAsync()
      if (result.success) {
        await queryClient.invalidateQueries({ queryKey: ['system-options'] })
        toast.success(t('Legacy settings migrated successfully'))
        setShowMigrationDialog(false)
      } else {
        toast.error(result.message || t('Failed to migrate legacy settings'))
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('Failed to migrate legacy settings')
      )
    }
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-muted-foreground'>
          {t('Loading content settings...')}
        </div>
      </div>
    )
  }

  const activeSection = (sectionId ?? CONTENT_DEFAULT_SECTION) as
    | 'dashboard'
    | 'announcements'
    | 'api-info'
    | 'faq'
    | 'uptime-kuma'
    | 'chat'
    | 'drawing'
  const sectionContent = getContentSectionContent(activeSection, settings)

  return (
    <>
      <Dialog
        open={showMigrationDialog}
        onOpenChange={(open) => {
          if (!migrationMutation.isPending) {
            setShowMigrationDialog(open)
          }
        }}
      >
        <DialogContent showCloseButton={!migrationMutation.isPending}>
          <DialogHeader>
            <DialogTitle>{t('Legacy dashboard settings detected')}</DialogTitle>
            <DialogDescription>
              {t(
                'Detected legacy dashboard content settings. Migrate them to the new console_setting format before editing these sections.'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className='rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-[var(--foreground)]'>
            {t(
              'The migration converts API addresses, announcements, FAQ, and Uptime Kuma settings, then clears the old option keys. Back up the legacy option values before continuing.'
            )}
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              disabled={migrationMutation.isPending}
              onClick={() => setShowMigrationDialog(false)}
            >
              {t('Cancel')}
            </Button>
            <Button
              type='button'
              disabled={migrationMutation.isPending}
              onClick={handleMigrate}
            >
              <RefreshCw
                aria-hidden='true'
                className={`h-4 w-4 ${migrationMutation.isPending ? 'animate-spin' : ''}`}
              />
              {migrationMutation.isPending
                ? t('Migrating...')
                : t('Migrate settings')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className='flex h-full w-full flex-1 flex-col'>
        <div className='faded-bottom h-full w-full overflow-y-auto scroll-smooth pe-4 pb-12'>
          <div className='space-y-4'>{sectionContent}</div>
        </div>
      </div>
    </>
  )
}
