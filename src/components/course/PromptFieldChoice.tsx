import { Label } from '~/components/ui/label'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'

interface PromptField {
  id: string
  type: 'text' | 'choice' | 'multiple_choice'
  label: string
  required: boolean
  options?: Array<{ id: string; label: string }>
}

interface PromptFieldChoiceProps {
  field: PromptField
  value: string | undefined
  onChange: (optionId: string) => void
  disabled: boolean
}

export function PromptFieldChoice({
  field,
  value,
  onChange,
  disabled,
}: PromptFieldChoiceProps) {
  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <RadioGroup
        value={value ?? ''}
        onValueChange={onChange}
        disabled={disabled}
        className="space-y-2"
      >
        {field.options?.map((option) => (
          <div key={option.id} className="flex items-center space-x-2">
            <RadioGroupItem value={option.id} id={`${field.id}-${option.id}`} />
            <Label
              htmlFor={`${field.id}-${option.id}`}
              className="font-normal cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  )
}
