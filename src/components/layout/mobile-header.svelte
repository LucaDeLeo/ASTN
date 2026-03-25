<script lang="ts">
  import HamburgerMenu from '~/components/layout/hamburger-menu.svelte'

  let {
    user = null,
  }: {
    user?: { name: string; avatarUrl?: string } | null
  } = $props()
</script>

<header
  class="shrink-0 border-b bg-background"
  style="
    padding-top: env(safe-area-inset-top, 0px);
    view-transition-name: mobile-header;
  "
>
  <div class="flex h-14 items-center justify-between px-4">
    <a href="/" class="flex items-center gap-2">
      <img src="/logo.png" alt="" class="h-6" />
      <span class="font-mono font-semibold text-foreground">ASTN</span>
    </a>
    <HamburgerMenu {user} />
  </div>
</header>
