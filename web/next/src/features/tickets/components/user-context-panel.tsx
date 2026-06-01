'use client'

import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface UserContext {
  username?: string
  email?: string
  quota?: number
  used_quota?: number
  request_count?: number
  [key: string]: unknown
}

export function UserContextPanel({ userContext }: { userContext: UserContext }) {
  const { t } = useTranslation()

  if (!userContext || Object.keys(userContext).length === 0) return null

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm'>{t('User Info')}</CardTitle>
      </CardHeader>
      <CardContent className='text-sm'>
        <div className='grid grid-cols-2 gap-x-6 gap-y-2'>
          {userContext.username && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('Username')}</span>
              <span className='font-medium'>{String(userContext.username)}</span>
            </div>
          )}
          {userContext.email && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('Email')}</span>
              <span className='font-medium'>{String(userContext.email)}</span>
            </div>
          )}
          {userContext.quota !== undefined && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('Balance')}</span>
              <span className='font-medium'>{Number(userContext.quota)}</span>
            </div>
          )}
          {userContext.used_quota !== undefined && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('Used Quota')}</span>
              <span className='font-medium'>{Number(userContext.used_quota)}</span>
            </div>
          )}
          {userContext.request_count !== undefined && (
            <div className='flex justify-between'>
              <span className='text-muted-foreground'>{t('Request Count')}</span>
              <span className='font-medium'>{Number(userContext.request_count)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
