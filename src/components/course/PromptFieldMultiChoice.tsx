import { Checkbox } from '~/components/ui/checkbox'
import { Label } from '~/components/ui/label'

interface PromptField {
  id: string
  type: 'text' | 'choice' | 'multiple_choice'
  label: string
  required: boolean
  options?: Array<{ id: string; label: string }>
}

interface PromptFieldMultiChoiceProps {
  field: PromptField
  value: Array<string>
  onChange: (optionIds: Array<string>) => void
  disabled: boolean
}

export function PromptFieldMultiChoice({
  field,
  value,
  onChange,
  disabled,
}: PromptFieldMultiChoiceProps) {
  const handleToggle = (optionId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionId])
    } else {
      onChange(value.filter((id) => id !== optionId))
    }
  }

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <div className="space-y-2">
        {field.options?.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <Checkbox
              id={`${field.id}-${option.id}`}
              checked={value.includes(option.id)}
              onCheckedChange={(checked) =>
                handleToggle(option.id, checked === true)
              }
              disabled={disabled}
            />
            <Label
              htmlFor={`${field.id}-${option.id}`}
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
