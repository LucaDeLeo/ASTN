<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import {
    Briefcase,
    CalendarDays,
    ClipboardList,
    FolderKanban,
    Settings,
    Shield,
    Sparkles,
    Users,
    Wrench,
  } from 'lucide-svelte'
  import AdminAgentProvider from '~/components/admin-agent/AdminAgentProvider.svelte'
  import AdminAgentSidebar from '~/components/admin-agent/AdminAgentSidebar.svelte'
  import AdminSidebarAwareWrapper from '~/components/admin-agent/AdminSidebarAwareWrapper.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'

  const clerkContext = getClerkContext()
  const { children } = $props()

  const slug = $derived(page.params.slug ?? '')
  const pathname = $derived(page.url.pathname)

  const navItems = $derived([
    {
      href: `/org/${slug}/admin`,
      label: 'Overview',
      icon: Shield,
    },
    {
      href: `/org/${slug}/admin/members`,
      label: 'Members',
      icon: Users,
    },
    {
      href: `/org/${slug}/admin/applications`,
      label: 'Applications',
      icon: ClipboardList,
    },
    {
      href: `/org/${slug}/admin/opportunities`,
      label: 'Opportunities',
      icon: Briefcase,
    },
    {
      href: `/org/${slug}/admin/programs`,
      label: 'Programs',
      icon: FolderKanban,
    },
    {
      href: `/org/${slug}/admin/setup`,
      label: 'Setup',
      icon: Wrench,
    },
    {
      href: `/org/${slug}/admin/settings`,
      label: 'Settings',
      icon: Settings,
    },
    {
      href: `/org/${slug}/admin/space`,
      label: 'Space',
      icon: CalendarDays,
    },
  ])

  $effect(() => {
    if (clerkContext.isClerkLoaded && !clerkContext.currentUser) {
      void goto('/login')
    }
  })
</script>

<svelte:head>
  <title>Org Admin | ASTN</title>
</svelte:head>

{#if !clerkContext.isClerkLoaded || !clerkContext.currentUser}
  <GradientBg variant="subtle">
    <AuthHeader />
    <div class="flex min-h-[calc(100vh-65px)] items-center justify-center">
      <div class="flex items-center gap-3 rounded-full border border-border/70 bg-white/90 px-4 py-2 text-sm text-slate-600 shadow-warm-sm">
        <Sparkles class="size-4 text-coral-500" />
        <span>Loading admin tools…</span>
      </div>
    </div>
  </GradientBg>
{:else}
  <AdminAgentProvider orgSlug={slug}>
    <AdminSidebarAwareWrapper>
      <GradientBg variant="subtle">
        <AuthHeader />

        <main class="container mx-auto px-4 py-8">
          <div class="mb-5 flex items-center gap-2 text-sm text-slate-500">
            <a href={`/org/${slug}`} class="transition-colors hover:text-slate-800">Organization</a>
            <span>/</span>
            <span class="font-medium text-slate-800">Admin</span>
          </div>

          <div class="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
            <aside class="space-y-3 xl:sticky xl:top-20 xl:self-start">
              <div class="rounded-[1.75rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm">
                <p class="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">
                  Org Admin
                </p>
                <nav class="mt-3 grid gap-1.5">
                  {#each navItems as item}
                    <a
                      href={item.href}
                      class={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                        pathname === item.href || pathname.startsWith(`${item.href}/`)
                          ? 'bg-slate-950 text-white shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                      }`}
                    >
                      <item.icon class="size-4" />
                      <span>{item.label}</span>
                    </a>
                  {/each}
                </nav>
              </div>
            </aside>

            <div class="min-w-0">
              {@render children()}
            </div>
          </div>
        </main>
      </GradientBg>
    </AdminSidebarAwareWrapper>
    <AdminAgentSidebar />
  </AdminAgentProvider>
{/if}
