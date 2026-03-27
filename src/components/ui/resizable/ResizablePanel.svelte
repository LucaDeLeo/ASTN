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

<div
  data-slot="resizable-panel"
  class={cn('min-w-0 flex-1', className)}
  {...rest}
>
  {@render children?.()}
</div>
