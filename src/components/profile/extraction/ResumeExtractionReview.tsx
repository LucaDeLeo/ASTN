import { useMemo } from 'react'
import { Check, CheckCircle2, Loader2, X } from 'lucide-react'
import { useResumeReview } from './hooks/useResumeReview'
import { ExtractionFieldCard } from './ExtractionFieldCard'
import { ExpandableEntryCard } from './ExpandableEntryCard'
import type { ExtractedData } from './types'
import { SkillsInput } from '~/components/profile/skills/SkillsInput'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

type EducationEntry = NonNullable<ExtractedData['education']>[0]
type WorkHistoryEntry = NonNullable<ExtractedData['workHistory']>[0]

/**
 * Data to apply to profile after review
 */
export interface AppliedData {
  name?: string
  location?: string
  education?: Array<EducationEntry>
  workHistory?: Array<WorkHistoryEntry>
  skills?: Array<string>
}

interface ResumeExtractionReviewProps {
  extractedData: ExtractedData
  onApply: (data: AppliedData) => Promise<void>
  onSkip: () => void
  isApplying?: boolean
}

export function ResumeExtractionReview({
  extractedData,
  onApply,
  onSkip,
  isApplying = false,
}: ResumeExtractionReviewProps) {
  const {
    items,
    updateStatus,
    updateValue,
    getAcceptedData,
    acceptedCount,
    totalFields,
    hasAcceptedFields,
  } = useResumeReview(extractedData)

  // Group items by section
  const { basicFields, educationItems, workHistoryItems, skillsItem } =
    useMemo(() => {
      const basic = items.filter(
        (item) =>
          item.field === 'name' ||
          item.field === 'location' ||
          item.field === 'email',
      )
      const education = items.filter((item) => item.field === 'education')
      const work = items.filter((item) => item.field === 'workHistory')
      const skills = items.find((item) => item.field === 'skills')

      return {
        basicFields: basic,
        educationItems: education,
        workHistoryItems: work,
        skillsItem: skills,
      }
    }, [items])

  // Track if skills are edited separately (since SkillsInput manages its own state)
  const currentSkills = useMemo(() => {
    if (!skillsItem) return []
    return (skillsItem.editedValue ?? skillsItem.value) as Array<string>
  }, [skillsItem])

  const handleSkillsChange = (newSkills: Array<string>) => {
    if (skillsItem) {
      updateValue(skillsItem.id, newSkills)
    }
  }

  const handleApply = async () => {
    const data = getAcceptedData()
    await onApply(data)
  }

  // Calculate gaps (fields not found or rejected)
  const hasGaps =
    acceptedCount < totalFields ||
    !extractedData.name ||
    !extractedData.location ||
    (extractedData.education?.length ?? 0) === 0 ||
    (extractedData.workHistory?.length ?? 0) === 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-foreground">
          Review Extracted Information
        </h3>
        <p className="text-sm text-slate-500">
          All fields will be applied by default. Edit or reject any items you
          want to change.
        </p>
      </div>

      {/* Basic Info Section */}
      {basicFields.length > 0 && (
        <section className="space-y-3">
          <h4 className="font-medium text-slate-700">Basic Information</h4>
          <div className="space-y-3">
            {basicFields.map((item) => (
              <ExtractionFieldCard
                key={item.id}
                label={item.label}
                value={item.value as string | undefined}
                editedValue={item.editedValue as string | undefined}
                status={item.status}
                onAccept={() => updateStatus(item.id, 'accepted')}
                onReject={() => updateStatus(item.id, 'rejected')}
                onEdit={(value) => updateValue(item.id, value)}
                displayOnly={item.field === 'email'}
              />
            ))}
          </div>
        </section>
      )}

      {/* Education Section */}
      {educationItems.length > 0 && (
        <section className="space-y-3">
          <h4 className="font-medium text-slate-700">Education</h4>
          <div className="space-y-3">
            {educationItems.map((item) => (
              <ExpandableEntryCard
                key={item.id}
                type="education"
                entry={item.value as EducationEntry}
                editedEntry={item.editedValue as EducationEntry | undefined}
                status={item.status}
                onAccept={() => updateStatus(item.id, 'accepted')}
                onReject={() => updateStatus(item.id, 'rejected')}
                onEdit={(entry) => updateValue(item.id, entry)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Work History Section */}
      {workHistoryItems.length > 0 && (
        <section className="space-y-3">
          <h4 className="font-medium text-slate-700">Work History</h4>
          <div className="space-y-3">
            {workHistoryItems.map((item) => (
              <ExpandableEntryCard
                key={item.id}
                type="workHistory"
                entry={item.value as WorkHistoryEntry}
                editedEntry={item.editedValue as WorkHistoryEntry | undefined}
                status={item.status}
                onAccept={() => updateStatus(item.id, 'accepted')}
                onReject={() => updateStatus(item.id, 'rejected')}
                onEdit={(entry) => updateValue(item.id, entry)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Skills Section */}
      {(skillsItem ||
        (extractedData.rawSkills && extractedData.rawSkills.length > 0)) && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700">Skills</h4>
            {skillsItem && (
              <div className="flex items-center gap-2">
                {(skillsItem.status === 'edited' ||
                  skillsItem.status === 'rejected') && (
                  <Badge
                    variant={
                      skillsItem.status === 'rejected' ? 'secondary' : 'default'
                    }
                    className={cn(
                      'text-xs',
                      skillsItem.status === 'edited' &&
                        'bg-amber-100 text-amber-800 hover:bg-amber-100',
                    )}
                  >
                    {skillsItem.status === 'rejected' && 'Rejected'}
                    {skillsItem.status === 'edited' && 'Edited'}
                  </Badge>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => updateStatus(skillsItem.id, 'accepted')}
                    disabled={skillsItem.status === 'accepted'}
                    className={cn(
                      'text-slate-400 hover:text-green-600 hover:bg-green-50',
                      skillsItem.status === 'accepted' &&
                        'text-green-600 bg-green-100',
                    )}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => updateStatus(skillsItem.id, 'rejected')}
                    disabled={skillsItem.status === 'rejected'}
                    className={cn(
                      'text-slate-400 hover:text-red-600 hover:bg-red-50',
                      skillsItem.status === 'rejected' &&
                        'text-red-600 bg-red-100',
                    )}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {skillsItem && skillsItem.status !== 'rejected' && (
            <SkillsInput
              selectedSkills={currentSkills}
              onSkillsChange={handleSkillsChange}
            />
          )}

          {/* Raw skills reference */}
          {extractedData.rawSkills && extractedData.rawSkills.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Also mentioned: {extractedData.rawSkills.join(', ')}
            </p>
          )}
        </section>
      )}

      {/* Gap indicator footer */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-slate-500">
            {acceptedCount} of {totalFields} fields will be applied
          </p>
          {hasGaps && (
            <p className="text-xs text-muted-foreground">
              Enrichment chat can help fill in the remaining details
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onSkip}>
            Skip to Manual Entry
          </Button>
          <Button
            onClick={handleApply}
            disabled={!hasAcceptedFields || isApplying}
            className="gap-2"
          >
            {isApplying ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Applying...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Apply to Profile
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
