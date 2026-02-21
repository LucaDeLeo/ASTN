import { v } from 'convex/values'

// --- Types ---

export type FormFieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'url'
  | 'select'
  | 'multi_select'
  | 'checkbox'
  | 'radio'
  | 'section_header'

export interface FormField {
  key: string
  kind: FormFieldKind
  label: string
  description?: string
  required?: boolean
  placeholder?: string
  options?: Array<string>
  maxSelections?: number
  rows?: number
}

// --- Convex Validators ---

export const formFieldValidator = v.object({
  key: v.string(),
  kind: v.union(
    v.literal('text'),
    v.literal('textarea'),
    v.literal('email'),
    v.literal('url'),
    v.literal('select'),
    v.literal('multi_select'),
    v.literal('checkbox'),
    v.literal('radio'),
    v.literal('section_header'),
  ),
  label: v.string(),
  description: v.optional(v.string()),
  required: v.optional(v.boolean()),
  placeholder: v.optional(v.string()),
  options: v.optional(v.array(v.string())),
  maxSelections: v.optional(v.number()),
  rows: v.optional(v.number()),
})

export const formFieldsValidator = v.array(formFieldValidator)

// --- Helpers ---

/** Return only fields that collect input (excludes section_header) */
export function getInputFields(fields: Array<FormField>): Array<FormField> {
  return fields.filter((f) => f.kind !== 'section_header')
}

/** Return fields marked as required */
export function getRequiredFields(fields: Array<FormField>): Array<FormField> {
  return getInputFields(fields).filter((f) => f.required)
}

/**
 * Validate responses against formFields.
 * Returns an array of error strings (empty = valid).
 */
export function validateResponses(
  fields: Array<FormField>,
  responses: Record<string, unknown>,
): Array<string> {
  const errors: Array<string> = []
  for (const field of getRequiredFields(fields)) {
    const val = responses[field.key]
    if (val === undefined || val === null || val === '') {
      errors.push(`${field.label} is required`)
    } else if (Array.isArray(val) && val.length === 0) {
      errors.push(`${field.label} is required`)
    }
  }
  return errors
}

/**
 * Convert a label string to a camelCase key.
 * "First name" -> "firstName", "How course helps" -> "howCourseHelps"
 */
export function labelToKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('')
}
