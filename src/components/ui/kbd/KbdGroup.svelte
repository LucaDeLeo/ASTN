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
  data-slot="kbd-group"
  class={cn('inline-flex items-center gap-1', className)}
  {...rest}
>
  {@render children?.()}
</div>
