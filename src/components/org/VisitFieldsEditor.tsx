import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { Switch } from '~/components/ui/switch'
import { Card, CardContent } from '~/components/ui/card'

export interface VisitField {
  fieldId: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'checkbox'
  required: boolean
  options?: Array<string>
  placeholder?: string
}

interface VisitFieldsEditorProps {
  value: Array<VisitField>
  onChange: (fields: Array<VisitField>) => void
}

export function VisitFieldsEditor({ value, onChange }: VisitFieldsEditorProps) {
  const addField = () => {
    const newField: VisitField = {
      fieldId: crypto.randomUUID(),
      label: '',
      type: 'text',
      required: false,
    }
    onChange([...value, newField])
  }

  const updateField = (index: number, updates: Partial<VisitField>) => {
    const newFields = value.map((field, i) =>
      i === index ? { ...field, ...updates } : field,
    )
    onChange(newFields)
  }

  const removeField = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const moveField = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === value.length - 1)
    ) {
      return
    }

    const newFields = [...value]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const temp = newFields[targetIndex]
    newFields[targetIndex] = newFields[index]
    newFields[index] = temp

    onChange(newFields)
  }

  const addOption = (fieldIndex: number) => {
    const field = value[fieldIndex]
    const newOptions = [...(field.options || []), '']
    updateField(fieldIndex, { options: newOptions })
  }

  const updateOption = (
    fieldIndex: number,
    optionIndex: number,
    newValue: string,
  ) => {
    const field = value[fieldIndex]
    const newOptions = (field.options || []).map((opt, i) =>
      i === optionIndex ? newValue : opt,
    )
    updateField(fieldIndex, { options: newOptions })
  }

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const field = value[fieldIndex]
    const newOptions = (field.options || []).filter((_, i) => i !== optionIndex)
    updateField(fieldIndex, { options: newOptions })
  }

  return (
    <div className="space-y-4">
      {value.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <p className="text-sm mb-2">No custom fields yet</p>
          <p className="text-xs">
            Add fields to collect additional info from guest visitors
          </p>
        </div>
      )}

      {value.map((field, index) => (
        <Card key={field.fieldId}>
          <CardContent className="pt-4">
            <div className="flex gap-2 mb-4">
              {/* Move buttons */}
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => moveField(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => moveField(index, 'down')}
                  disabled={index === value.length - 1}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>

              {/* Field config */}
              <div className="flex-1 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Label */}
                  <div className="space-y-2">
                    <Label htmlFor={`label-${index}`}>Field Label</Label>
                    <Input
                      id={`label-${index}`}
                      value={field.label}
                      onChange={(e) =>
                        updateField(index, { label: e.target.value })
                      }
                      placeholder="e.g., What project are you working on?"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor={`type-${index}`}>Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(v: VisitField['type']) =>
                        updateField(index, {
                          type: v,
                          options: v === 'select' ? [''] : undefined,
                        })
                      }
                    >
                      <SelectTrigger id={`type-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Short Text</SelectItem>
                        <SelectItem value="textarea">Long Text</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Placeholder (for text/textarea) */}
                {(field.type === 'text' || field.type === 'textarea') && (
                  <div className="space-y-2">
                    <Label htmlFor={`placeholder-${index}`}>
                      Placeholder (optional)
                    </Label>
                    <Input
                      id={`placeholder-${index}`}
                      value={field.placeholder || ''}
                      onChange={(e) =>
                        updateField(index, { placeholder: e.target.value })
                      }
                      placeholder="Hint text shown in the field"
                    />
                  </div>
                )}

                {/* Options (for select) */}
                {field.type === 'select' && (
                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="space-y-2">
                      {(field.options || []).map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) =>
                              updateOption(index, optIndex, e.target.value)
                            }
                            placeholder={`Option ${optIndex + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(index, optIndex)}
                            disabled={(field.options?.length || 0) <= 1}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(index)}
                      >
                        <Plus className="size-4 mr-2" />
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                {/* Required toggle */}
                <div className="flex items-center gap-2">
                  <Switch
                    id={`required-${index}`}
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(index, { required: checked })
                    }
                  />
                  <Label htmlFor={`required-${index}`} className="text-sm">
                    Required field
                  </Label>
                </div>
              </div>

              {/* Delete button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeField(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addField}>
        <Plus className="size-4 mr-2" />
        Add Field
      </Button>
    </div>
  )
}
