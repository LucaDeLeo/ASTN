<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import { Building2, LogOut, Settings, User } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'

  const clerkContext = getClerkContext()

  const memberships = useQuery(
    api.orgs.membership.getUserMemberships,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  const displayName = $derived(
    clerkContext.currentUser?.fullName ??
      clerkContext.currentUser?.firstName ??
      'User',
  )

  const initials = $derived(
    displayName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2),
  )

  const signOut = async () => {
    await clerkContext.clerk.signOut()
  }
</script>

<header
  class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
>
  <div
    class="flex h-14 items-center justify-between px-4 md:hidden"
    style="padding-top: env(safe-area-inset-top, 0px)"
  >
    <a href="/" class="flex items-center gap-2">
      <img src="/logo.png" alt="" class="h-6" />
      <span class="font-mono font-semibold text-foreground">ASTN</span>
    </a>
    {#if clerkContext.currentUser}
      <div class="flex items-center gap-2">
        <a
          href="/profile"
          class="flex size-9 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground"
        >
          {initials}
        </a>
      </div>
    {:else}
      <a
        href="/login"
        class="rounded-md bg-coral-500 px-3 py-1.5 text-sm font-medium text-white"
      >
        Sign In
      </a>
    {/if}
  </div>

  <div
    class="container mx-auto hidden items-center justify-between px-4 py-4 md:flex"
  >
    <a href="/" class="flex items-center gap-2.5">
      <img src="/logo.png" alt="" class="h-7" />
      <span class="font-mono font-semibold text-foreground">
        AI Safety Talent Network
      </span>
    </a>
    <nav class="flex items-center gap-4">
      <a
        href="/opportunities"
        class="py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Opportunities
      </a>
      <a
        href="/orgs"
        class="py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Organizations
      </a>
      {#if clerkContext.currentUser}
        {#if memberships.data?.length}
          {#each memberships.data.filter((membership) => membership.org.slug) as membership}
            <a
              href={`/org/${membership.org.slug}`}
              class="flex items-center gap-2 rounded-full border border-border px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent"
            >
              <Building2 class="size-3.5" />
              <span>{membership.org.name}</span>
            </a>
          {/each}
        {/if}
        <a
          href="/matches"
          class="py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          Matches
        </a>
        <a
          href="/profile"
          class="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
        >
          <User class="size-4" />
          <span>{displayName}</span>
        </a>
        <a
          href="/settings"
          class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Settings class="size-4" />
          <span>Settings</span>
        </a>
        <button
          type="button"
          onclick={signOut}
          class="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <LogOut class="size-4" />
          <span>Logout</span>
        </button>
      {:else}
        <a
          href="/login"
          class="rounded-md bg-coral-500 px-3 py-1.5 text-sm font-medium text-white"
        >
          Sign In
        </a>
      {/if}
    </nav>
  </div>
</header>
