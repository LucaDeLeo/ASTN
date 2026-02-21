import { useState } from 'react'
import {
  Bookmark,
  CheckCircle2,
  ChevronDown,
  FlaskConical,
  GraduationCap,
  HandHeart,
  PenLine,
  Play,
  Rocket,
  Search,
  Sparkles,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import type { Id } from '../../../convex/_generated/dataModel'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { cn } from '~/lib/utils'

const typeConfig = {
  replicate: { label: 'Replicate Research', icon: FlaskConical },
  collaborate: { label: 'Find Collaborators', icon: Users },
  start_org: { label: 'Start Initiative', icon: Rocket },
  identify_gaps: { label: 'Identify Gaps', icon: Search },
  volunteer: { label: 'Volunteer', icon: HandHeart },
  build_tools: { label: 'Build Tools', icon: Wrench },
  teach_write: { label: 'Teach or Write', icon: PenLine },
  develop_skills: { label: 'Develop Skills', icon: GraduationCap },
}

interface ActionCardProps {
  action: {
    _id: Id<'careerActions'>
    type: keyof typeof typeConfig
    title: string
    description: string
    rationale: string
    status: 'active' | 'saved' | 'dismissed' | 'in_progress' | 'done'
    completedAt?: number
    completionConversationStarted?: boolean
  }
  onSave?: () => void
  onDismiss?: () => void
  onStart?: () => void
  onComplete?: () => void
  onUnsave?: () => void
  onCancel?: () => void
}

export function ActionCard({
  action,
  onSave,
  onDismiss,
  onStart,
  onComplete,
  onUnsave,
  onCancel,
}: ActionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const config = typeConfig[action.type]
  const TypeIcon = config.icon

  return (
    <Card
      className={cn(
        'group/card relative p-4 border-violet-200 transition-shadow hover:shadow-md cursor-pointer',
        action.status === 'done' && 'opacity-75',
      )}
      onClick={() => setIsExpanded((prev) => !prev)}
    >
      {/* Desktop hover actions */}
      <HoverActions
        status={action.status}
        onSave={onSave}
        onDismiss={onDismiss}
      />

      {/* Badge + chevron */}
      <div className="flex items-center justify-between mb-1">
        <Badge className="bg-violet-100 text-violet-800 border-violet-200">
          <TypeIcon className="size-3" />
          {config.label}
        </Badge>
        <ChevronDown
          className={cn(
            'size-4 text-muted-foreground transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </div>

      {/* Title + clamped description */}
      <h3 className="font-medium text-foreground">{action.title}</h3>
      <p
        className={cn(
          'text-sm text-muted-foreground mt-1',
          !isExpanded && 'line-clamp-2',
        )}
      >
        {action.description}
      </p>

      {/* Expandable rationale */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-200 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p className="text-xs text-muted-foreground mt-2">
            <span>Based on: </span>
            <span className="text-violet-700">{action.rationale}</span>
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        <StatusButtons
          status={action.status}
          completedAt={action.completedAt}
          completionConversationStarted={action.completionConversationStarted}
          onStart={onStart}
          onComplete={onComplete}
          onUnsave={onUnsave}
          onCancel={onCancel}
        />
      </div>
    </Card>
  )
}

function HoverActions({
  status,
  onSave,
  onDismiss,
}: {
  status: string
  onSave?: () => void
  onDismiss?: () => void
}) {
  // Only show hover actions for active or saved status
  if (status !== 'active' && status !== 'saved') return null

  const showSave = status === 'active' && onSave
  const showDismiss = onDismiss

  if (!showSave && !showDismiss) return null

  return (
    <div className="absolute top-2 right-2 hidden items-center gap-1 group-hover/card:flex">
      {showSave && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSave()
          }}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-violet-100 hover:text-violet-700 transition-colors"
          title="Save action"
        >
          <Bookmark className="size-4" />
        </button>
      )}
      {showDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDismiss()
          }}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-red-100 hover:text-red-700 transition-colors"
          title="Dismiss action"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

function StatusButtons({
  status,
  completedAt,
  completionConversationStarted,
  onStart,
  onComplete,
  onUnsave,
  onCancel,
}: {
  status: string
  completedAt?: number
  completionConversationStarted?: boolean
  onStart?: () => void
  onComplete?: () => void
  onUnsave?: () => void
  onCancel?: () => void
}) {
  switch (status) {
    case 'active':
      return (
        <div className="flex items-center gap-2">
          {onStart && (
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={onStart}
            >
              <Play className="size-3" />
              Start
            </Button>
          )}
        </div>
      )

    case 'saved':
      return (
        <div className="flex items-center gap-2">
          {onStart && (
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={onStart}
            >
              <Play className="size-3" />
              Start
            </Button>
          )}
          {onUnsave && (
            <Button variant="ghost" size="sm" onClick={onUnsave}>
              Unsave
            </Button>
          )}
        </div>
      )

    case 'in_progress':
      return (
        <div className="flex items-center gap-2">
          {onComplete && (
            <Button
              size="sm"
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={onComplete}
            >
              <CheckCircle2 className="size-3" />
              Mark Done
            </Button>
          )}
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      )

    case 'done':
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-violet-600" />
          <span>Completed</span>
          {completedAt && (
            <span className="text-xs">
              {new Date(completedAt).toLocaleDateString()}
            </span>
          )}
          {completionConversationStarted && (
            <Badge className="ml-auto bg-violet-100 text-violet-700 border-violet-200 text-xs">
              <Sparkles className="size-3" />
              Enriched
            </Badge>
          )}
        </div>
      )

    default:
      return null
  }
}
