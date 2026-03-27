<script lang="ts">
  import { onMount } from 'svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import {
    setAgentSidebarContext,
    type AgentSidebarStore,
  } from '$lib/stores/agent-sidebar.svelte'
  import AgentConsentDialog from '~/components/agent-sidebar/AgentConsentDialog.svelte'
  import { useConvexClient, useQuery } from 'convex-svelte'

  const { children } = $props()

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const sidebar = setAgentSidebarContext()

  const profile = useQuery(api.profiles.getOrCreateProfile, () =>
    clerkContext.currentUser ? {} : 'skip',
  )

  let hasAutoOpened = $state(false)
  let isCreatingThread = $state(false)
  let hasSentGreeting = $state(false)

  onMount(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === '.') {
        event.preventDefault()
        sidebar.toggle()
      }
    }

    window.addEventListener('keydown', handleShortcut)

    return () => {
      window.removeEventListener('keydown', handleShortcut)
    }
  })

  $effect(() => {
    sidebar.syncProfile(profile.data ?? null)
  })

  $effect(() => {
    const currentProfile = profile.data

    if (!currentProfile || hasAutoOpened) return
    if (currentProfile.agentThreadId) return

    hasAutoOpened = true

    if (currentProfile.consentedAt) {
      sidebar.open()
      return
    }

    sidebar.showConsentDialog = true
  })

  $effect(() => {
    const currentProfile = profile.data

    if (!currentProfile || !sidebar.isOpen || isCreatingThread) return
    if (!currentProfile.consentedAt || currentProfile.agentThreadId) return

    isCreatingThread = true

    void convex
      .mutation(api.agent.threadOps.createAgentThread, {
        profileId: currentProfile._id,
      })
      .then(async (threadId) => {
        if (
          currentProfile.name ||
          currentProfile.hasEnrichmentConversation ||
          hasSentGreeting
        ) {
          return
        }

        hasSentGreeting = true
        const browserLocale =
          typeof navigator === 'undefined' ? undefined : navigator.language

        await convex.mutation(api.agent.threadOps.sendMessage, {
          threadId,
          prompt: browserLocale?.startsWith('es')
            ? 'Hola! Acabo de registrarme.'
            : 'Hi! I just signed up.',
          profileId: currentProfile._id,
          browserLocale,
        })
      })
      .catch(() => {
        // Thread bootstrap is best effort.
      })
      .finally(() => {
        isCreatingThread = false
      })
  })

  const handleConsented = () => {
    sidebar.showConsentDialog = false
    sidebar.hasConsent = true
    sidebar.open()
  }
</script>

{@render children()}

<AgentConsentDialog open={sidebar.showConsentDialog} onConsented={handleConsented} />
