<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'
  import { getResponsiveSheetContext } from './context'

  const context = getResponsiveSheetContext()
  let {
    class: className = '',
    children,
    ...rest
  }: {
    class?: string
    children?: Snippet
  } = $props()
</script>

<button
  type="button"
  class={cn('inline-flex', className)}
  onclick={() => context.setOpen(false)}
  {...rest}
>
  {@render children?.()}
</button>
