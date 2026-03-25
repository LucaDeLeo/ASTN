<script lang="ts">
  import type { FormField } from '$convex/lib/formFields'
  import { cn } from '~/lib/utils'

  let {
    formFields,
    responses,
    onChange,
  }: {
    formFields: Array<FormField>
    responses: Record<string, unknown>
    onChange: (key: string, value: unknown) => void
  } = $props()

  const sections = $derived.by(() => {
    const values: Array<{
      title?: string
      description?: string
      fields: Array<FormField>
    }> = []

    let current: { title?: string; description?: string; fields: Array<FormField> } = {
      fields: [],
    }

    for (const field of formFields) {
      if (field.kind === 'section_header') {
        if (current.fields.length > 0 || current.title) {
          values.push(current)
        }
        current = {
          title: field.label,
          description: field.description,
          fields: [],
        }
      } else {
        current.fields.push(field)
      }
    }

    if (current.fields.length > 0 || current.title) {
      values.push(current)
    }

    return values
  })

  const selectedValues = (value: unknown) =>
    Array.isArray(value) ? (value as Array<string>) : []
</script>

<div class="space-y-6">
  {#each sections as section, sectionIndex (`section-${sectionIndex}`)}
    <section class="rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm">
      {#if section.title}
        <header class="mb-4">
          <h2 class="text-lg font-semibold text-slate-950">{section.title}</h2>
          {#if section.description}
            <p class="mt-1 text-sm text-slate-600">{section.description}</p>
          {/if}
        </header>
      {/if}

      <div class="space-y-4">
        {#each section.fields as field (field.key)}
          <div class="space-y-2">
            {#if field.kind !== 'checkbox'}
              <label class="block text-sm font-medium text-slate-800" for={field.key}>
                {field.label}
                {#if field.required}
                  <span class="text-rose-500"> *</span>
                {/if}
              </label>
            {/if}

            {#if field.description}
              <p class="text-xs text-slate-500">{field.description}</p>
            {/if}

            {#if field.kind === 'text' || field.kind === 'email' || field.kind === 'url'}
              <input
                id={field.key}
                type={field.kind}
                value={typeof responses[field.key] === 'string' ? String(responses[field.key]) : ''}
                class="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                placeholder={field.placeholder}
                oninput={(event) => onChange(field.key, (event.currentTarget as HTMLInputElement).value)}
              />
            {:else if field.kind === 'textarea'}
              <textarea
                id={field.key}
                rows={field.rows ?? 4}
                class="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                placeholder={field.placeholder}
                oninput={(event) => onChange(field.key, (event.currentTarget as HTMLTextAreaElement).value)}
              >{typeof responses[field.key] === 'string' ? String(responses[field.key]) : ''}</textarea>
            {:else if field.kind === 'select'}
              <select
                id={field.key}
                class="h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                value={typeof responses[field.key] === 'string' ? String(responses[field.key]) : ''}
                onchange={(event) => onChange(field.key, (event.currentTarget as HTMLSelectElement).value)}
              >
                <option value="">{field.placeholder ?? 'Select...'}</option>
                {#each field.options ?? [] as option}
                  <option value={option}>{option}</option>
                {/each}
              </select>
            {:else if field.kind === 'multi_select'}
              {@const current = selectedValues(responses[field.key])}
              <div class="flex flex-wrap gap-2">
                {#each field.options ?? [] as option}
                  {@const isSelected = current.includes(option)}
                  {@const isDisabled = !isSelected && current.length >= (field.maxSelections ?? Infinity)}
                  <button
                    type="button"
                    class={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      isSelected
                        ? 'border-coral-500 bg-coral-500 text-white'
                        : isDisabled
                          ? 'cursor-not-allowed border-slate-200 text-slate-400 opacity-50'
                          : 'border-slate-300 text-slate-600 hover:border-coral-300 hover:text-coral-700',
                    )}
                    disabled={isDisabled}
                    onclick={() => {
                      if (isSelected) {
                        onChange(
                          field.key,
                          current.filter((value) => value !== option),
                        )
                      } else {
                        onChange(field.key, [...current, option])
                      }
                    }}
                  >
                    {option}
                  </button>
                {/each}
              </div>
            {:else if field.kind === 'checkbox'}
              <label class="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input
                  id={field.key}
                  type="checkbox"
                  checked={responses[field.key] === true}
                  class="mt-0.5 size-4 accent-coral-500"
                  onchange={(event) => onChange(field.key, (event.currentTarget as HTMLInputElement).checked)}
                />
                <span>
                  {field.label}
                  {#if field.required}
                    <span class="text-rose-500"> *</span>
                  {/if}
                </span>
              </label>
            {:else if field.kind === 'radio'}
              <div class="flex flex-wrap gap-3">
                {#each field.options ?? ['Yes', 'No'] as option}
                  <label class="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name={field.key}
                      checked={responses[field.key] === option || (option === 'Yes' && responses[field.key] === true) || (option === 'No' && responses[field.key] === false)}
                      class="size-4 accent-coral-500"
                      onchange={() => {
                        if (option === 'Yes') onChange(field.key, true)
                        else if (option === 'No') onChange(field.key, false)
                        else onChange(field.key, option)
                      }}
                    />
                    <span>{option}</span>
                  </label>
                {/each}
              </div>
            {:else if field.kind === 'rating'}
              <div class="flex flex-wrap gap-2">
                {#each field.options?.length === 5 ? field.options : ['1', '2', '3', '4', '5'] as option, index}
                  {@const score = index + 1}
                  <button
                    type="button"
                    class={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition',
                      responses[field.key] === score
                        ? 'border-coral-500 bg-coral-500 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-coral-300 hover:text-coral-700',
                    )}
                    onclick={() => onChange(field.key, score)}
                  >
                    {option}
                  </button>
                {/each}
              </div>
            {:else if field.kind === 'nps'}
              <div class="space-y-2">
                <div class="grid grid-cols-11 gap-1">
                  {#each Array.from({ length: 11 }) as _, index}
                    <button
                      type="button"
                      class={cn(
                        'rounded-lg border py-2 text-sm font-medium transition',
                        responses[field.key] === index
                          ? index <= 6
                            ? 'border-red-500 bg-red-500 text-white'
                            : index <= 8
                              ? 'border-amber-400 bg-amber-400 text-slate-950'
                              : 'border-green-500 bg-green-500 text-white'
                          : 'border-slate-200 text-slate-600 hover:border-slate-400',
                      )}
                      onclick={() => onChange(field.key, index)}
                    >
                      {index}
                    </button>
                  {/each}
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                  <span>Not at all likely</span>
                  <span>Extremely likely</span>
                </div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/each}
</div>
