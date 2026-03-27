import { browser } from '$app/environment'
import { createContext } from 'svelte'
import type {
  AdminAgentMessage,
  AgentModel,
  ContentPart,
  ThinkingLevel,
} from '../../../shared/admin-agent/types'

const STORAGE_KEY = 'admin-agent-sidebar-open'
const WIDTH_STORAGE_KEY = 'admin-agent-sidebar-width'
const SESSION_STORAGE_TOKEN_KEY = 'admin-agent-token'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 600

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export class AdminAgentStore {
  isOpen = $state(false)
  sidebarWidth = $state(DEFAULT_WIDTH)
  isResizing = $state(false)

  status = $state<ConnectionStatus>('disconnected')
  messages = $state<Array<AdminAgentMessage>>([])
  streamParts = $state<Array<ContentPart>>([])
  isStreaming = $state(false)
  model = $state<AgentModel>('claude-opus-4-6')
  thinking = $state<ThinkingLevel>('adaptive')
  orgSlug = $state('')
  agentToken = $state<string | null>(null)

  sendMessage: (text: string, model?: AgentModel, thinking?: ThinkingLevel) => void = () => {}
  sendConfirmResponse: (confirmId: string, approved: boolean) => void = () => {}
  clearChat: () => void = () => {}

  constructor() {
    if (!browser) {
      return
    }

    this.isOpen = localStorage.getItem(STORAGE_KEY) === 'true'

    const storedWidth = Number(localStorage.getItem(WIDTH_STORAGE_KEY))
    if (Number.isFinite(storedWidth) && storedWidth > 0) {
      this.sidebarWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, storedWidth))
    }

    const hashMatch = window.location.hash.match(/#agent=([^&]+)/)
    if (hashMatch) {
      this.agentToken = hashMatch[1]
      sessionStorage.setItem(SESSION_STORAGE_TOKEN_KEY, hashMatch[1])
      this.isOpen = true
      history.replaceState(null, '', window.location.pathname + window.location.search)
    } else {
      this.agentToken = sessionStorage.getItem(SESSION_STORAGE_TOKEN_KEY)
    }
  }

  private persistLayout() {
    if (!browser) {
      return
    }

    localStorage.setItem(STORAGE_KEY, String(this.isOpen))
    localStorage.setItem(WIDTH_STORAGE_KEY, String(this.sidebarWidth))
  }

  toggle() {
    this.isOpen = !this.isOpen
    this.persistLayout()
  }

  open() {
    this.isOpen = true
    this.persistLayout()
  }

  close() {
    this.isOpen = false
    this.persistLayout()
  }

  setSidebarWidth(width: number) {
    this.sidebarWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    this.persistLayout()
  }
}

const [getInternalAdminAgentContext, setInternalAdminAgentContext] =
  createContext<AdminAgentStore>()

export function setAdminAgentContext() {
  const store = new AdminAgentStore()
  setInternalAdminAgentContext(store)
  return store
}

export function getAdminAgentContext() {
  const store = getInternalAdminAgentContext()

  if (!store) {
    throw new Error('Admin agent context not found')
  }

  return store
}
