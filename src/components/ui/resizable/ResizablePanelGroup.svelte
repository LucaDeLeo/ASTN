<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    direction = 'horizontal',
    children,
    ...rest
  }: {
    class?: string
    direction?: 'horizontal' | 'vertical'
    children?: Snippet
  } = $props()
</script>

<div
  data-slot="resizable-panel-group"
  aria-orientation={direction}
  class={cn(
    'flex h-full w-full',
    direction === 'vertical' && 'flex-col',
    className,
  )}
  {...rest}
>
  {@render children?.()}
</div>
