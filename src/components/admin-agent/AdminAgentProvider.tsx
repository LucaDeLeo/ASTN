import { createContext, useContext, useEffect, useState } from 'react'

import type { UseAdminAgentReturn } from '~/hooks/use-admin-agent'
import { useAdminAgent } from '~/hooks/use-admin-agent'

interface AdminAgentContextValue {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isResizing: boolean
  setIsResizing: (v: boolean) => void
  agent: UseAdminAgentReturn
  orgSlug: string
}

const AdminAgentContext = createContext<AdminAgentContextValue | null>(null)

const STORAGE_KEY = 'admin-agent-sidebar-open'
const WIDTH_STORAGE_KEY = 'admin-agent-sidebar-width'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 600
const SESSION_STORAGE_TOKEN_KEY = 'admin-agent-token'

export function AdminAgentProvider({
  orgSlug,
  children,
}: {
  orgSlug: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    // Auto-open if token is present in URL hash or sessionStorage
    const hash = window.location.hash
    if (hash.match(/#agent=([^&]+)/)) return true
    if (sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY)) {
      return localStorage.getItem(STORAGE_KEY) === 'true'
    }
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const [sidebarWidth, setSidebarWidthRaw] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH
    const stored = localStorage.getItem(WIDTH_STORAGE_KEY)
    return stored
      ? Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Number(stored)))
      : DEFAULT_WIDTH
  })

  const [isResizing, setIsResizing] = useState(false)

  const agent = useAdminAgent(orgSlug)

  const setSidebarWidth = (width: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    setSidebarWidthRaw(clamped)
    localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped))
  }

  // Persist open state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen))
  }, [isOpen])

  // Keyboard shortcut: Cmd+Shift+. / Ctrl+Shift+. to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === '.') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggle = () => setIsOpen((v) => !v)
  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)

  return (
    <AdminAgentContext.Provider
      value={{
        isOpen,
        toggle,
        open,
        close,
        sidebarWidth,
        setSidebarWidth,
        isResizing,
        setIsResizing,
        agent,
        orgSlug,
      }}
    >
      {children}
    </AdminAgentContext.Provider>
  )
}

export function useAdminAgentSidebar() {
  const ctx = useContext(AdminAgentContext)
  if (!ctx) {
    throw new Error(
      'useAdminAgentSidebar must be used within AdminAgentProvider',
    )
  }
  return ctx
}
