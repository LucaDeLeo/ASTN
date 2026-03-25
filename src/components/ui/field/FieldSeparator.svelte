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
  data-slot="field-separator"
  class={cn('relative -my-2 h-5 text-sm', className)}
  {...rest}
>
  <div class="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border"></div>
  {#if children}
    <span
      class="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
      data-slot="field-separator-content"
    >
      {@render children()}
    </span>
  {/if}
</div>
