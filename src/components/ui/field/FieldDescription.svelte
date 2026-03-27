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

<p
  data-slot="field-description"
  class={cn(
    'text-sm leading-normal text-muted-foreground [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
    className,
  )}
  {...rest}
>
  {@render children?.()}
</p>
