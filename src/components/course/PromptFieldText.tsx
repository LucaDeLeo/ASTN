import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

interface PromptField {
  id: string
  type: 'text' | 'choice' | 'multiple_choice'
  label: string
  required: boolean
  placeholder?: string
  maxLength?: number
}

interface PromptFieldTextProps {
  field: PromptField
  value: string
  onChange: (value: string) => void
  disabled: boolean
}

export function PromptFieldText({
  field,
  value,
  onChange,
  disabled,
}: PromptFieldTextProps) {
  const useTextarea = field.maxLength && field.maxLength > 200

  return (
    <div className="space-y-2">
      <Label htmlFor={field.id}>
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {useTextarea ? (
        <div className="space-y-1">
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            maxLength={field.maxLength}
            disabled={disabled}
            rows={4}
          />
          <p className="text-muted-foreground text-xs text-right">
            {value.length}/{field.maxLength}
          </p>
        </div>
      ) : (
        <Input
          id={field.id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          disabled={disabled}
        />
      )}
    </div>
  )
}
