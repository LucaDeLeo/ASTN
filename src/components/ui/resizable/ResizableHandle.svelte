<script lang="ts">
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    withHandle = false,
    orientation = 'vertical',
    ...rest
  }: {
    class?: string
    withHandle?: boolean
    orientation?: 'horizontal' | 'vertical'
  } = $props()
</script>

<div
  data-slot="resizable-handle"
  aria-orientation={orientation}
  class={cn(
    'relative flex items-center justify-center bg-border',
    orientation === 'vertical' ? 'w-px' : 'h-px w-full',
    className,
  )}
  {...rest}
>
  {#if withHandle}
    <div class="z-10 flex h-4 w-3 items-center justify-center rounded-xs border bg-border">
      <div class="h-2.5 w-0.5 rounded-full bg-muted-foreground"></div>
    </div>
  {/if}
</div>
