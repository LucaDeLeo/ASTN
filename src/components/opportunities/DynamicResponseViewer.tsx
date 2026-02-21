import type { FormField } from '../../../convex/lib/formFields'

interface DynamicResponseViewerProps {
  formFields: Array<FormField>
  responses: Record<string, unknown>
}

export function DynamicResponseViewer({
  formFields,
  responses,
}: DynamicResponseViewerProps) {
  // Group fields into sections by section_header
  const sections: Array<{ title?: string; fields: Array<FormField> }> = []
  let current: { title?: string; fields: Array<FormField> } = { fields: [] }

  for (const field of formFields) {
    if (field.kind === 'section_header') {
      if (current.fields.length > 0 || current.title) {
        sections.push(current)
      }
      current = { title: field.label, fields: [] }
    } else {
      current.fields.push(field)
    }
  }
  if (current.fields.length > 0 || current.title) {
    sections.push(current)
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {section.title && (
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {section.title}
            </h4>
          )}
          <div className="space-y-2">
            {section.fields
              .map((field) => ({
                field,
                display: formatValue(field, responses[field.key]),
              }))
              .filter(({ display }) => display !== null)
              .map(({ field, display }) => (
                <div key={field.key}>
                  <span className="text-xs text-muted-foreground">
                    {field.label}
                  </span>
                  <p className="text-sm whitespace-pre-wrap">{display}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function formatValue(_field: FormField, value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null

  if (Array.isArray(value)) {
    const joined = value.join(', ')
    return joined || null
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  const str = String(value)
  return str || null
}
