import { browser } from '$app/environment'
import { PUBLIC_POSTHOG_HOST, PUBLIC_POSTHOG_KEY } from '$env/static/public'
import posthog from 'posthog-js'

export class PostHogStore {
  initialized = $state(false)

  init() {
    if (!browser || this.initialized || !PUBLIC_POSTHOG_KEY) {
      return
    }

    posthog.init(PUBLIC_POSTHOG_KEY, {
      api_host: '/ingest',
      ui_host: PUBLIC_POSTHOG_HOST || 'https://us.posthog.com',
      defaults: '2025-05-24',
      capture_pageview: true,
      capture_pageleave: true,
      capture_exceptions: true,
      debug: import.meta.env.DEV,
    })

    this.initialized = true
  }

  identify(user: {
    id: string
    email?: string | null
    name?: string | null
  }) {
    if (!this.initialized) {
      return
    }

    posthog.identify(user.id, {
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    })
  }

  reset() {
    if (!this.initialized) {
      return
    }

    posthog.reset()
  }

  capture(event: string, properties?: Record<string, unknown>) {
    if (!this.initialized) {
      return
    }

    posthog.capture(event, properties)
  }
}

export const posthogStore = new PostHogStore()
