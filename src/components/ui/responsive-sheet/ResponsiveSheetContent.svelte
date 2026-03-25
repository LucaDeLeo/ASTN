<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'
  import { getResponsiveSheetContext } from './context'

  const { open, setOpen } = getResponsiveSheetContext()
  let {
    class: className = '',
    children,
    ...rest
  }: {
    class?: string
    children?: Snippet
  } = $props()
</script>

{#if $open}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/40"
    aria-label="Close sheet"
    onclick={() => setOpen(false)}
  ></button>
  <div
    role="dialog"
    aria-modal="true"
    class={cn(
      'fixed inset-x-0 bottom-0 z-50 max-h-[85vh] rounded-t-xl border bg-background p-6 shadow-lg md:inset-auto md:left-1/2 md:top-1/2 md:w-full md:max-w-2xl md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-xl',
      className,
    )}
    {...rest}
  >
    <div class="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted-foreground/20 md:hidden"></div>
    {@render children?.()}
  </div>
{/if}
