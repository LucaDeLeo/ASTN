import { useEffect, useState } from 'react'
import { cn } from '~/lib/utils'

interface LiveTimerProps {
  startedAt: number
  durationMs: number
  className?: string
}

export function LiveTimer({
  startedAt,
  durationMs,
  className,
}: LiveTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, startedAt + durationMs - Date.now()),
  )

  useEffect(() => {
    const update = () => {
      setRemaining(Math.max(0, startedAt + durationMs - Date.now()))
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [startedAt, durationMs])

  const minutes = Math.floor(remaining / 60000)
  const seconds = Math.floor((remaining % 60000) / 1000)
  const isLow = remaining < 60000 && remaining > 0
  const isUp = remaining === 0

  return (
    <span
      className={cn(
        'tabular-nums font-mono text-lg font-bold',
        isLow && 'text-red-500 animate-pulse',
        isUp && 'text-red-600',
        className,
      )}
    >
      {isUp
        ? "Time's up"
        : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
    </span>
  )
}
