<script lang="ts">
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import Dashboard from './home/Dashboard.svelte'
  import LandingPage from './home/LandingPage.svelte'
  import PostAuthSetup from './home/PostAuthSetup.svelte'

  const clerkContext = getClerkContext()
</script>

{#if clerkContext.currentUser}
  <PostAuthSetup />
  <Dashboard />
{:else}
  <LandingPage />
{/if}
