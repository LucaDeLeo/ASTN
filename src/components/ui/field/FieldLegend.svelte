<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'
  let {
    class: className = '',
    variant = 'legend',
    children,
    ...rest
  }: {
    class?: string
    variant?: 'legend' | 'label'
    children?: Snippet
  } = $props()
</script>

<legend
  data-slot="field-legend"
  data-variant={variant}
  class={cn(
    'mb-3 font-medium',
    variant === 'legend' ? 'text-base' : 'text-sm',
    className,
  )}
  {...rest}
>
  {@render children?.()}
</legend>
