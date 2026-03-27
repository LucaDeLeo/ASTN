import { browser } from '$app/environment'
import type { Id } from '$convex/_generated/dataModel'
import { createContext } from 'svelte'

type AgentProfileSummary = {
  _id: Id<'profiles'>
  agentThreadId?: string
  consentedAt?: number
}

const STORAGE_KEY = 'agent-sidebar-open'
const WIDTH_STORAGE_KEY = 'agent-sidebar-width'
const DEFAULT_WIDTH = 420
const MIN_WIDTH = 320
const MAX_WIDTH = 640

export class AgentSidebarStore {
  isOpen = $state(false)
  sidebarWidth = $state(DEFAULT_WIDTH)
  isResizing = $state(false)
  showConsentDialog = $state(false)
  pendingMessage = $state<string | null>(null)
  profileId = $state<Id<'profiles'> | null>(null)
  threadId = $state<string | null>(null)
  hasConsent = $state(false)

  constructor() {
    if (!browser) return

    this.isOpen = localStorage.getItem(STORAGE_KEY) === 'true'

    const storedWidth = Number(localStorage.getItem(WIDTH_STORAGE_KEY))
    if (Number.isFinite(storedWidth) && storedWidth > 0) {
      this.sidebarWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, storedWidth))
    }
  }

  get isReady() {
    return this.profileId !== null && this.threadId !== null
  }

  syncProfile(profile: AgentProfileSummary | null | undefined) {
    this.profileId = profile?._id ?? null
    this.threadId = profile?.agentThreadId ?? null
    this.hasConsent = !!profile?.consentedAt
  }

  persist() {
    if (!browser) return
    localStorage.setItem(STORAGE_KEY, String(this.isOpen))
    localStorage.setItem(WIDTH_STORAGE_KEY, String(this.sidebarWidth))
  }

  toggle() {
    if (!this.isOpen && !this.hasConsent && this.profileId) {
      this.showConsentDialog = true
      return
    }

    this.isOpen = !this.isOpen
    this.persist()
  }

  open() {
    if (!this.hasConsent && this.profileId) {
      this.showConsentDialog = true
      return
    }

    this.isOpen = true
    this.persist()
  }

  close() {
    this.isOpen = false
    this.persist()
  }

  openWithMessage(message: string) {
    this.pendingMessage = message
    this.open()
  }

  clearPendingMessage() {
    this.pendingMessage = null
  }

  setSidebarWidth(width: number) {
    this.sidebarWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    this.persist()
  }
}

const [getInternalAgentSidebarContext, setInternalAgentSidebarContext] =
  createContext<AgentSidebarStore>()

export function setAgentSidebarContext() {
  const store = new AgentSidebarStore()
  setInternalAgentSidebarContext(store)
  return store
}

export function getAgentSidebarContext() {
  const store = getInternalAgentSidebarContext()

  if (!store) {
    throw new Error('Agent sidebar context not found')
  }

  return store
}
