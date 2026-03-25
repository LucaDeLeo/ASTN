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

<span
  class={cn('flex items-center gap-2 text-sm text-muted-foreground', className)}
  {...rest}
>
  {@render children?.()}
</span>
