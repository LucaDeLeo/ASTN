// src/lib/tauri/auth.ts
// Deep link OAuth handler for Tauri mobile apps
// With PKCE (S256), state validation, and persistent Tauri Store

import { isTauri } from '../platform'
import { api } from '../../../convex/_generated/api'
import type { ConvexReactClient } from 'convex/react'

// ── PKCE Helpers (Web Crypto API, no external deps) ──────────────────────

function base64UrlEncode(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64UrlEncode(array)
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return base64UrlEncode(new Uint8Array(hash))
}

// ── PKCE Tauri Store Persistence ─────────────────────────────────────────

interface PKCEData {
  codeVerifier: string
  state: string
  provider: 'github' | 'google'
  timestamp: number
}

const PKCE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function storePKCEData(
  data: Omit<PKCEData, 'timestamp'>
): Promise<void> {
  const { Store } = await import('@tauri-apps/plugin-store')
  const store = await Store.load('oauth.json')
  await store.set('pkce', { ...data, timestamp: Date.now() })
  await store.save()
}

export async function getPKCEData(): Promise<PKCEData | null> {
  try {
    const { Store } = await import('@tauri-apps/plugin-store')
    const store = await Store.load('oauth.json')
    const data = await store.get<PKCEData>('pkce')
    if (!data) return null
    // Expire after TTL
    if (Date.now() - data.timestamp > PKCE_TTL_MS) {
      await store.delete('pkce')
      await store.save()
      return null
    }
    return data
  } catch {
    return null
  }
}

export async function clearPKCEData(): Promise<void> {
  try {
    const { Store } = await import('@tauri-apps/plugin-store')
    const store = await Store.load('oauth.json')
    await store.delete('pkce')
    await store.save()
  } catch {
    // Ignore cleanup errors
  }
}

// ── Auth Callback Types ──────────────────────────────────────────────────

type AuthCallback = (params: {
  code: string
  state: string
  provider: 'github' | 'google'
  codeVerifier?: string
}) => void

let authCallbackHandler: AuthCallback | null = null

// Convex client reference for OAuth code exchange
let convexClient: ConvexReactClient | null = null

/**
 * Set the Convex client for OAuth code exchange
 * Call this during app initialization
 */
export function setConvexClient(client: ConvexReactClient): void {
  convexClient = client
}

/**
 * Initialize deep link listener for OAuth callbacks
 * Call this on app startup before any OAuth flow
 */
export async function initDeepLinkAuth(onCallback: AuthCallback): Promise<void> {
  if (!isTauri()) return

  authCallbackHandler = onCallback

  try {
    const { getCurrent, onOpenUrl } = await import('@tauri-apps/plugin-deep-link')

    // Check if app was launched via deep link (cold start)
    const startUrls = await getCurrent()
    if (startUrls && startUrls.length > 0) {
      await handleDeepLinkUrl(startUrls[0])
    }

    // Listen for deep links while app is running (warm start)
    await onOpenUrl(async (urls) => {
      if (urls.length > 0) {
        await handleDeepLinkUrl(urls[0])
      }
    })
  } catch (error) {
    console.error('Failed to initialize deep link auth:', error)
  }
}

/**
 * Parse deep link URL, validate state from PKCE store, and trigger auth callback
 */
async function handleDeepLinkUrl(url: string): Promise<void> {
  if (!authCallbackHandler) {
    console.warn('Deep link received but no auth callback registered')
    return
  }

  try {
    const parsed = new URL(url)

    // Expected format: astn://auth/callback?code=xxx&state=xxx
    if (parsed.hostname !== 'auth' || parsed.pathname !== '/callback') {
      return
    }

    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')

    if (!code || !state) {
      console.error('Auth callback missing code or state')
      return
    }

    // Retrieve PKCE data from Tauri Store (persistent across app kill)
    const storedData = await getPKCEData()
    if (!storedData) {
      console.error('No PKCE data found (expired or missing)')
      return
    }

    // Validate state parameter to prevent CSRF
    if (storedData.state !== state) {
      console.error('OAuth state mismatch')
      return
    }

    authCallbackHandler({
      code,
      state,
      provider: storedData.provider,
      codeVerifier: storedData.codeVerifier,
    })

    // Clean up PKCE data after successful callback dispatch
    await clearPKCEData()
  } catch (error) {
    console.error('Failed to parse auth deep link:', error)
  }
}

/**
 * Get the OAuth redirect URL for Tauri (deep link) or web
 */
export function getOAuthRedirectUrl(): string {
  if (isTauri()) {
    return 'astn://auth/callback'
  }
  // Web fallback - use the current origin
  return typeof window !== 'undefined'
    ? `${window.location.origin}/api/auth/callback`
    : '/api/auth/callback'
}

/**
 * Open OAuth provider in system browser (for Tauri)
 * This opens the browser outside the WebView for a proper OAuth flow
 */
export async function openOAuthInBrowser(url: string): Promise<void> {
  if (!isTauri()) {
    // Web: just navigate
    window.location.href = url
    return
  }

  try {
    // Use Tauri opener plugin - works on iOS/Android to open URLs in system browser
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } catch (error) {
    console.error('[OAuth] Failed to open with opener plugin:', error)
    // Fallback: try window.open
    window.open(url, '_blank')
  }
}

/**
 * OAuth code exchange result type
 */
export type OAuthExchangeResult =
  | {
      success: true
      provider: 'github' | 'google'
      accessToken: string
      idToken?: string
      user: {
        id: string
        email: string
        name: string
        image: string
      }
    }
  | { success: false; error: string }

/**
 * Exchange OAuth code for user session via Convex
 */
export async function exchangeOAuthCode(
  code: string,
  _state: string,
  provider: 'github' | 'google',
  codeVerifier?: string
): Promise<OAuthExchangeResult> {
  if (!convexClient) {
    return { success: false, error: 'Convex client not initialized' }
  }

  try {
    const redirectUri = getOAuthRedirectUrl()

    const result = await convexClient.action(api.authTauri.exchangeOAuthCode, {
      code,
      provider,
      redirectUri,
      codeVerifier,
    })

    // Return the result - the caller (router.tsx) will complete the sign-in
    return { success: true, ...result }
  } catch (error) {
    console.error('OAuth code exchange failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
