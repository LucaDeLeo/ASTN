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
}

const AgentSidebarContext = createContext<AgentSidebarContextValue | null>(null)

const STORAGE_KEY = 'agent-sidebar-open'

export function AgentSidebarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(STORAGE_KEY) === 'true'
  })

  const profile = useQuery(api.profiles.getOrCreateProfile)
  const createThread = useMutation(api.agent.threadOps.createAgentThread)
  const threadCreating = useRef(false)
  const autoOpenedRef = useRef(false)

  // Persist open state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isOpen))
  }, [isOpen])

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
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const profileId = profile?._id ?? null
  const threadId = profile?.agentThreadId ?? null
  const isReady = profileId !== null && threadId !== null

  return (
    <AgentSidebarContext.Provider
      value={{ isOpen, toggle, open, close, profileId, threadId, isReady }}
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
