<script lang="ts">
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    size = 'md',
    ...rest
  }: {
    class?: string
    size?: 'sm' | 'md' | 'lg'
  } = $props()

  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  }
</script>

<div
  class={cn(
    'animate-spin rounded-full border-2 border-slate-200 border-t-slate-600',
    sizeClasses[size],
    className,
  )}
  role="status"
  aria-label="Loading"
  {...rest}
>
  <span class="sr-only">Loading...</span>
</div>
