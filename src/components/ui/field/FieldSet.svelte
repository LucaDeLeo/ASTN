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

<fieldset
  data-slot="field-set"
  class={cn('flex flex-col gap-6', className)}
  {...rest}
>
  {@render children?.()}
</fieldset>
