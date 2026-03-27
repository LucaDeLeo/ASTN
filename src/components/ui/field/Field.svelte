<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    orientation = 'vertical',
    children,
    ...rest
  }: {
    class?: string
    orientation?: 'vertical' | 'horizontal' | 'responsive'
    children?: Snippet
  } = $props()

  const orientationClasses = {
    vertical: 'flex-col [&>*]:w-full',
    horizontal: 'flex-row items-center',
    responsive: 'flex-col md:flex-row md:items-center [&>*]:w-full md:[&>*]:w-auto',
  }
</script>

<div
  role="group"
  data-slot="field"
  data-orientation={orientation}
  class={cn(
    'flex w-full gap-3 data-[invalid=true]:text-destructive',
    orientationClasses[orientation],
    className,
  )}
  {...rest}
>
  {@render children?.()}
</div>
