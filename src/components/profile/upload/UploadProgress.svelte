<script lang="ts">
  import { cn } from '~/lib/utils'

  let {
    progress,
    status,
    fileName,
  }: {
    progress: number
    status: 'uploading' | 'processing'
    fileName?: string
  } = $props()

  const clampedProgress = $derived(Math.min(100, Math.max(0, progress)))
  const statusText = $derived(
    status === 'uploading'
      ? fileName
        ? `Uploading ${fileName}...`
        : 'Uploading...'
      : 'Analyzing your resume...',
  )
</script>

<div class="w-full space-y-2">
  <div class="flex items-center justify-between text-sm">
    <span
      class={cn(
        'text-muted-foreground',
        status === 'processing' && 'animate-pulse-processing',
      )}
    >
      {statusText}
    </span>
    <span class="font-medium tabular-nums">{Math.round(clampedProgress)}%</span>
  </div>

  <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
    <div
      class={cn(
        'h-full rounded-full transition-all duration-500 ease-out',
        status === 'uploading' && 'bg-primary',
        status === 'processing' && 'animate-pulse-processing bg-primary',
      )}
      style={`width: ${clampedProgress}%`}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
    ></div>
  </div>
</div>
