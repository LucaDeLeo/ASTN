<script lang="ts">
  import '../styles/app.css'
  import { Toaster } from 'svelte-sonner'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import { themeStore } from '$lib/stores/theme.svelte'

  const { children } = $props()

  themeStore.apply()
  posthogStore.init()
</script>

{@render children()}

<Toaster position="top-right" richColors />
