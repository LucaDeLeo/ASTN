const STORAGE_KEY = 'astn_pending_guest_application'
const TTL_MS = 60 * 60 * 1000 // 1 hour

function canUseStorage() {
  return typeof localStorage !== 'undefined'
}

interface PendingGuestApplication {
  email: string
  savedAt: number
}

export function saveGuestApplicationEmail(email: string) {
  if (!canUseStorage()) return

  const data: PendingGuestApplication = { email, savedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getPendingGuestApplication(): { email: string } | null {
  if (!canUseStorage()) return null

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const data: PendingGuestApplication = JSON.parse(raw)
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { email: data.email }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearPendingGuestApplication() {
  if (!canUseStorage()) return

  localStorage.removeItem(STORAGE_KEY)
}
