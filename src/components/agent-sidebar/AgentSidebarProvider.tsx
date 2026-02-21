import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface AgentSidebarContextValue {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  profileId: Id<'profiles'> | null
  threadId: string | null
  isReady: boolean
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isResizing: boolean
  setIsResizing: (v: boolean) => void
}

const AgentSidebarContext = createContext<AgentSidebarContextValue | null>(null)

const STORAGE_KEY = 'agent-sidebar-open'
const WIDTH_STORAGE_KEY = 'agent-sidebar-width'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 600

export function AgentSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
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

  const setSidebarWidth = useCallback((width: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    setSidebarWidthRaw(clamped)
    localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped))
  }, [])

  const profile = useQuery(api.profiles.getOrCreateProfile)
  const createThread = useMutation(api.agent.threadOps.createAgentThread)
  const threadCreating = useRef(false)
  const autoOpenedRef = useRef(false)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Persist open state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen))
  }, [isOpen])

  // Keyboard shortcut: Cmd+. / Ctrl+. to toggle sidebar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault()
        setIsOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Ensure profile + thread exist when sidebar is open and user has a profile
  // (profile being non-null means user is authenticated AND has a profile)
  useEffect(() => {
    if (!profile) return // Loading, unauthenticated, or no profile
    if (threadCreating.current) return
    if (profile.agentThreadId) return // Already has thread

    if (!isOpen) return // Don't create thread until sidebar is opened

    const setup = async () => {
      threadCreating.current = true
      try {
        await createThread({ profileId: profile._id })
      } finally {
        threadCreating.current = false
      }
    }

    setup()
  }, [profile, isOpen, createThread])

  // Auto-open for new users: profile exists but no thread yet
  useEffect(() => {
    if (!profile) return
    if (autoOpenedRef.current) return
    if (!profile.agentThreadId) {
      autoOpenedRef.current = true
      setIsOpen(true)
    }
  }, [profile])

  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  const open = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    setIsOpen(true)
  }, [])
  const close = useCallback(() => {
    setIsOpen(false)
    const el = previousFocusRef.current
    if (el) {
      requestAnimationFrame(() => el.focus())
      previousFocusRef.current = null
    }
  }, [])

  const profileId = profile?._id ?? null
  const threadId = profile?.agentThreadId ?? null
  const isReady = profileId !== null && threadId !== null

  return (
    <AgentSidebarContext.Provider
      value={{
        isOpen,
        toggle,
        open,
        close,
        profileId,
        threadId,
        isReady,
        sidebarWidth,
        setSidebarWidth,
        isResizing,
        setIsResizing,
      }}
    >
      {children}
    </AgentSidebarContext.Provider>
  )
}

export function useAgentSidebar() {
  const ctx = useContext(AgentSidebarContext)
  if (!ctx) {
    throw new Error('useAgentSidebar must be used within AgentSidebarProvider')
  }
  return ctx
}
