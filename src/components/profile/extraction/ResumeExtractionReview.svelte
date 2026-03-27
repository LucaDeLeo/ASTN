<script lang="ts">
  import { Check, CheckCircle2, LoaderCircle, X } from 'lucide-svelte'
  import type { ExtractedData } from './types'
  import ExtractionFieldCard from './ExtractionFieldCard.svelte'
  import ExpandableEntryCard from './ExpandableEntryCard.svelte'
  import SkillsEditor from './SkillsEditor.svelte'
  import {
    createResumeReviewStore,
    type AppliedData,
  } from '$lib/stores/profile-resume-review.svelte'
  import { cn } from '~/lib/utils'

  type EducationEntry = NonNullable<ExtractedData['education']>[0]
  type WorkHistoryEntry = NonNullable<ExtractedData['workHistory']>[0]

  let {
    extractedData,
    onApply,
    onSkip,
    isApplying = false,
  }: {
    extractedData: ExtractedData
    onApply: (data: AppliedData) => Promise<void>
    onSkip: () => void
    isApplying?: boolean
  } = $props()

  const reviewStore = createResumeReviewStore(null)

  $effect(() => {
    reviewStore.setExtractedData(extractedData)
  })

  const groupedItems = $derived.by(() => {
    const basicFields = reviewStore.items.filter(
      (item) =>
        item.field === 'name' ||
        item.field === 'location' ||
        item.field === 'email',
    )
    const educationItems = reviewStore.items.filter(
      (item) => item.field === 'education',
    )
    const workHistoryItems = reviewStore.items.filter(
      (item) => item.field === 'workHistory',
    )
    const skillsItem = reviewStore.items.find((item) => item.field === 'skills')

    return {
      basicFields,
      educationItems,
      workHistoryItems,
      skillsItem,
    }
  })

  const currentSkills = $derived(
    groupedItems.skillsItem
      ? ((groupedItems.skillsItem.editedValue ??
          groupedItems.skillsItem.value) as Array<string>)
      : [],
  )

  const hasGaps = $derived(
    reviewStore.acceptedCount < reviewStore.totalFields ||
      !extractedData.name ||
      !extractedData.location ||
      (extractedData.education?.length ?? 0) === 0 ||
      (extractedData.workHistory?.length ?? 0) === 0,
  )

  const handleApply = async () => {
    await onApply(reviewStore.getAcceptedData())
  }
</script>

<div class="space-y-6">
  <div>
    <h3 class="text-lg font-medium text-foreground">
      Review Extracted Information
    </h3>
    <p class="text-sm text-slate-500">
      All fields will be applied by default. Edit or reject any items you want
      to change.
    </p>
  </div>

  {#if groupedItems.basicFields.length > 0}
    <section class="space-y-3">
      <h4 class="font-medium text-slate-700">Basic Information</h4>
      <div class="space-y-3">
        {#each groupedItems.basicFields as item (item.id)}
          <ExtractionFieldCard
            label={item.label}
            value={item.value as string | undefined}
            editedValue={item.editedValue as string | undefined}
            status={item.status}
            onAccept={() => reviewStore.updateStatus(item.id, 'accepted')}
            onReject={() => reviewStore.updateStatus(item.id, 'rejected')}
            onEdit={(value) => reviewStore.updateValue(item.id, value)}
            displayOnly={item.field === 'email'}
          />
        {/each}
      </div>
    </section>
  {/if}

  {#if groupedItems.workHistoryItems.length > 0}
    <section class="space-y-3">
      <h4 class="font-medium text-slate-700">Work History</h4>
      <div class="space-y-3">
        {#each groupedItems.workHistoryItems as item (item.id)}
          <ExpandableEntryCard
            type="workHistory"
            entry={item.value as WorkHistoryEntry}
            editedEntry={item.editedValue as WorkHistoryEntry | undefined}
            status={item.status}
            onAccept={() => reviewStore.updateStatus(item.id, 'accepted')}
            onReject={() => reviewStore.updateStatus(item.id, 'rejected')}
            onEdit={(entry) => reviewStore.updateValue(item.id, entry)}
          />
        {/each}
      </div>
    </section>
  {/if}

  {#if groupedItems.educationItems.length > 0}
    <section class="space-y-3">
      <h4 class="font-medium text-slate-700">Education</h4>
      <div class="space-y-3">
        {#each groupedItems.educationItems as item (item.id)}
          <ExpandableEntryCard
            type="education"
            entry={item.value as EducationEntry}
            editedEntry={item.editedValue as EducationEntry | undefined}
            status={item.status}
            onAccept={() => reviewStore.updateStatus(item.id, 'accepted')}
            onReject={() => reviewStore.updateStatus(item.id, 'rejected')}
            onEdit={(entry) => reviewStore.updateValue(item.id, entry)}
          />
        {/each}
      </div>
    </section>
  {/if}

  {#if groupedItems.skillsItem || (extractedData.rawSkills && extractedData.rawSkills.length > 0)}
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h4 class="font-medium text-slate-700">Skills</h4>
        {#if groupedItems.skillsItem}
          <div class="flex items-center gap-2">
            {#if groupedItems.skillsItem.status === 'edited' || groupedItems.skillsItem.status === 'rejected'}
              <span
                class={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                  groupedItems.skillsItem.status === 'rejected'
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-amber-100 text-amber-800',
                )}
              >
                {groupedItems.skillsItem.status === 'rejected' ? 'Rejected' : 'Edited'}
              </span>
            {/if}

            <div class="flex gap-1">
              <button
                type="button"
                class={cn(
                  'inline-flex size-8 items-center justify-center rounded-md transition-colors',
                  'text-slate-400 hover:bg-green-50 hover:text-green-600',
                  groupedItems.skillsItem.status === 'accepted' &&
                    'bg-green-100 text-green-600',
                )}
                disabled={groupedItems.skillsItem.status === 'accepted'}
                onclick={() => reviewStore.updateStatus(groupedItems.skillsItem!.id, 'accepted')}
              >
                <Check class="size-4" />
              </button>
              <button
                type="button"
                class={cn(
                  'inline-flex size-8 items-center justify-center rounded-md transition-colors',
                  'text-slate-400 hover:bg-red-50 hover:text-red-600',
                  groupedItems.skillsItem.status === 'rejected' &&
                    'bg-red-100 text-red-600',
                )}
                disabled={groupedItems.skillsItem.status === 'rejected'}
                onclick={() => reviewStore.updateStatus(groupedItems.skillsItem!.id, 'rejected')}
              >
                <X class="size-4" />
              </button>
            </div>
          </div>
        {/if}
      </div>

      {#if groupedItems.skillsItem && groupedItems.skillsItem.status !== 'rejected'}
        <SkillsEditor
          selectedSkills={currentSkills}
          onSkillsChange={(skills) =>
            reviewStore.updateValue(groupedItems.skillsItem!.id, skills)}
        />
      {/if}

      {#if extractedData.rawSkills && extractedData.rawSkills.length > 0}
        <p class="text-sm text-muted-foreground">
          Also mentioned: {extractedData.rawSkills.join(', ')}
        </p>
      {/if}
    </section>
  {/if}

  <div class="flex items-center justify-between border-t pt-4">
    <div>
      <p class="text-sm text-slate-500">
        {reviewStore.acceptedCount} of {reviewStore.totalFields} fields will be
        applied
      </p>
      {#if hasGaps}
        <p class="text-xs text-muted-foreground">
          Enrichment chat can help fill in the remaining details
        </p>
      {/if}
    </div>
    <div class="flex gap-2">
      <button
        type="button"
        class="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        onclick={onSkip}
      >
        Skip to Manual Entry
      </button>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        disabled={!reviewStore.hasAcceptedFields || isApplying}
        onclick={() => {
          void handleApply()
        }}
      >
        {#if isApplying}
          <LoaderCircle class="size-4 animate-spin" />
          Applying...
        {:else}
          <CheckCircle2 class="size-4" />
          Apply to Profile
        {/if}
      </button>
    </div>
  </div>
</div>
