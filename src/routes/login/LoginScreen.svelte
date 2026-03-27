<script lang="ts">
  import { goto } from '$app/navigation'
  import { onMount } from 'svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import PublicHeader from '~/components/layout/public-header.svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'

  type MountedClerk = {
    mountSignIn?: (
      node: HTMLDivElement,
      options?: Record<string, unknown>,
    ) => void | Promise<void>
    unmountSignIn?: (node?: HTMLDivElement) => void
  }

  const clerkContext = getClerkContext()

  let signInElement = $state<HTMLDivElement | null>(null)

  $effect(() => {
    if (clerkContext.currentUser) {
      void goto('/')
    }
  })

  onMount(() => {
    if (!signInElement || clerkContext.currentUser) {
      return
    }

    const mountedClerk = clerkContext.clerk as unknown as MountedClerk

    void mountedClerk.mountSignIn?.(signInElement, {
      afterSignInUrl: '/',
      afterSignUpUrl: '/',
    })

    return () => {
      mountedClerk.unmountSignIn?.(signInElement ?? undefined)
    }
  })
</script>

<GradientBg variant="subtle">
  <PublicHeader />
  <main class="container mx-auto flex min-h-[calc(100dvh-73px)] items-center justify-center px-4 py-12">
    <div class="grid w-full max-w-5xl gap-10 rounded-[2rem] border border-border/60 bg-white/90 p-6 shadow-warm-lg backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-10">
      <section class="space-y-5">
        <p class="text-sm font-medium uppercase tracking-[0.2em] text-coral-600">
          Sign in
        </p>
        <h1 class="font-display text-4xl leading-tight text-slate-950">
          Return to your AI safety career command center.
        </h1>
        <p class="max-w-xl text-base text-slate-600">
          Keep your profile current, review new matches, and track next steps
          across opportunities, organizations, and events.
        </p>
        <div class="grid gap-3 pt-2 text-sm text-slate-600">
          <div class="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3">
            Match explanations tied to your real profile.
          </div>
          <div class="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3">
            Career actions that update as your goals change.
          </div>
          <div class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            Org, event, and application workflows in one place.
          </div>
        </div>
      </section>

      <section class="rounded-[1.5rem] border border-border bg-background p-3 shadow-warm-sm md:p-4">
        {#if clerkContext.currentUser}
          <div class="grid min-h-[28rem] place-items-center text-center text-sm text-muted-foreground">
            Redirecting to your dashboard...
          </div>
        {:else}
          <div bind:this={signInElement} class="min-h-[28rem]"></div>
        {/if}
      </section>
    </div>
  </main>
</GradientBg>
