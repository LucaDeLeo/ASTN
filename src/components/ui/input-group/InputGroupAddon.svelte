<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    align = 'inline-start',
    children,
    ...rest
  }: {
    class?: string
    align?: 'inline-start' | 'inline-end' | 'block-start' | 'block-end'
    children?: Snippet
  } = $props()

  const alignClasses = {
    'inline-start': 'order-first pl-3',
    'inline-end': 'order-last pr-3',
    'block-start': 'order-first w-full justify-start px-3 pt-3',
    'block-end': 'order-last w-full justify-start px-3 pb-3',
  }
</script>

<div
  role="group"
  data-slot="input-group-addon"
  data-align={align}
  class={cn(
    'flex h-auto items-center justify-center gap-2 py-1.5 text-sm font-medium text-muted-foreground',
    alignClasses[align],
    className,
  )}
  {...rest}
>
  {@render children?.()}
</div>
