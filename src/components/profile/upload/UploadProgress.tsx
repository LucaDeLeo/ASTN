import { cn } from '~/lib/utils'

interface UploadProgressProps {
  progress: number // 0-100
  status: 'uploading' | 'processing'
  fileName?: string
}

/**
 * Animated progress indicator for file upload.
 *
 * Features:
 * - Horizontal progress bar with smooth transition (500ms minimum)
 * - Percentage display
 * - Status text changes based on upload/processing state
 * - Processing state uses pulse animation for visual distinction
 */
export function UploadProgress({
  progress,
  status,
  fileName,
}: UploadProgressProps) {
  // Clamp progress to valid range
  const clampedProgress = Math.min(100, Math.max(0, progress))

  // Status text based on current state
  const statusText =
    status === 'uploading'
      ? fileName
        ? `Uploading ${fileName}...`
        : 'Uploading...'
      : 'Analyzing your resume...'

  return (
    <div className="w-full space-y-2">
      {/* Status text */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            'text-muted-foreground',
            status === 'processing' && 'animate-pulse-processing',
          )}
        >
          {statusText}
        </span>
        <span className="font-medium tabular-nums">
          {Math.round(clampedProgress)}%
        </span>
      </div>

      {/* Progress bar container */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        {/* Progress bar fill */}
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            status === 'uploading' && 'bg-primary',
            status === 'processing' && 'bg-primary animate-pulse-processing',
          )}
          style={{ width: `${clampedProgress}%` }}
          role="progressbar"
          aria-valuenow={clampedProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  )
}
