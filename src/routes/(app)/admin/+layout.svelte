<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { BarChart3, Briefcase, FileText, Home, Users } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  const { children } = $props()
  const pathname = $derived(page.url.pathname)
  const isPlatformAdmin = useQuery(api.orgApplications.checkPlatformAdmin)

  const navItems = [
    { href: '/admin', label: 'Overview', icon: Home },
    { href: '/admin/applications', label: 'Applications', icon: FileText },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/opportunities', label: 'Opportunities', icon: Briefcase },
    { href: '/admin/costs', label: 'LLM Costs', icon: BarChart3 },
  ]

  $effect(() => {
    if (isPlatformAdmin.data === false) {
      void goto('/')
    }
  })
</script>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if isPlatformAdmin.isLoading}
      <div class="flex min-h-[50vh] items-center justify-center text-sm text-slate-600">Loading platform admin…</div>
    {:else if !isPlatformAdmin.data}
      <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <h1 class="font-display text-3xl text-slate-950">Platform admin access required</h1>
      </div>
    {:else}
      <div class="grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside class="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div class="rounded-[1.75rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm">
            <p class="px-2 text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">Platform Admin</p>
            <nav class="mt-3 grid gap-1.5">
              {#each navItems as item}
                <a href={item.href} class={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition ${
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                    ? 'bg-slate-950 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`}>
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
    {/if}
  </main>
</GradientBg>
