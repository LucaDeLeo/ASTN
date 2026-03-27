<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'
  let {
    class: className = '',
    children,
    ...rest
  }: {
    class?: string
    children?: Snippet
  } = $props()
</script>

<h2 class={cn('font-display text-xl font-semibold text-foreground', className)} {...rest}>
  {@render children?.()}
</h2>
