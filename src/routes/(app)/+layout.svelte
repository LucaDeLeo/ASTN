<script lang="ts">
  import PosthogIdentitySync from '~/components/auth/PosthogIdentitySync.svelte'
  import OnboardingGuard from '~/components/auth/OnboardingGuard.svelte'
  import AgentSidebar from '~/components/agent-sidebar/AgentSidebar.svelte'
  import AgentSidebarProvider from '~/components/agent-sidebar/AgentSidebarProvider.svelte'
  import SidebarAwareWrapper from '~/components/agent-sidebar/SidebarAwareWrapper.svelte'
  import FeedbackDialog from '~/components/feedback-dialog.svelte'
  import ClerkWrapper from '$lib/wrappers/ClerkWrapper.svelte'
  import ConvexWrapper from '$lib/wrappers/ConvexWrapper.svelte'

  const { children } = $props()
</script>

<ClerkWrapper>
  <ConvexWrapper>
    <AgentSidebarProvider>
      <PosthogIdentitySync />
      <OnboardingGuard>
        <SidebarAwareWrapper>
          {@render children()}
        </SidebarAwareWrapper>
      </OnboardingGuard>
      <AgentSidebar />
      <FeedbackDialog />
    </AgentSidebarProvider>
  </ConvexWrapper>
</ClerkWrapper>
