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

<label
  data-slot="field-label"
  class={cn(
    'flex w-fit gap-2 text-sm font-medium leading-snug',
    className,
  )}
  {...rest}
>
  {@render children?.()}
</label>
