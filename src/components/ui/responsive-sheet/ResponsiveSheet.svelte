<script lang="ts">
  import type { Snippet } from 'svelte'
  import { createResponsiveSheetContext } from './context'

  let {
    open = false,
    children,
  }: {
    open?: boolean
    children?: Snippet
  } = $props()

  const context = createResponsiveSheetContext()

  $effect(() => {
    context.setOpen(open)
  })
</script>

{@render children?.()}
