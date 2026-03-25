<script lang="ts">
  import { cn } from '~/lib/utils'
  let { class: className = '', ...rest } = $props()
</script>

<input
  data-slot="input-group-control"
  class={cn(
    'h-9 flex-1 rounded-none border-0 bg-transparent px-3 text-sm shadow-none outline-none',
    className,
  )}
  {...rest}
/>
