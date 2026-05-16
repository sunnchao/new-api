import React, { useCallback, useState } from 'react'
import { useDialogState } from '@/hooks/use-dialog'
import type { AdminToken, AdminTokensDialogType } from '../types'

type AdminTokensContextType = {
  open: AdminTokensDialogType | null
  setOpen: (str: AdminTokensDialogType | null) => void
  currentRow: AdminToken | null
  setCurrentRow: React.Dispatch<React.SetStateAction<AdminToken | null>>
  refreshTrigger: number
  triggerRefresh: () => void
}

const AdminTokensContext = React.createContext<AdminTokensContextType | null>(
  null
)

export function AdminTokensProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = useDialogState<AdminTokensDialogType>(null)
  const [currentRow, setCurrentRow] = useState<AdminToken | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <AdminTokensContext
      value={{
        open,
        setOpen,
        currentRow,
        setCurrentRow,
        refreshTrigger,
        triggerRefresh,
      }}
    >
      {children}
    </AdminTokensContext>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAdminTokens = () => {
  const context = React.useContext(AdminTokensContext)

  if (!context) {
    throw new Error(
      'useAdminTokens has to be used within <AdminTokensProvider>'
    )
  }

  return context
}
