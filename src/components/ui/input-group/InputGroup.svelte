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
  data-slot="input-group"
  role="group"
  class={cn(
    'group/input-group relative flex w-full items-center rounded-md border border-input shadow-xs outline-none transition-[color,box-shadow]',
    className,
  )}
  {...rest}
>
  {@render children?.()}
</div>
