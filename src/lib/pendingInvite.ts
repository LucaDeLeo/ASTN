const STORAGE_KEY = 'astn_pending_invite'
const TTL_MS = 60 * 60 * 1000 // 1 hour

function canUseStorage() {
  return typeof localStorage !== 'undefined'
}

interface PendingInvite {
  slug: string
  token?: string
  savedAt: number
}

export function savePendingInvite(invite: { slug: string; token?: string }) {
  if (!canUseStorage()) return

  const data: PendingInvite = { ...invite, savedAt: Date.now() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function getPendingInvite(): { slug: string; token?: string } | null {
  if (!canUseStorage()) return null

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return null

  try {
    const data: PendingInvite = JSON.parse(raw)
    if (Date.now() - data.savedAt > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return { slug: data.slug, token: data.token }
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function clearPendingInvite() {
  if (!canUseStorage()) return

  localStorage.removeItem(STORAGE_KEY)
}
