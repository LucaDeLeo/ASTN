<script lang="ts">
  import type { FormField } from '$convex/lib/formFields'

  let {
    formFields,
    responses,
  }: {
    formFields: Array<FormField>
    responses: Record<string, unknown>
  } = $props()

  const sections = $derived.by(() => {
    const grouped: Array<{ title?: string; fields: Array<FormField> }> = []
    let current: { title?: string; fields: Array<FormField> } = { fields: [] }

    for (const field of formFields) {
      if (field.kind === 'section_header') {
        if (current.fields.length > 0 || current.title) {
          grouped.push(current)
        }
        current = { title: field.label, fields: [] }
        continue
      }

      current.fields.push(field)
    }

    if (current.fields.length > 0 || current.title) {
      grouped.push(current)
    }

    return grouped
  })

  const formatValue = (value: unknown): string | null => {
    if (value === undefined || value === null || value === '') return null

    if (Array.isArray(value)) {
      const joined = value.join(', ')
      return joined || null
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2)
    }

    const stringified = String(value)
    return stringified || null
  }
</script>

<div class="space-y-6">
  {#each sections as section, sectionIndex (`section-${sectionIndex}`)}
    <section class="space-y-3">
      {#if section.title}
        <h4 class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          {section.title}
        </h4>
      {/if}

      <div class="space-y-3">
        {#each section.fields as field (field.key)}
          {@const display = formatValue(responses[field.key])}
          {#if display !== null}
            <div class="space-y-1 rounded-xl border border-border/60 bg-slate-50/70 px-4 py-3">
              <div class="text-xs font-medium text-slate-500">{field.label}</div>
              <div class="whitespace-pre-wrap text-sm text-slate-800">{display}</div>
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/each}
</div>
