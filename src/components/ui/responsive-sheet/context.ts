import { getContext, setContext } from 'svelte'
import { writable } from 'svelte/store'

const RESPONSIVE_SHEET_CONTEXT = Symbol('responsive-sheet')

export function createResponsiveSheetContext() {
  const open = writable(false)

  const context = {
    open,
    setOpen(value: boolean) {
      open.set(value)
    },
    toggle() {
      open.update((value) => !value)
    },
  }

  setContext(RESPONSIVE_SHEET_CONTEXT, context)
  return context
}

export function getResponsiveSheetContext() {
  const context = getContext<ReturnType<typeof createResponsiveSheetContext>>(
    RESPONSIVE_SHEET_CONTEXT,
  )

  if (!context) {
    throw new Error('ResponsiveSheet context not found')
  }

  return context
}
