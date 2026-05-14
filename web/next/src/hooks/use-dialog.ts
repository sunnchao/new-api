import {
  useState,
  useCallback,
  useMemo,
  type Dispatch,
  type SetStateAction,
} from 'react'

export interface DialogHandlers {
  open: () => void
  close: () => void
  toggle: () => void
}

export interface DialogStateHandlers {
  reset: () => void
  isOpen: boolean
}

export interface DialogsHandlers<T extends string> {
  open: (key: T) => void
  close: (key: T) => void
  toggle: (key: T) => void
  isOpen: (key: T) => boolean
  closeAll: () => void
  hasAnyOpen: boolean
}

export function useDialog(
  initialOpen = false
): readonly [boolean, DialogHandlers] {
  const [isOpen, setIsOpen] = useState(initialOpen)

  const handlers: DialogHandlers = useMemo(
    () => ({
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      toggle: () => setIsOpen((prev) => !prev),
    }),
    []
  )

  return [isOpen, handlers] as const
}

export function useDialogState<T = unknown>(
  initialState: T | null = null
): readonly [
  T | null,
  Dispatch<SetStateAction<T | null>>,
  DialogStateHandlers,
] {
  const [state, setState] = useState<T | null>(initialState)

  const reset = useCallback(() => setState(null), [])

  const handlers: DialogStateHandlers = useMemo(
    () => ({
      reset,
      isOpen: state !== null,
    }),
    [state, reset]
  )

  return [state, setState, handlers] as const
}

export function useDialogs<T extends string>(): DialogsHandlers<T> {
  const [openDialogs, setOpenDialogs] = useState<Set<T>>(new Set())

  const open = useCallback((key: T) => {
    setOpenDialogs((prev) => {
      if (prev.has(key)) return prev
      const next = new Set(prev)
      next.add(key)
      return next
    })
  }, [])

  const close = useCallback((key: T) => {
    setOpenDialogs((prev) => {
      if (!prev.has(key)) return prev
      const next = new Set(prev)
      next.delete(key)
      return next
    })
  }, [])

  const toggle = useCallback((key: T) => {
    setOpenDialogs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }, [])

  const closeAll = useCallback(() => {
    setOpenDialogs((prev) => (prev.size === 0 ? prev : new Set()))
  }, [])

  const hasAnyOpen = useMemo(() => openDialogs.size > 0, [openDialogs])

  return useMemo(
    () => ({
      open,
      close,
      toggle,
      isOpen: (key: T) => openDialogs.has(key),
      closeAll,
      hasAnyOpen,
    }),
    [open, close, toggle, openDialogs, closeAll, hasAnyOpen]
  )
}
