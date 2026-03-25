<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import {
    Building2,
    HelpCircle,
    LogOut,
    Menu,
    MessageCircleHeart,
    Settings,
    Shield,
    User,
    X,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'

  let {
    user = null,
  }: {
    user?: { name: string; avatarUrl?: string } | null
  } = $props()

  const clerkContext = getClerkContext()
  const memberships = useQuery(
    api.orgs.membership.getUserMemberships,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  let open = $state(false)
  const signOut = async () => {
    open = false
    await clerkContext.clerk.signOut()
  }
</script>

<button
  type="button"
  class="touch-target inline-flex size-10 items-center justify-center rounded-md border border-border bg-background"
  aria-label="Open menu"
  onclick={() => (open = true)}
>
  <Menu class="size-5" />
</button>

{#if open}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/40"
    aria-label="Close menu"
    onclick={() => (open = false)}
  ></button>
  <aside
    class="fixed inset-y-0 right-0 z-[60] flex w-[280px] flex-col border-l bg-background shadow-xl"
  >
    <div class="flex items-center justify-between border-b p-4">
      {#if user}
        <a
          href="/profile"
          class="flex min-w-0 items-center gap-3"
          onclick={() => (open = false)}
        >
          <div
            class="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary"
          >
            {user.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div class="min-w-0">
            <div class="truncate font-medium">{user.name}</div>
            <div class="text-xs text-muted-foreground">View profile</div>
          </div>
        </a>
      {:else}
        <div class="flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground"
          >
            <User class="size-5" />
          </div>
          <span class="text-muted-foreground">Not signed in</span>
        </div>
      {/if}
      <button
        type="button"
        class="inline-flex size-9 items-center justify-center rounded-md border border-border"
        aria-label="Close menu"
        onclick={() => (open = false)}
      >
        <X class="size-4" />
      </button>
    </div>

    <nav class="flex flex-1 flex-col gap-1 p-2">
      <a
        href="/orgs"
        class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
        onclick={() => (open = false)}
      >
        <Building2 class="size-5" />
        <span>Organizations</span>
      </a>

      {#if memberships.data?.length}
        {#each memberships.data.filter((membership) => membership.org.slug) as membership}
          <a
            href={`/org/${membership.org.slug}`}
            class="flex items-center gap-3 rounded-md py-2 pl-6 pr-3 hover:bg-accent"
            onclick={() => (open = false)}
          >
            <Building2 class="size-4" />
            <span class="text-sm">{membership.org.name}</span>
          </a>
        {/each}
      {/if}

      <a
        href="/admin"
        class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
        onclick={() => (open = false)}
      >
        <Shield class="size-5" />
        <span>Admin</span>
      </a>

      <a
        href="/settings"
        class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
        onclick={() => (open = false)}
      >
        <Settings class="size-5" />
        <span>Settings</span>
      </a>

      <a
        href="mailto:support@aisafetytalent.org"
        class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
      >
        <HelpCircle class="size-5" />
        <span>Help</span>
      </a>

      <button
        type="button"
        class="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
        onclick={() => {
          open = false
          window.dispatchEvent(new CustomEvent('astn:open-feedback'))
        }}
      >
        <MessageCircleHeart class="size-5" />
        <span>Feedback</span>
      </button>

      {#if clerkContext.currentUser}
        <button
          type="button"
          class="mt-auto flex items-center gap-3 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10"
          onclick={signOut}
        >
          <LogOut class="size-5" />
          <span>Logout</span>
        </button>
      {/if}
    </nav>
  </aside>
{/if}
