import { createContext, useContext, useEffect, useState } from 'react'

import type { UseFacilitatorAgentReturn } from '~/hooks/use-facilitator-agent'
import { useFacilitatorAgent } from '~/hooks/use-facilitator-agent'

interface FacilitatorAgentContextValue {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isResizing: boolean
  setIsResizing: (v: boolean) => void
  agent: UseFacilitatorAgentReturn
  orgSlug: string
  programId: string
}

const FacilitatorAgentContext =
  createContext<FacilitatorAgentContextValue | null>(null)

const STORAGE_KEY = 'facilitator-agent-sidebar-open'
const WIDTH_STORAGE_KEY = 'facilitator-agent-sidebar-width'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 600
const SESSION_STORAGE_TOKEN_KEY = 'facilitator-agent-token'

export function FacilitatorAgentProvider({
  programId,
  orgSlug,
  children,
}: {
  programId: string
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

  const agent = useFacilitatorAgent(programId, orgSlug)

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
    <FacilitatorAgentContext.Provider
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
        programId,
      }}
    >
      {children}
    </FacilitatorAgentContext.Provider>
  )
}

export function useFacilitatorAgentSidebar() {
  const ctx = useContext(FacilitatorAgentContext)
  if (!ctx) {
    throw new Error(
      'useFacilitatorAgentSidebar must be used within FacilitatorAgentProvider',
    )
  }
  return ctx
}
