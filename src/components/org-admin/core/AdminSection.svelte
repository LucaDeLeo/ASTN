<script lang="ts">
  import type { Snippet } from 'svelte'

  let {
    title = '',
    subtitle = '',
    actions,
    children,
  }: {
    title?: string
    subtitle?: string
    actions?: Snippet
    children?: Snippet
  } = $props()
</script>

<section class="overflow-hidden rounded-[1.75rem] border border-border/70 bg-white/92 shadow-warm-sm">
  {#if title || subtitle || actions}
    <header class="flex flex-col gap-4 border-b border-border/70 px-6 py-5 md:flex-row md:items-start md:justify-between">
      <div>
        {#if title}
          <h2 class="text-lg font-semibold text-slate-950">{title}</h2>
        {/if}
        {#if subtitle}
          <p class="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
        {/if}
      </div>

      {#if actions}
        <div class="shrink-0">
          {@render actions()}
        </div>
      {/if}
    </header>
  {/if}

  <div class="px-6 py-5">
    {@render children?.()}
  </div>
</section>
