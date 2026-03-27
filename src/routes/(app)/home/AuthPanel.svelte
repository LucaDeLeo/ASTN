<script lang="ts">
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { isTauri } from '$lib/platform'

  type AuthMode = 'sign-in' | 'sign-up'
  type MountedClerk = {
    mountSignIn?: (
      node: HTMLDivElement,
      options?: Record<string, unknown>,
    ) => void | Promise<void>
    mountSignUp?: (
      node: HTMLDivElement,
      options?: Record<string, unknown>,
    ) => void | Promise<void>
    unmountSignIn?: (node?: HTMLDivElement) => void
    unmountSignUp?: (node?: HTMLDivElement) => void
  }

  const clerkContext = getClerkContext()

  const clerkAppearance = {
    variables: {
      colorPrimary: 'oklch(0.7 0.16 30)',
      borderRadius: '0.75rem',
      fontFamily: "'Plus Jakarta Sans Variable', system-ui, sans-serif",
    },
    layout: {
      socialButtonsVariant: 'blockButton',
      socialButtonsPlacement: 'top',
      logoPlacement: 'none',
    },
    elements: {
      rootBox: { width: '100%' },
      cardBox: { boxShadow: 'none' },
      card: {
        boxShadow: 'none',
        backgroundColor: 'transparent',
        border: 'none',
      },
      headerTitle: { display: 'none' },
      headerSubtitle: { display: 'none' },
      footer: { display: 'none' },
      ...(isTauri()
        ? {
            socialButtons: { display: 'none' },
            socialButtonsBlockButton: { display: 'none' },
            dividerRow: { display: 'none' },
          }
        : {}),
    },
  } as const

  let mode = $state<AuthMode>('sign-in')
  let authElement = $state<HTMLDivElement | null>(null)

  const switchMode = (nextMode: AuthMode) => {
    if (mode === nextMode) {
      return
    }

    posthogStore.capture(
      nextMode === 'sign-up' ? 'auth_signup_clicked' : 'auth_signin_clicked',
    )
    mode = nextMode
  }

  $effect(() => {
    if (!authElement || !clerkContext.isClerkLoaded || clerkContext.currentUser) {
      return
    }

    const mountedClerk = clerkContext.clerk as unknown as MountedClerk
    const node = authElement

    mountedClerk.unmountSignIn?.(node)
    mountedClerk.unmountSignUp?.(node)

    if (mode === 'sign-in') {
      void mountedClerk.mountSignIn?.(node, {
        appearance: clerkAppearance,
        afterSignInUrl: '/',
        afterSignUpUrl: '/',
      })
    } else {
      void mountedClerk.mountSignUp?.(node, {
        appearance: clerkAppearance,
        afterSignInUrl: '/',
        afterSignUpUrl: '/',
      })
    }

    return () => {
      mountedClerk.unmountSignIn?.(node)
      mountedClerk.unmountSignUp?.(node)
    }
  })
</script>

<div class="w-full max-w-sm shrink-0 rounded-[1.75rem] border border-border/70 bg-white/92 p-4 shadow-warm-lg backdrop-blur">
  <div class="mb-4 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
    <button
      type="button"
      onclick={() => switchMode('sign-in')}
      class={`rounded-[1rem] px-3 py-2 text-sm font-medium transition-colors ${
        mode === 'sign-in'
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      Sign in
    </button>
    <button
      type="button"
      onclick={() => switchMode('sign-up')}
      class={`rounded-[1rem] px-3 py-2 text-sm font-medium transition-colors ${
        mode === 'sign-up'
          ? 'bg-white text-slate-950 shadow-sm'
          : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      Sign up
    </button>
  </div>

  {#if clerkContext.currentUser}
    <div class="grid min-h-[28rem] place-items-center rounded-[1.25rem] border border-border bg-background text-center text-sm text-muted-foreground">
      Redirecting to your dashboard...
    </div>
  {:else}
    <div class="rounded-[1.25rem] border border-border bg-background p-3 shadow-warm-sm">
      <div bind:this={authElement} class="min-h-[28rem]"></div>
    </div>
  {/if}

  <p class="mt-4 text-center text-sm text-muted-foreground">
    {#if mode === 'sign-in'}
      Don&apos;t have an account?
      <button
        type="button"
        onclick={() => switchMode('sign-up')}
        class="font-medium text-coral-600 hover:underline"
      >
        Sign up
      </button>
    {:else}
      Already have an account?
      <button
        type="button"
        onclick={() => switchMode('sign-in')}
        class="font-medium text-coral-600 hover:underline"
      >
        Sign in
      </button>
    {/if}
  </p>
</div>
