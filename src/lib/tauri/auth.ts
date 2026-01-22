// src/lib/tauri/auth.ts
// Deep link OAuth handler for Tauri mobile apps

import { isTauri } from '../platform'
import { api } from '../../../convex/_generated/api'
import type { ConvexReactClient } from 'convex/react'

type AuthCallback = (params: {
  code: string
  state: string
  provider: 'github' | 'google'
}) => void

let authCallbackHandler: AuthCallback | null = null

// Provider tracking - store which provider the OAuth flow was started with
let pendingOAuthProvider: 'github' | 'google' | null = null

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
      handleDeepLinkUrl(startUrls[0])
    }

    // Listen for deep links while app is running (warm start)
    await onOpenUrl((urls) => {
      if (urls.length > 0) {
        handleDeepLinkUrl(urls[0])
      }
    })
  } catch (error) {
    console.error('Failed to initialize deep link auth:', error)
  }
}

/**
 * Parse deep link URL and trigger auth callback
 */
function handleDeepLinkUrl(url: string): void {
  if (!authCallbackHandler) {
    console.warn('Deep link received but no auth callback registered')
    return
  }

  try {
    const parsed = new URL(url)

    // Expected format: astn://auth/callback?code=xxx&state=xxx
    if (parsed.hostname !== 'auth' || parsed.pathname !== '/callback') {
      console.log('Deep link not an auth callback:', url)
      return
    }

    const code = parsed.searchParams.get('code')
    const state = parsed.searchParams.get('state')

    if (!code || !state) {
      console.error('Auth callback missing code or state')
      return
    }

    // Determine provider from tracked pending OAuth provider
    const provider = determineProvider()

    authCallbackHandler({ code, state, provider })
  } catch (error) {
    console.error('Failed to parse auth deep link:', error)
  }
}

export function setPendingOAuthProvider(provider: 'github' | 'google'): void {
  pendingOAuthProvider = provider
}

function determineProvider(): 'github' | 'google' {
  // Return the tracked provider, defaulting to github
  return pendingOAuthProvider || 'github'
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
    // Use Tauri shell to open in system browser
    const { open } = await import('@tauri-apps/plugin-shell')
    await open(url)
  } catch (error) {
    // Fallback: try window.open
    console.warn('Failed to open with Tauri shell, falling back to window.open:', error)
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
  provider: 'github' | 'google'
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
    })

    // Store the OAuth result for use with @convex-dev/auth
    // The signIn function from useAuthActions can accept OAuth tokens
    console.log('OAuth exchange successful:', result.user.email)

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
