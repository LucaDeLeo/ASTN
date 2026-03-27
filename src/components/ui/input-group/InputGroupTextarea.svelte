<script lang="ts">
  import { cn } from '~/lib/utils'
  let { class: className = '', ...rest } = $props()
</script>

<textarea
  data-slot="input-group-control"
  class={cn(
    'min-h-24 flex-1 resize-none rounded-none border-0 bg-transparent px-3 py-3 text-sm shadow-none outline-none',
    className,
  )}
  {...rest}
></textarea>
