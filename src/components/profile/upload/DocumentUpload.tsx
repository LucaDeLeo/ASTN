import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, FileText, Sparkles, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import type { FileRejection } from 'react-dropzone'
import { cn } from '~/lib/utils'
import { Button } from '~/components/ui/button'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
}

/**
 * Format bytes into human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

interface DocumentUploadProps {
  onFileSelect: (file: File) => void
  error?: string | null
  onErrorDismiss?: () => void
  disabled?: boolean
}

/**
 * Main drag-and-drop upload zone component.
 *
 * Features:
 * - Drag-and-drop PDF files
 * - Click to browse files
 * - Visual feedback for drag states (active, reject)
 * - Error display with shake animation
 * - "Playful confidence" personality per CONTEXT.md
 */
export function DocumentUpload({
  onFileSelect,
  error,
  onErrorDismiss,
  disabled = false,
}: DocumentUploadProps) {
  const [localError, setLocalError] = useState<string | null>(null)
  const [showShake, setShowShake] = useState(false)

  // Combined error from props or local validation
  const displayError = error || localError

  // Trigger shake animation when error changes
  useEffect(() => {
    if (displayError) {
      setShowShake(true)
      const timer = setTimeout(() => setShowShake(false), 150)
      return () => clearTimeout(timer)
    }
  }, [displayError])

  const onDrop = useCallback(
    (acceptedFiles: Array<File>, rejectedFiles: Array<FileRejection>) => {
      // Clear any previous error
      setLocalError(null)

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0]
        const errorCode = rejection.errors[0]?.code

        if (errorCode === 'file-too-large') {
          setLocalError(
            `File exceeds 10MB limit (yours: ${formatBytes(rejection.file.size)})`,
          )
        } else if (errorCode === 'file-invalid-type') {
          setLocalError('Please upload a PDF file')
        } else {
          setLocalError(rejection.errors[0]?.message || 'Invalid file')
        }
        return
      }

      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0])
      }
    },
    [onFileSelect],
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject, open } =
    useDropzone({
      onDrop,
      accept: ACCEPTED_TYPES,
      maxSize: MAX_SIZE,
      maxFiles: 1,
      multiple: false,
      disabled,
      noClick: false,
      noKeyboard: false,
    })

  const handleDismissError = useCallback(() => {
    setLocalError(null)
    onErrorDismiss?.()
  }, [onErrorDismiss])

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        aria-label="File upload drop zone"
        className={cn(
          // Base styles
          'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          // Idle state
          !isDragActive &&
            !isDragReject &&
            !disabled &&
            'border-muted-foreground/25 hover:border-primary/50 hover:bg-primary/5',
          // Drag active state (valid file hovering)
          isDragActive &&
            !isDragReject &&
            'border-primary bg-primary/10 scale-[1.02]',
          // Drag reject state (invalid file)
          isDragReject && 'border-destructive bg-destructive/10',
          // Error state
          displayError && showShake && 'animate-shake',
          displayError && 'border-destructive/50',
          // Disabled state
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <input {...getInputProps()} />

        {/* Reveal element - appears when dragging a valid file */}
        {isDragActive && !isDragReject && (
          <div
            role="status"
            className="absolute inset-0 flex items-center justify-center animate-reveal"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-primary/20 p-4">
                <Sparkles className="size-8 text-primary animate-pulse" />
              </div>
              <span className="text-lg font-medium text-primary">
                Drop it here!
              </span>
            </div>
          </div>
        )}

        {/* Reject state overlay */}
        {isDragReject && (
          <div
            role="alert"
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex flex-col items-center gap-2">
              <div className="rounded-full bg-destructive/20 p-4">
                <X className="size-8 text-destructive" />
              </div>
              <span className="text-lg font-medium text-destructive">
                PDF files only
              </span>
            </div>
          </div>
        )}

        {/* Default idle content - always rendered to maintain height, hidden during drag */}
        <div
          className={cn(
            'flex flex-col items-center gap-4 transition-opacity duration-200',
            (isDragActive || isDragReject) && 'opacity-0 invisible',
          )}
        >
          {/* Icon */}
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="size-8 text-primary" />
          </div>

          {/* Main text */}
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Drop your resume here</h3>
            <p className="text-sm text-muted-foreground">PDF up to 10MB</p>
          </div>

          {/* Browse button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              open()
            }}
            disabled={disabled}
            className="mt-2"
          >
            <FileText className="mr-2 size-4" />
            Browse files
          </Button>
        </div>
      </div>

      {/* Error message */}
      {displayError && (
        <div
          role="alert"
          className={cn(
            'mt-3 flex items-center gap-2 text-sm text-destructive',
            showShake && 'animate-shake',
          )}
        >
          <AlertCircle className="size-4 shrink-0" />
          <span className="flex-1">{displayError}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 hover:bg-destructive/10"
            onClick={handleDismissError}
          >
            <X className="size-3" />
            <span className="sr-only">Dismiss error</span>
          </Button>
        </div>
      )}
    </div>
  )
}
