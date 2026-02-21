import {
  ClipboardPaste,
  Linkedin,
  MessageSquare,
  PenLine,
  Upload,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { Card } from '~/components/ui/card'

type EntryPoint = 'linkedin' | 'upload' | 'paste' | 'manual' | 'chat'

interface EntryPointSelectorProps {
  onSelect: (entryPoint: EntryPoint) => void
  disabled?: boolean
  /** Slot rendered directly below the upload option (before other options) */
  uploadSlot?: React.ReactNode
}

interface EntryOption {
  id: EntryPoint
  icon: React.ComponentType<{ className?: string }>
  label: string
  description: string
  isPrimary?: boolean
}

const ENTRY_OPTIONS: Array<EntryOption> = [
  {
    id: 'linkedin',
    icon: Linkedin,
    label: 'Import from LinkedIn',
    description: 'Paste your LinkedIn URL to import your profile',
    isPrimary: true,
  },
  {
    id: 'upload',
    icon: Upload,
    label: 'Upload your resume',
    description: "We'll extract your info automatically",
  },
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'Chat with AI',
    description:
      'Have a conversation and watch your profile build in real-time',
  },
  {
    id: 'paste',
    icon: ClipboardPaste,
    label: 'Paste text',
    description: 'Paste your resume or CV text',
  },
  {
    id: 'manual',
    icon: PenLine,
    label: 'Fill out manually',
    description: 'Enter your information step by step',
  },
]

export function EntryPointSelector({
  onSelect,
  disabled = false,
  uploadSlot,
}: EntryPointSelectorProps) {
  // Split options: primary (linkedin) first, then others
  const primaryOption = ENTRY_OPTIONS.find((o) => o.isPrimary)!
  const otherOptions = ENTRY_OPTIONS.filter((o) => !o.isPrimary)

  const renderOptionCard = (option: EntryOption) => {
    const Icon = option.icon
    const isPrimary = option.isPrimary

    return (
      <Card
        onClick={() => !disabled && onSelect(option.id)}
        className={cn(
          'cursor-pointer transition-all py-4',
          disabled && 'opacity-50 cursor-not-allowed',
          isPrimary
            ? 'border-primary bg-primary/5 hover:bg-primary/10 hover:border-primary/80'
            : 'hover:bg-slate-50 hover:border-slate-300',
        )}
      >
        <div className="flex items-center gap-4 px-4">
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-lg',
              isPrimary
                ? 'bg-primary/10 text-primary'
                : 'bg-slate-100 text-slate-600',
            )}
          >
            <Icon className="size-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={cn(
                'font-medium',
                isPrimary ? 'text-primary' : 'text-foreground',
              )}
            >
              {option.label}
            </div>
            <div className="text-sm text-muted-foreground">
              {option.description}
            </div>
          </div>
          {isPrimary && (
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              Recommended
            </span>
          )}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* Primary option (LinkedIn) */}
      <div>{renderOptionCard(primaryOption)}</div>

      {/* Upload option with slot (drop zone) */}
      {otherOptions
        .filter((o) => o.id === 'upload')
        .map((option) => (
          <div key={option.id}>
            {renderOptionCard(option)}
            {uploadSlot && <div className="mt-3 mb-1">{uploadSlot}</div>}
          </div>
        ))}

      {/* Other options */}
      {otherOptions
        .filter((o) => o.id !== 'upload')
        .map((option) => (
          <div key={option.id}>{renderOptionCard(option)}</div>
        ))}
    </div>
  )
}
