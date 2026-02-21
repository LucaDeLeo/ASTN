import { useState } from 'react'
import { Linkedin, Loader2 } from 'lucide-react'
import { Button } from '~/components/ui/button'

interface LinkedInImportProps {
  onSubmit: (url: string) => void
  isLoading: boolean
  error?: string
  onCancel: () => void
}

const LINKEDIN_URL_PATTERN = /linkedin\.com\/in\//i

function isValidLinkedInUrl(url: string): boolean {
  return LINKEDIN_URL_PATTERN.test(url.trim())
}

export function LinkedInImport({
  onSubmit,
  isLoading,
  error,
  onCancel,
}: LinkedInImportProps) {
  const [url, setUrl] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmed = url.trim()
    if (!trimmed) {
      setValidationError('Please enter a LinkedIn URL')
      return
    }
    if (!isValidLinkedInUrl(trimmed)) {
      setValidationError(
        'Please enter a valid LinkedIn profile URL (e.g. linkedin.com/in/your-name)',
      )
      return
    }

    setValidationError(null)
    onSubmit(trimmed)
  }

  const displayError = validationError || error

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2]">
          <Linkedin className="size-5" />
        </div>
        <div>
          <h3 className="font-medium">Import from LinkedIn</h3>
          <p className="text-sm text-muted-foreground">
            Paste your LinkedIn profile URL to import your experience
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value)
              setValidationError(null)
            }}
            placeholder="https://linkedin.com/in/your-name"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading}
            autoFocus
          />
          {displayError && (
            <p className="mt-1.5 text-sm text-destructive">{displayError}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading || !url.trim()}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Importing profile...
              </>
            ) : (
              'Import Profile'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        </div>
      </form>

      <p className="text-xs text-muted-foreground">
        Your LinkedIn profile must be public for import to work.
      </p>
    </div>
  )
}
