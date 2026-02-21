import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react'
import { labelToKey } from '../../../convex/lib/formFields'
import type { FormField, FormFieldKind } from '../../../convex/lib/formFields'
import { Card, CardContent } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'

interface FormFieldsEditorProps {
  fields: Array<FormField>
  onChange: (fields: Array<FormField>) => void
}

const KIND_LABELS: Record<FormFieldKind, string> = {
  text: 'Text',
  textarea: 'Long Text',
  email: 'Email',
  url: 'URL',
  select: 'Dropdown',
  multi_select: 'Multi Select',
  checkbox: 'Checkbox',
  radio: 'Yes/No Radio',
  section_header: 'Section Header',
}

const KIND_COLORS: Record<FormFieldKind, string> = {
  text: 'bg-blue-50 text-blue-700',
  textarea: 'bg-blue-50 text-blue-700',
  email: 'bg-cyan-50 text-cyan-700',
  url: 'bg-cyan-50 text-cyan-700',
  select: 'bg-amber-50 text-amber-700',
  multi_select: 'bg-amber-50 text-amber-700',
  checkbox: 'bg-green-50 text-green-700',
  radio: 'bg-green-50 text-green-700',
  section_header: 'bg-slate-100 text-slate-700',
}

export function FormFieldsEditor({ fields, onChange }: FormFieldsEditorProps) {
  const [isAdding, setIsAdding] = useState(false)

  const moveField = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= fields.length) return
    const updated = [...fields]
    ;[updated[index], updated[newIndex]] = [updated[newIndex], updated[index]]
    onChange(updated)
  }

  const removeField = (index: number) => {
    onChange(fields.filter((_, i) => i !== index))
  }

  const addField = (field: FormField) => {
    onChange([...fields, field])
    setIsAdding(false)
  }

  return (
    <div className="space-y-3">
      {fields.length === 0 && !isAdding && (
        <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-muted-foreground">
          No form fields yet. Add fields to build your application form.
        </div>
      )}

      {fields.map((field, idx) => (
        <div
          key={`${field.key}-${idx}`}
          className="flex items-center gap-2 group"
        >
          <div className="flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => moveField(idx, -1)}
              disabled={idx === 0}
              className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowUp className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => moveField(idx, 1)}
              disabled={idx === fields.length - 1}
              className="p-0.5 rounded hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowDown className="size-3" />
            </button>
          </div>

          <div className="flex-1 flex items-center gap-2 rounded-lg border px-3 py-2 bg-white">
            <Badge variant="outline" className={KIND_COLORS[field.kind]}>
              {KIND_LABELS[field.kind]}
            </Badge>
            <span className="text-sm font-medium truncate flex-1">
              {field.label}
            </span>
            {field.required && (
              <span className="text-xs text-red-500 font-medium">Required</span>
            )}
            <span className="text-xs text-muted-foreground font-mono">
              {field.key}
            </span>
          </div>

          <button
            type="button"
            onClick={() => removeField(idx)}
            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}

      {isAdding ? (
        <AddFieldForm onAdd={addField} onCancel={() => setIsAdding(false)} />
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="size-4 mr-1" />
          Add field
        </Button>
      )}
    </div>
  )
}

function AddFieldForm({
  onAdd,
  onCancel,
}: {
  onAdd: (field: FormField) => void
  onCancel: () => void
}) {
  const [kind, setKind] = useState<FormFieldKind>('text')
  const [label, setLabel] = useState('')
  const [description, setDescription] = useState('')
  const [required, setRequired] = useState(false)
  const [placeholder, setPlaceholder] = useState('')
  const [optionsText, setOptionsText] = useState('')
  const [maxSelections, setMaxSelections] = useState('')
  const [rows, setRows] = useState('')
  const [customKey, setCustomKey] = useState('')

  const needsOptions = ['select', 'multi_select', 'radio'].includes(kind)
  const isTextarea = kind === 'textarea'
  const isMultiSelect = kind === 'multi_select'
  const isSectionHeader = kind === 'section_header'

  const key = customKey || labelToKey(label)
  const canAdd = label.trim() && key

  const handleAdd = () => {
    if (!canAdd) return
    const field: FormField = {
      key,
      kind,
      label: label.trim(),
    }
    if (description.trim()) field.description = description.trim()
    if (required && !isSectionHeader) field.required = true
    if (placeholder.trim()) field.placeholder = placeholder.trim()
    if (needsOptions && optionsText.trim()) {
      field.options = optionsText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
    }
    if (isMultiSelect && maxSelections) {
      field.maxSelections = Number(maxSelections)
    }
    if (isTextarea && rows) {
      field.rows = Number(rows)
    }
    onAdd(field)
  }

  return (
    <Card>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Add New Field</span>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded hover:bg-slate-100"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs">Field type</Label>
            <Select
              value={kind}
              onValueChange={(v) => setKind(v as FormFieldKind)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(KIND_LABELS) as Array<[FormFieldKind, string]>
                ).map(([k, l]) => (
                  <SelectItem key={k} value={k}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Label</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. First name"
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">
            Key{' '}
            <span className="text-muted-foreground font-normal">
              (auto from label)
            </span>
          </Label>
          <Input
            value={customKey || key}
            onChange={(e) => setCustomKey(e.target.value)}
            placeholder={key || 'fieldKey'}
            className="font-mono text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Description (optional)</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Help text shown below the label"
          />
        </div>

        {!isSectionHeader && (
          <div className="space-y-1">
            <Label className="text-xs">Placeholder (optional)</Label>
            <Input
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
            />
          </div>
        )}

        {needsOptions && (
          <div className="space-y-1">
            <Label className="text-xs">Options (one per line)</Label>
            <Textarea
              value={optionsText}
              onChange={(e) => setOptionsText(e.target.value)}
              rows={4}
              placeholder={'Option 1\nOption 2\nOption 3'}
            />
          </div>
        )}

        {isMultiSelect && (
          <div className="space-y-1">
            <Label className="text-xs">Max selections (optional)</Label>
            <Input
              type="number"
              value={maxSelections}
              onChange={(e) => setMaxSelections(e.target.value)}
              placeholder="Unlimited"
              min={1}
            />
          </div>
        )}

        {isTextarea && (
          <div className="space-y-1">
            <Label className="text-xs">Rows (optional)</Label>
            <Input
              type="number"
              value={rows}
              onChange={(e) => setRows(e.target.value)}
              placeholder="4"
              min={1}
              max={20}
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {!isSectionHeader && (
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={required}
                onCheckedChange={(checked) => setRequired(checked === true)}
              />
              <span className="text-sm">Required</span>
            </label>
          )}
          {isSectionHeader && <div />}

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleAdd}
              disabled={!canAdd}
            >
              Add Field
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
