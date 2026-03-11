import { useState } from 'react'
import { useMutation } from 'convex/react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Doc, Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Card, CardContent } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Textarea } from '~/components/ui/textarea'

interface FieldDef {
  id: string
  type: 'text' | 'choice' | 'multiple_choice'
  label: string
  required: boolean
  placeholder: string
  options: Array<{ id: string; label: string }>
  maxLength: number | undefined
}

interface PromptFormProps {
  programId: Id<'programs'>
  attachedTo:
    | { type: 'module'; moduleId: Id<'programModules'> }
    | {
        type: 'session_phase'
        sessionId: Id<'programSessions'>
        phaseId: Id<'sessionPhases'>
      }
  orderIndex: number
  existingPrompt?: Doc<'coursePrompts'>
  onSuccess?: () => void
  onCancel?: () => void
}

let fieldCounter = 0

function newFieldId() {
  return `field_${Date.now()}_${fieldCounter++}`
}

export function PromptForm({
  programId,
  attachedTo,
  orderIndex,
  existingPrompt,
  onSuccess,
  onCancel,
}: PromptFormProps) {
  const createPrompt = useMutation(api.course.prompts.create)
  const updatePrompt = useMutation(api.course.prompts.update)

  const [title, setTitle] = useState(existingPrompt?.title ?? '')
  const [body, setBody] = useState(existingPrompt?.body ?? '')
  const [revealMode, setRevealMode] = useState<
    'immediate' | 'facilitator_only' | 'write_then_reveal'
  >(existingPrompt?.revealMode ?? 'immediate')
  const [fields, setFields] = useState<Array<FieldDef>>(() => {
    if (existingPrompt?.fields) {
      return existingPrompt.fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        placeholder: f.placeholder ?? '',
        options: f.options ?? [],
        maxLength: f.maxLength,
      }))
    }
    return []
  })
  const [isSaving, setIsSaving] = useState(false)

  const addField = () => {
    setFields((prev) => [
      ...prev,
      {
        id: newFieldId(),
        type: 'text',
        label: '',
        required: false,
        placeholder: '',
        options: [],
        maxLength: undefined,
      },
    ])
  }

  const removeField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index))
  }

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= fields.length) return
    setFields((prev) => {
      const arr = [...prev]
      ;[arr[index], arr[newIndex]] = [arr[newIndex], arr[index]]
      return arr
    })
  }

  const updateField = (index: number, updates: Partial<FieldDef>) => {
    setFields((prev) =>
      prev.map((f, i) => {
        if (i !== index) return f
        const updated = { ...f, ...updates }
        // If changing to choice type and no options, initialize with 2 empty ones
        if (
          updates.type &&
          (updates.type === 'choice' || updates.type === 'multiple_choice') &&
          updated.options.length === 0
        ) {
          updated.options = [
            { id: newFieldId(), label: '' },
            { id: newFieldId(), label: '' },
          ]
        }
        // If switching away from choice type, clear options
        if (updates.type && updates.type === 'text') {
          updated.options = []
        }
        return updated
      }),
    )
  }

  const addOption = (fieldIndex: number) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIndex
          ? { ...f, options: [...f.options, { id: newFieldId(), label: '' }] }
          : f,
      ),
    )
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIndex
          ? { ...f, options: f.options.filter((_, oi) => oi !== optionIndex) }
          : f,
      ),
    )
  }

  const updateOptionLabel = (
    fieldIndex: number,
    optionIndex: number,
    label: string,
  ) => {
    setFields((prev) =>
      prev.map((f, i) =>
        i === fieldIndex
          ? {
              ...f,
              options: f.options.map((o, oi) =>
                oi === optionIndex ? { ...o, label } : o,
              ),
            }
          : f,
      ),
    )
  }

  const handleSubmit = async () => {
    // Validate
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    if (fields.length === 0) {
      toast.error('Add at least one field')
      return
    }
    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error('All fields must have a label')
        return
      }
      if (
        (field.type === 'choice' || field.type === 'multiple_choice') &&
        field.options.length < 2
      ) {
        toast.error('Choice fields must have at least 2 options')
        return
      }
      if (
        (field.type === 'choice' || field.type === 'multiple_choice') &&
        field.options.some((o) => !o.label.trim())
      ) {
        toast.error('All options must have a label')
        return
      }
    }

    setIsSaving(true)
    try {
      const formattedFields = fields.map((f) => ({
        id: f.id,
        type: f.type,
        label: f.label,
        required: f.required,
        placeholder: f.placeholder || undefined,
        options:
          f.type === 'text'
            ? undefined
            : f.options.length > 0
              ? f.options
              : undefined,
        maxLength: f.type === 'text' && f.maxLength ? f.maxLength : undefined,
      }))

      if (existingPrompt) {
        await updatePrompt({
          promptId: existingPrompt._id,
          title,
          body: body || undefined,
          fields: formattedFields,
          revealMode,
        })
        toast.success('Prompt updated')
      } else {
        await createPrompt({
          programId,
          attachedTo,
          title,
          body: body || undefined,
          orderIndex,
          fields: formattedFields,
          revealMode,
        })
        toast.success('Prompt created')
      }
      onSuccess?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save prompt')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="prompt-title">Prompt Title</Label>
        <Input
          id="prompt-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Week 1 Reflection"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt-body">Instructions (Markdown)</Label>
        <Textarea
          id="prompt-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="You can use **bold**, _italic_, lists, and links..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Reveal Mode</Label>
        <Select
          value={revealMode}
          onValueChange={(v) => setRevealMode(v as typeof revealMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="immediate">
              Immediate — Responses visible to everyone right away
            </SelectItem>
            <SelectItem value="facilitator_only">
              Facilitator Only — Only you can see responses
            </SelectItem>
            <SelectItem value="write_then_reveal">
              Write Then Reveal — Hidden until you trigger reveal
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Questions</Label>
          <Button variant="outline" size="sm" onClick={addField}>
            <Plus className="mr-1 h-3 w-3" />
            Add Field
          </Button>
        </div>

        {fields.map((field, index) => (
          <Card key={field.id}>
            <CardContent className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-40">
                      <Select
                        value={field.type}
                        onValueChange={(v) =>
                          updateField(index, {
                            type: v as FieldDef['type'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="choice">Single Choice</SelectItem>
                          <SelectItem value="multiple_choice">
                            Multiple Choice
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Input
                        value={field.label}
                        onChange={(e) =>
                          updateField(index, { label: e.target.value })
                        }
                        placeholder="Question text"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`required-${field.id}`}
                        checked={field.required}
                        onCheckedChange={(checked) =>
                          updateField(index, { required: checked === true })
                        }
                      />
                      <Label
                        htmlFor={`required-${field.id}`}
                        className="text-sm font-normal"
                      >
                        Required
                      </Label>
                    </div>

                    {field.type === 'text' && (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-normal whitespace-nowrap">
                            Placeholder
                          </Label>
                          <Input
                            className="h-8 w-40"
                            value={field.placeholder}
                            onChange={(e) =>
                              updateField(index, {
                                placeholder: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-normal whitespace-nowrap">
                            Max length
                          </Label>
                          <Input
                            className="h-8 w-20"
                            type="number"
                            value={field.maxLength ?? ''}
                            onChange={(e) =>
                              updateField(index, {
                                maxLength: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Options for choice/multiple_choice */}
                  {(field.type === 'choice' ||
                    field.type === 'multiple_choice') && (
                    <div className="space-y-2 pl-4">
                      {field.options.map((option, optIndex) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-2"
                        >
                          <Input
                            className="h-8"
                            value={option.label}
                            onChange={(e) =>
                              updateOptionLabel(index, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index, optIndex)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addOption(index)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Option
                      </Button>
                    </div>
                  )}
                </div>

                {/* Field actions */}
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => moveField(index, -1)}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => moveField(index, 1)}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={isSaving}>
          {existingPrompt ? 'Update Prompt' : 'Create Prompt'}
        </Button>
      </div>
    </div>
  )
}
