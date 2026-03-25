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
  data-slot="field-title"
  class={cn('flex items-center gap-2 text-sm font-medium leading-snug', className)}
  {...rest}
>
  {@render children?.()}
</div>
