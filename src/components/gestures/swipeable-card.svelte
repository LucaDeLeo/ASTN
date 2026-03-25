<script lang="ts">
  import type { Snippet } from 'svelte'
  import { Bookmark, Check, X } from 'lucide-svelte'

  let {
    children,
    onSwipeLeft,
    onSwipeRight,
    enabled = true,
  }: {
    children?: Snippet
    onSwipeLeft?: () => void
    onSwipeRight?: () => void
    enabled?: boolean
  } = $props()

  const THRESHOLD = 96
  const MAX_OFFSET = 140

  let offset = $state(0)
  let dragging = $state(false)
  let pointerId = $state<number | null>(null)
  let startX = $state(0)
  let resolvedDirection = $state<'left' | 'right' | null>(null)
  let isExiting = $state(false)

  const clampOffset = (value: number) => Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, value))

  const reset = () => {
    dragging = false
    pointerId = null
    offset = 0
    resolvedDirection = null
    isExiting = false
  }

  const commitSwipe = (direction: 'left' | 'right') => {
    resolvedDirection = direction
    isExiting = true
    dragging = false
    offset = direction === 'left' ? -window.innerWidth : window.innerWidth

    window.setTimeout(() => {
      if (direction === 'left') {
        onSwipeLeft?.()
      } else {
        onSwipeRight?.()
      }
      reset()
    }, 180)
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (!enabled || dragging || isExiting) {
      return
    }

    pointerId = event.pointerId
    dragging = true
    startX = event.clientX
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (!dragging || pointerId !== event.pointerId) {
      return
    }

    offset = clampOffset(event.clientX - startX)
  }

  const handlePointerUp = (event: PointerEvent) => {
    if (!dragging || pointerId !== event.pointerId) {
      return
    }

    const direction =
      offset <= -THRESHOLD ? 'left' : offset >= THRESHOLD ? 'right' : null

    if (direction) {
      commitSwipe(direction)
      return
    }

    reset()
  }

  const leftOpacity = $derived(Math.min(Math.max(-offset / THRESHOLD, 0), 1))
  const rightOpacity = $derived(Math.min(Math.max(offset / THRESHOLD, 0), 1))
</script>

<div class="relative overflow-hidden">
  <div class="pointer-events-none absolute inset-0 flex items-center justify-between px-5">
    <div
      class="flex size-11 items-center justify-center rounded-full bg-rose-500 text-white transition-opacity"
      style:opacity={leftOpacity}
    >
      <X class="size-5" />
    </div>
    <div
      class="flex size-11 items-center justify-center rounded-full bg-emerald-500 text-white transition-opacity"
      style:opacity={rightOpacity}
    >
      <Bookmark class="size-5" />
    </div>
  </div>

  <div
    class={`swipeable touch-pan-y ${dragging ? '' : 'transition-transform duration-200 ease-out'}`}
    style:transform={`translateX(${offset}px) rotate(${offset / 22}deg)`}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerUp}
    role="presentation"
  >
    {@render children?.()}
  </div>
  {#if resolvedDirection === 'right' && isExiting}
    <div class="pointer-events-none absolute bottom-3 right-4 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 shadow-sm">
      <Check class="size-3.5" />
      Saved
    </div>
  {/if}
</div>
