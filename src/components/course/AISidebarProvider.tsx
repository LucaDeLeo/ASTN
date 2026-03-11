import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'

interface CourseSidebarContextValue {
  isOpen: boolean
  toggle: () => void
  open: () => void
  close: () => void
  moduleId: Id<'programModules'> | null
  threadId: string | null
  isReady: boolean
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isResizing: boolean
  setIsResizing: (v: boolean) => void
}

const CourseSidebarContext = createContext<CourseSidebarContextValue | null>(
  null,
)

const STORAGE_KEY = 'course-sidebar-open'
const WIDTH_STORAGE_KEY = 'course-sidebar-width'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 600

export function AISidebarProvider({
  children,
  moduleId,
}: {
  children: React.ReactNode
  moduleId: Id<'programModules'> | null
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
  const [threadId, setThreadId] = useState<string | null>(null)
  const threadCreating = useRef(false)
  const currentModuleRef = useRef<Id<'programModules'> | null>(null)

  const setSidebarWidth = useCallback((width: number) => {
    const clamped = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    setSidebarWidthRaw(clamped)
    localStorage.setItem(WIDTH_STORAGE_KEY, String(clamped))
  }, [])

  const getOrCreateThread = useMutation(api.course.sidebar.getOrCreateThread)

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

  // Reset threadId when moduleId changes
  useEffect(() => {
    if (moduleId !== currentModuleRef.current) {
      currentModuleRef.current = moduleId
      setThreadId(null)
      threadCreating.current = false
    }
  }, [moduleId])

  // Get or create thread when sidebar is open and moduleId is set
  useEffect(() => {
    if (!isOpen || !moduleId) return
    if (threadCreating.current) return
    if (threadId && currentModuleRef.current === moduleId) return

    const setup = async () => {
      threadCreating.current = true
      try {
        const newThreadId = await getOrCreateThread({ moduleId })
        setThreadId(newThreadId)
      } finally {
        threadCreating.current = false
      }
    }

    setup()
  }, [isOpen, moduleId, threadId, getOrCreateThread])

  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  const isReady = moduleId !== null && threadId !== null

  return (
    <CourseSidebarContext.Provider
      value={{
        isOpen,
        toggle,
        open,
        close,
        moduleId,
        threadId,
        isReady,
        sidebarWidth,
        setSidebarWidth,
        isResizing,
        setIsResizing,
      }}
    >
      {children}
    </CourseSidebarContext.Provider>
  )
}

export function useCourseSidebar() {
  const ctx = useContext(CourseSidebarContext)
  if (!ctx) {
    throw new Error('useCourseSidebar must be used within AISidebarProvider')
  }
  return ctx
}
