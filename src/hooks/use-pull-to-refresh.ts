import { useDrag } from '@use-gesture/react'
import { useCallback, useState } from 'react'

const THRESHOLD = 80 // Pixels to trigger refresh
const MAX_PULL = 120 // Maximum visual pull distance

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  /** Whether pull-to-refresh is enabled (default: true) */
  enabled?: boolean
}

interface UsePullToRefreshReturn {
  /** Bind props to the scrollable container */
  bind: ReturnType<typeof useDrag>
  /** Current pull distance (0 to MAX_PULL) */
  pullDistance: number
  /** Whether currently refreshing */
  isRefreshing: boolean
  /** Whether pull has passed threshold */
  isTriggered: boolean
}

export function usePullToRefresh({
  onRefresh,
  enabled = true,
}: UsePullToRefreshOptions): UsePullToRefreshReturn {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await onRefresh()
    } finally {
      setIsRefreshing(false)
      setPullDistance(0)
    }
  }, [onRefresh])

  const bind = useDrag(
    ({ movement: [, my], last, cancel }) => {
      if (!enabled || isRefreshing) {
        cancel()
        return
      }

      // Only allow pull when page is scrolled to top
      const scrollY = window.scrollY
      if (scrollY > 0 && my > 0) {
        cancel()
        return
      }

      // Only allow downward pull
      if (my < 0) {
        setPullDistance(0)
        return
      }

      // Apply rubber-band effect (diminishing returns past threshold)
      const rubberBand =
        my > THRESHOLD ? THRESHOLD + (my - THRESHOLD) * 0.3 : my
      const clampedDistance = Math.min(rubberBand, MAX_PULL)
      setPullDistance(clampedDistance)

      if (last) {
        if (my >= THRESHOLD) {
          handleRefresh()
        } else {
          setPullDistance(0)
        }
      }
    },
    {
      axis: 'y',
      filterTaps: true,
      pointer: { touch: true },
    },
  )

  return {
    bind,
    pullDistance,
    isRefreshing,
    isTriggered: pullDistance >= THRESHOLD,
  }
}
