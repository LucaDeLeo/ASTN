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
  data-slot="field-content"
  class={cn('flex flex-1 flex-col gap-1.5 leading-snug', className)}
  {...rest}
>
  {@render children?.()}
</div>
