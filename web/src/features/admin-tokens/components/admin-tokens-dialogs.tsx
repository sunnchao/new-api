import { AdminTokenDeleteDialog } from './admin-token-delete-dialog'
import { AdminTokenMutateDrawer } from './admin-token-mutate-drawer'
import { useAdminTokens } from './admin-tokens-provider'

export function AdminTokensDialogs() {
  const { open, setOpen, currentRow } = useAdminTokens()
  const mutateSide = open === 'create' ? 'left' : 'right'

  return (
    <>
      <AdminTokenMutateDrawer
        open={open === 'create' || open === 'update'}
        onOpenChange={(isOpen) => !isOpen && setOpen(null)}
        currentRow={open === 'update' ? currentRow || undefined : undefined}
        side={mutateSide}
      />
      <AdminTokenDeleteDialog />
    </>
  )
}
