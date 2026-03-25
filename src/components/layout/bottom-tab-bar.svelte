<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import {
    Briefcase,
    Home,
    Settings,
    Target,
    User,
  } from 'lucide-svelte'

  const tabs = [
    { href: '/', label: 'Home', icon: Home, exact: true },
    { href: '/opportunities', label: 'Jobs', icon: Briefcase, exact: false },
    { href: '/matches', label: 'Matches', icon: Target, exact: false },
    { href: '/profile', label: 'Profile', icon: User, exact: false },
    { href: '/settings', label: 'Settings', icon: Settings, exact: false },
  ] as const

  const currentPath = $derived(page.url.pathname)

  const isActive = (href: string, exact: boolean) =>
    exact
      ? currentPath === href
      : currentPath === href || currentPath.startsWith(`${href}/`)

  const handleClick = async (event: MouseEvent, href: string, exact: boolean) => {
    if (isActive(href, exact)) {
      event.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    event.preventDefault()
    await goto(href)
  }
</script>

<nav
  class="shrink-0 border-t bg-background"
  style="
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    view-transition-name: bottom-tab-bar;
  "
  aria-label="Main navigation"
>
  <div class="flex h-14 items-stretch">
    {#each tabs as tab}
      <a
        href={tab.href}
        onclick={(event) => handleClick(event, tab.href, tab.exact)}
        class={`flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 transition-colors ${
          isActive(tab.href, tab.exact)
            ? 'font-semibold text-primary'
            : 'text-muted-foreground'
        }`}
      >
        <tab.icon class="size-5" />
        <span class="max-w-full truncate px-0.5 text-[10px] leading-tight">
          {tab.label}
        </span>
      </a>
    {/each}
  </div>
</nav>
