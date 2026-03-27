<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'
  import { Spinner } from './spinner'

  let {
    onRefresh,
    enabled = true,
    class: className = '',
    children,
  }: {
    onRefresh: () => Promise<void>
    enabled?: boolean
    class?: string
    children?: Snippet
  } = $props()

  let container: HTMLDivElement | undefined
  let startY = 0
  let pullDistance = $state(0)
  let isRefreshing = $state(false)
  let isTriggered = $derived(pullDistance >= 60)

  async function finishRefresh() {
    isRefreshing = true
    try {
      await onRefresh()
    } finally {
      isRefreshing = false
      pullDistance = 0
    }
  }

  function handleTouchStart(event: TouchEvent) {
    if (!enabled || isRefreshing) return
    if ((container?.scrollTop ?? 0) > 0) return
    startY = event.touches[0]?.clientY ?? 0
  }

  function handleTouchMove(event: TouchEvent) {
    if (!enabled || isRefreshing || !startY) return
    if ((container?.scrollTop ?? 0) > 0) return

    const delta = (event.touches[0]?.clientY ?? 0) - startY
    if (delta <= 0) {
      pullDistance = 0
      return
    }

    pullDistance = Math.min(delta * 0.5, 90)
  }

  async function handleTouchEnd() {
    if (!enabled || isRefreshing) return

    if (pullDistance >= 60) {
      await finishRefresh()
      return
    }

    pullDistance = 0
    startY = 0
  }
</script>

<div
  bind:this={container}
  data-pull-to-refresh
  role="region"
  aria-label="Pull to refresh"
  class={cn('relative', className)}
  style:touch-action="pan-y"
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
>
  <div
    class={cn(
      'pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 transition-opacity duration-150',
      pullDistance > 0 || isRefreshing ? 'opacity-100' : 'opacity-0',
    )}
    style:top="8px"
    style:transform={`translateY(${Math.min(pullDistance - 40, 20)}px)`}
  >
    <div
      class={cn(
        'flex size-10 items-center justify-center rounded-full border border-border bg-background/95 shadow-warm-sm backdrop-blur-sm',
        isTriggered || isRefreshing ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      {#if isRefreshing}
        <Spinner class="size-5" />
      {:else}
        <svg
          class={cn(
            'size-5 transition-transform duration-150',
            isTriggered ? 'rotate-180' : 'rotate-0',
          )}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M12 5v14M5 12l7-7 7 7" />
        </svg>
      {/if}
    </div>
  </div>

  <div
    style:transform={
      isRefreshing ? 'translateY(48px)' : `translateY(${pullDistance * 0.5}px)`
    }
    style:transition={
      pullDistance === 0 && !isRefreshing ? 'transform 200ms ease-out' : 'none'
    }
  >
    {@render children?.()}
  </div>
</div>
