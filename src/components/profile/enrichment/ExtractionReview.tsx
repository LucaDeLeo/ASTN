import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  X,
} from 'lucide-react'
import type {
  ExtractionFields,
  ExtractionItem,
  ExtractionStatus,
} from './hooks/useEnrichment'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Textarea } from '~/components/ui/textarea'
import { Card } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { cn } from '~/lib/utils'

interface ExtractionReviewProps {
  extractions: Array<ExtractionItem>
  onUpdateStatus: (
    field: keyof ExtractionFields,
    status: ExtractionStatus,
  ) => void
  onUpdateValue: (
    field: keyof ExtractionFields,
    value: string | Array<string>,
  ) => void
  onApply: () => void
  onBack: () => void
  isApplying: boolean
}

function TagEditor({
  tags,
  onUpdate,
  disabled,
}: {
  tags: Array<string>
  onUpdate: (tags: Array<string>) => void
  disabled?: boolean
}) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onUpdate([...tags, trimmed])
    }
    setInputValue('')
  }

  const removeTag = (index: number) => {
    onUpdate(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag, i) => (
        <span
          key={i}
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
            disabled
              ? 'bg-slate-200 text-slate-500'
              : 'bg-slate-100 text-slate-700',
          )}
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <div className="inline-flex items-center gap-1">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputValue.trim()) addTag(inputValue)
            }}
            placeholder="Add..."
            className="h-6 w-24 text-xs px-2 py-0 border-dashed"
          />
          {inputValue.trim() && (
            <button
              type="button"
              onClick={() => addTag(inputValue)}
              className="text-slate-400 hover:text-green-600 transition-colors"
            >
              <Plus className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function ExtractionReview({
  extractions,
  onUpdateStatus,
  onUpdateValue,
  onApply,
  onBack,
  isApplying,
}: ExtractionReviewProps) {
  const isArrayField = (item: ExtractionItem) => Array.isArray(item.value)

  const handleTagUpdate = (item: ExtractionItem, newTags: Array<string>) => {
    onUpdateValue(item.field, newTags)
  }

  const acceptedCount = extractions.filter(
    (e) => e.status === 'accepted' || e.status === 'edited',
  ).length

  const hasAcceptedFields = acceptedCount > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h3 className="text-lg font-medium text-foreground">
            Here's what I picked up
          </h3>
          <p className="text-sm text-slate-500">
            Everything looks right by default — just edit or remove anything
            that's off.
          </p>
        </div>
      </div>

      {/* Extraction cards */}
      <div className="space-y-4">
        {extractions.map((item) => (
          <Card
            key={item.field}
            className={cn(
              'p-4 transition-all duration-200',
              item.status === 'accepted' && 'border-green-300 bg-green-50/50',
              item.status === 'edited' && 'border-amber-300 bg-amber-50/50',
              item.status === 'rejected' &&
                'border-slate-200 bg-slate-50 opacity-60',
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-foreground">{item.label}</h4>
                  {item.status !== 'pending' && (
                    <Badge
                      variant={
                        item.status === 'rejected' ? 'secondary' : 'default'
                      }
                      className={cn(
                        'text-xs',
                        item.status === 'accepted' &&
                          'bg-green-100 text-green-800 hover:bg-green-100',
                        item.status === 'edited' &&
                          'bg-amber-100 text-amber-800 hover:bg-amber-100',
                      )}
                    >
                      {item.status === 'accepted' && (
                        <>
                          <Check className="size-3 mr-1" /> Accepted
                        </>
                      )}
                      {item.status === 'rejected' && 'Rejected'}
                      {item.status === 'edited' && (
                        <>
                          <Pencil className="size-3 mr-1" /> Edited
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                {isArrayField(item) ? (
                  <TagEditor
                    tags={(item.editedValue ?? item.value) as Array<string>}
                    onUpdate={(newTags) => handleTagUpdate(item, newTags)}
                    disabled={item.status === 'rejected'}
                  />
                ) : (
                  <Textarea
                    value={(item.editedValue ?? item.value) as string}
                    onChange={(e) => onUpdateValue(item.field, e.target.value)}
                    disabled={item.status === 'rejected'}
                    className={cn(
                      'w-full text-sm resize-none',
                      item.status === 'rejected' && 'line-through opacity-50',
                    )}
                    rows={3}
                  />
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1">
                {item.status === 'rejected' ? (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUpdateStatus(item.field, 'accepted')}
                    className="text-slate-400 hover:text-green-600 hover:bg-green-50"
                    title="Restore"
                  >
                    <Check className="size-4" />
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onUpdateStatus(item.field, 'rejected')}
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Reject"
                    >
                      <X className="size-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Apply button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-slate-500">
          {acceptedCount} of {extractions.length} sections will be saved
        </p>
        <Button
          onClick={onApply}
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
              Save to Profile
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
