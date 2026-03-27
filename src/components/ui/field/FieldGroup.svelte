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
  data-slot="field-group"
  class={cn('flex w-full flex-col gap-7', className)}
  {...rest}
>
  {@render children?.()}
</div>
