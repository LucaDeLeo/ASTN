<script lang="ts">
  import { Check, ChevronDown, Pencil, X } from 'lucide-svelte'
  import type { ExtractedData, ResumeReviewStatus } from './types'
  import { cn } from '~/lib/utils'

  type EducationEntry = NonNullable<ExtractedData['education']>[0]
  type WorkHistoryEntry = NonNullable<ExtractedData['workHistory']>[0]

  function formatWorkDateRange(entry: WorkHistoryEntry): string {
    const parts: Array<string> = []
    if (entry.startDate) parts.push(entry.startDate)
    if (entry.current) {
      parts.push('Present')
    } else if (entry.endDate) {
      parts.push(entry.endDate)
    }
    return parts.length > 0 ? `(${parts.join(' - ')})` : ''
  }

  function formatEducationDateRange(entry: EducationEntry): string {
    const parts: Array<string> = []
    if (entry.startYear) parts.push(String(entry.startYear))
    if (entry.current) {
      parts.push('Present')
    } else if (entry.endYear) {
      parts.push(String(entry.endYear))
    }
    return parts.length > 0 ? `(${parts.join(' - ')})` : ''
  }

  function formatWorkTitle(entry: WorkHistoryEntry): string {
    return `${entry.title} at ${entry.organization}`
  }

  function formatEducationTitle(entry: EducationEntry): string {
    const parts: Array<string> = []
    if (entry.degree) parts.push(entry.degree)
    if (entry.field) parts.push(`in ${entry.field}`)
    parts.push(`at ${entry.institution}`)
    return parts.join(' ')
  }

  function autosize(node: HTMLTextAreaElement) {
    const resize = () => {
      node.style.height = 'auto'
      node.style.height = `${node.scrollHeight}px`
    }

    resize()
    node.addEventListener('input', resize)

    return {
      update: resize,
      destroy() {
        node.removeEventListener('input', resize)
      },
    }
  }

  let {
    type,
    entry,
    editedEntry,
    status,
    onAccept,
    onReject,
    onEdit,
  }: {
    type: 'education' | 'workHistory'
    entry: EducationEntry | WorkHistoryEntry
    editedEntry?: EducationEntry | WorkHistoryEntry
    status: ResumeReviewStatus
    onAccept: () => void
    onReject: () => void
    onEdit: (entry: EducationEntry | WorkHistoryEntry) => void
  } = $props()

  let isExpanded = $state(true)
  let localEntry = $state<EducationEntry | WorkHistoryEntry>(
    {} as EducationEntry | WorkHistoryEntry,
  )

  const isEducation = $derived(type === 'education')
  const title = $derived(
    isEducation
      ? formatEducationTitle(localEntry as EducationEntry)
      : formatWorkTitle(localEntry as WorkHistoryEntry),
  )
  const dateRange = $derived(
    isEducation
      ? formatEducationDateRange(localEntry as EducationEntry)
      : formatWorkDateRange(localEntry as WorkHistoryEntry),
  )

  $effect(() => {
    localEntry = { ...(editedEntry ?? entry) }
  })

  const handleFieldChange = (
    field: string,
    value: string | number | boolean | undefined,
  ) => {
    const updated = { ...localEntry, [field]: value }
    localEntry = updated
    onEdit(updated)
  }
</script>

<article
  class={cn(
    'overflow-hidden rounded-lg shadow-sm transition-all duration-200',
    status === 'accepted' && 'border border-slate-300 bg-white',
    status === 'edited' && 'border border-amber-400 bg-amber-50',
    status === 'rejected' && 'border border-slate-300 bg-slate-100 opacity-60',
    status === 'pending' && 'border border-slate-300 bg-white',
  )}
>
  <div class="flex items-center justify-between gap-3 px-3 py-1.5">
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <h4
          class={cn(
            'truncate font-medium',
            status === 'rejected'
              ? 'text-slate-400 line-through'
              : 'text-foreground',
          )}
        >
          {title}
        </h4>
        {#if status === 'edited' || status === 'rejected'}
          <span
            class={cn(
              'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs',
              status === 'rejected'
                ? 'bg-secondary text-secondary-foreground'
                : 'bg-amber-100 text-amber-800',
            )}
          >
            {#if status === 'edited'}
              <Pencil class="mr-1 size-3" />
              Edited
            {:else}
              Rejected
            {/if}
          </span>
        {/if}
      </div>

      {#if dateRange}
        <span
          class={cn(
            'text-sm',
            status === 'rejected' ? 'text-slate-400' : 'text-slate-500',
          )}
        >
          {dateRange}
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-1">
      <div
        role="button"
        tabindex="0"
        class={cn(
          'inline-flex size-8 items-center justify-center rounded-md transition-colors',
          'text-slate-400 hover:bg-green-50 hover:text-green-600',
          status === 'accepted' && 'bg-green-100 text-green-600',
        )}
        aria-disabled={status === 'accepted'}
        onclick={(event) => {
          if (status === 'accepted') return
          event.stopPropagation()
          onAccept()
        }}
        onkeydown={(event) => {
          if (status === 'accepted') return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            onAccept()
          }
        }}
      >
        <Check class="size-4" />
      </div>
      <div
        role="button"
        tabindex="0"
        class={cn(
          'inline-flex size-8 items-center justify-center rounded-md transition-colors',
          'text-slate-400 hover:bg-red-50 hover:text-red-600',
          status === 'rejected' && 'bg-red-100 text-red-600',
        )}
        aria-disabled={status === 'rejected'}
        onclick={(event) => {
          if (status === 'rejected') return
          event.stopPropagation()
          onReject()
        }}
        onkeydown={(event) => {
          if (status === 'rejected') return
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            onReject()
          }
        }}
      >
        <X class="size-4" />
      </div>
      <button
        type="button"
        class="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100"
        onclick={() => {
          isExpanded = !isExpanded
        }}
      >
        <ChevronDown
          class={cn(
            'size-5 transition-transform duration-200',
            isExpanded && 'rotate-180',
          )}
        />
      </button>
    </div>
  </div>

  <div
    class={cn(
      'grid transition-all duration-200 ease-in-out',
      isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
    )}
  >
    <div class="overflow-hidden">
      <div class="space-y-1.5 border-t border-slate-100 px-3 pb-2 pt-1.5">
        {#if isEducation}
          {@const education = localEntry as EducationEntry}
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                Institution
              </span>
              <input
                value={education.institution}
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
                oninput={(event) =>
                  handleFieldChange(
                    'institution',
                    (event.currentTarget as HTMLInputElement).value,
                  )}
              />
            </div>
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                Degree
              </span>
              <input
                value={education.degree ?? ''}
                placeholder="e.g., PhD, MSc, BSc"
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
                oninput={(event) =>
                  handleFieldChange(
                    'degree',
                    (event.currentTarget as HTMLInputElement).value,
                  )}
              />
            </div>
          </div>

          <div>
            <span class="mb-1 block text-xs font-medium text-slate-500">
              Field of Study
            </span>
            <input
              value={education.field ?? ''}
              placeholder="e.g., Computer Science, AI Safety"
              class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
              oninput={(event) =>
                handleFieldChange(
                  'field',
                  (event.currentTarget as HTMLInputElement).value,
                )}
            />
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                Start Year
              </span>
              <input
                type="number"
                value={education.startYear ?? ''}
                placeholder="YYYY"
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
                oninput={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value
                  handleFieldChange(
                    'startYear',
                    value ? Number.parseInt(value, 10) : undefined,
                  )
                }}
              />
            </div>
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                End Year
              </span>
              <input
                type="number"
                value={education.endYear ?? ''}
                placeholder="YYYY"
                disabled={education.current}
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500 disabled:cursor-not-allowed disabled:opacity-50"
                oninput={(event) => {
                  const value = (event.currentTarget as HTMLInputElement).value
                  handleFieldChange(
                    'endYear',
                    value ? Number.parseInt(value, 10) : undefined,
                  )
                }}
              />
            </div>
            <div class="flex items-end pb-1">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={education.current ?? false}
                  class="rounded border-slate-300"
                  onchange={(event) =>
                    handleFieldChange(
                      'current',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Current
              </label>
            </div>
          </div>
        {:else}
          {@const work = localEntry as WorkHistoryEntry}
          <div class="grid grid-cols-2 gap-2">
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                Organization
              </span>
              <input
                value={work.organization}
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
                oninput={(event) =>
                  handleFieldChange(
                    'organization',
                    (event.currentTarget as HTMLInputElement).value,
                  )}
              />
            </div>
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                Title
              </span>
              <input
                value={work.title}
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
                oninput={(event) =>
                  handleFieldChange(
                    'title',
                    (event.currentTarget as HTMLInputElement).value,
                  )}
              />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2">
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                Start Date
              </span>
              <input
                type="month"
                value={work.startDate ?? ''}
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500"
                oninput={(event) =>
                  handleFieldChange(
                    'startDate',
                    (event.currentTarget as HTMLInputElement).value || undefined,
                  )}
              />
            </div>
            <div>
              <span class="mb-0.5 block text-xs font-medium text-slate-500">
                End Date
              </span>
              <input
                type="month"
                value={work.endDate ?? ''}
                disabled={work.current}
                class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-coral-500 disabled:cursor-not-allowed disabled:opacity-50"
                oninput={(event) =>
                  handleFieldChange(
                    'endDate',
                    (event.currentTarget as HTMLInputElement).value || undefined,
                  )}
              />
            </div>
            <div class="flex items-end pb-1">
              <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={work.current ?? false}
                  class="rounded border-slate-300"
                  onchange={(event) =>
                    handleFieldChange(
                      'current',
                      (event.currentTarget as HTMLInputElement).checked,
                    )}
                />
                Current
              </label>
            </div>
          </div>

          <div>
            <span class="mb-1 block text-xs font-medium text-slate-500">
              Description
            </span>
            <textarea
              value={work.description ?? ''}
              use:autosize
              placeholder="Describe your role and responsibilities..."
              class="min-h-[60px] w-full resize-none overflow-hidden whitespace-pre-wrap rounded-md border border-slate-200 px-3 py-2 text-sm text-foreground outline-none focus:border-transparent focus:ring-2 focus:ring-coral-500"
              oninput={(event) =>
                handleFieldChange(
                  'description',
                  (event.currentTarget as HTMLTextAreaElement).value,
                )}
            ></textarea>
          </div>
        {/if}
      </div>
    </div>
  </div>
</article>
