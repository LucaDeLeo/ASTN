import { browser } from '$app/environment'
import type { Id } from '$convex/_generated/dataModel'
import { createContext } from 'svelte'

const STORAGE_KEY = 'course-sidebar-open'
const WIDTH_STORAGE_KEY = 'course-sidebar-width'
const DEFAULT_WIDTH = 420
const MIN_WIDTH = 320
const MAX_WIDTH = 640

export class CourseSidebarStore {
  isOpen = $state(false)
  sidebarWidth = $state(DEFAULT_WIDTH)
  isResizing = $state(false)
  moduleId = $state<Id<'programModules'> | null>(null)
  threadId = $state<string | null>(null)

  constructor() {
    if (!browser) return

    this.isOpen = localStorage.getItem(STORAGE_KEY) === 'true'

    const storedWidth = Number(localStorage.getItem(WIDTH_STORAGE_KEY))
    if (Number.isFinite(storedWidth) && storedWidth > 0) {
      this.sidebarWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, storedWidth))
    }
  }

  get isReady() {
    return this.moduleId !== null && this.threadId !== null
  }

  syncModule(moduleId: Id<'programModules'> | null) {
    if (this.moduleId !== moduleId) {
      this.moduleId = moduleId
      this.threadId = null
    }
  }

  persist() {
    if (!browser) return
    localStorage.setItem(STORAGE_KEY, String(this.isOpen))
    localStorage.setItem(WIDTH_STORAGE_KEY, String(this.sidebarWidth))
  }

  toggle() {
    this.isOpen = !this.isOpen
    this.persist()
  }

  open() {
    this.isOpen = true
    this.persist()
  }

  close() {
    this.isOpen = false
    this.persist()
  }

  setSidebarWidth(width: number) {
    this.sidebarWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width))
    this.persist()
  }
}

const [getInternalCourseSidebarContext, setInternalCourseSidebarContext] =
  createContext<CourseSidebarStore>()

export function setCourseSidebarContext() {
  const store = new CourseSidebarStore()
  setInternalCourseSidebarContext(store)
  return store
}

export function getCourseSidebarContext() {
  const store = getInternalCourseSidebarContext()

  if (!store) {
    throw new Error('Course sidebar context not found')
  }

  return store
}
