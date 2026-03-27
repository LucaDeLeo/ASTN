import { browser } from '$app/environment'
import { createContext } from 'svelte'
import type {
  AdminAgentMessage,
  AgentModel,
  ContentPart,
  ThinkingLevel,
} from '../../../shared/admin-agent/types'

const STORAGE_KEY = 'facilitator-agent-sidebar-open'
const WIDTH_STORAGE_KEY = 'facilitator-agent-sidebar-width'
const SESSION_STORAGE_TOKEN_KEY = 'facilitator-agent-token'
const DEFAULT_WIDTH = 400
const MIN_WIDTH = 280
const MAX_WIDTH = 600

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected'

export class FacilitatorAgentStore {
  isOpen = $state(false)
  sidebarWidth = $state(DEFAULT_WIDTH)
  isResizing = $state(false)

  status = $state<ConnectionStatus>('disconnected')
  messages = $state<Array<AdminAgentMessage>>([])
  streamParts = $state<Array<ContentPart>>([])
  isStreaming = $state(false)
  model = $state<AgentModel>('claude-sonnet-4-6')
  thinking = $state<ThinkingLevel>('off')
  orgSlug = $state('')
  programId = $state<string>('')
  agentToken = $state<string | null>(null)

  sendMessage: (text: string, model?: AgentModel, thinking?: ThinkingLevel) => void = () => {}
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

const [getInternalFacilitatorAgentContext, setInternalFacilitatorAgentContext] =
  createContext<FacilitatorAgentStore>()

export function setFacilitatorAgentContext() {
  const store = new FacilitatorAgentStore()
  setInternalFacilitatorAgentContext(store)
  return store
}

export function getFacilitatorAgentContext() {
  const store = getInternalFacilitatorAgentContext()

  if (!store) {
    throw new Error('Facilitator agent context not found')
  }

  return store
}
