<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    size = 'xs',
    type = 'button',
    children,
    ...rest
  }: {
    class?: string
    size?: 'xs' | 'sm' | 'icon-xs' | 'icon-sm'
    type?: 'button' | 'submit' | 'reset'
    children?: Snippet
  } = $props()

  const sizeClasses = {
    xs: 'h-6 rounded-[calc(var(--radius)-5px)] px-2 text-xs',
    sm: 'h-8 rounded-md px-2.5 text-sm',
    'icon-xs': 'size-6 rounded-[calc(var(--radius)-5px)] p-0',
    'icon-sm': 'size-8 rounded-md p-0',
  }
</script>

<button
  type={type}
  class={cn(
    'inline-flex items-center justify-center gap-2 border border-transparent bg-transparent text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
    sizeClasses[size],
    className,
  )}
  {...rest}
>
  {@render children?.()}
</button>
