<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { format } from 'date-fns'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    Briefcase,
    CalendarCheck,
    Check,
    ChevronRight,
    Globe,
    GraduationCap,
    Lock,
    MapPin,
    Shield,
    SlidersHorizontal,
    Sparkles,
    Target,
    Upload,
    User,
    Wrench,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import type { Doc } from '$convex/_generated/dataModel'
  import type { AppliedData } from '$lib/stores/profile-resume-review.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import {
    createProfileExtractionStore,
  } from '$lib/stores/profile-extraction.svelte'
  import { createProfileUploadStore } from '$lib/stores/profile-upload.svelte'
  import ResumeExtractionReview from '~/components/profile/extraction/ResumeExtractionReview.svelte'
  import DocumentUpload from '~/components/profile/upload/DocumentUpload.svelte'
  import ExtractionError from '~/components/profile/upload/ExtractionError.svelte'
  import ExtractionProgress from '~/components/profile/upload/ExtractionProgress.svelte'
  import FilePreview from '~/components/profile/upload/FilePreview.svelte'
  import LinkedInImport from '~/components/profile/upload/LinkedInImport.svelte'
  import TextPasteZone from '~/components/profile/upload/TextPasteZone.svelte'
  import UploadProgress from '~/components/profile/upload/UploadProgress.svelte'
  import Spinner from '~/components/ui/spinner.svelte'

  type SectionId =
    | 'basic'
    | 'education'
    | 'work'
    | 'goals'
    | 'skills'
    | 'preferences'
    | 'privacy'

  type EducationEntry = {
    institution: string
    degree?: string
    field?: string
    startYear?: number
    endYear?: number
    current?: boolean
  }

  type WorkEntry = {
    organization: string
    title: string
    startDate?: number
    endDate?: number
    current?: boolean
    description?: string
  }

  type MatchPreferences = NonNullable<Doc<'profiles'>['matchPreferences']>
  type PrivacySettings = NonNullable<Doc<'profiles'>['privacySettings']>

  const AI_SAFETY_AREAS = [
    'Alignment Research',
    'Interpretability',
    'Technical Safety',
    'Robustness',
    'Scalable Oversight',
    'Multi-Agent Safety',
    'Red Teaming',
    'ML Engineering',
    'Safety Infrastructure',
    'Evaluation & Testing',
    'AI Governance',
    'AI Policy',
    'AI Ethics',
    'Existential Risk',
    'Field-Building',
    'Operations & Strategy',
    'Communications',
    'Community Building',
  ] as const

  const ROLE_TYPES = ['research', 'engineering', 'operations', 'policy', 'training', 'other']
  const EXPERIENCE_LEVELS = ['entry', 'mid', 'senior', 'lead']
  const COMMITMENT_TYPES = [
    'full_time',
    'part_time',
    'contract',
    'fellowship',
    'internship',
    'volunteer',
  ] as const
  const PRIVACY_SECTION_KEYS = [
    'basicInfo',
    'education',
    'workHistory',
    'skills',
    'careerGoals',
  ] as const

  const SECTION_LABELS: Record<SectionId, string> = {
    basic: 'Basic information',
    education: 'Education',
    work: 'Work history',
    goals: 'Career goals',
    skills: 'Skills',
    preferences: 'Match preferences',
    privacy: 'Privacy settings',
  }

  const SECTION_TO_COMPLETENESS: Record<SectionId, string | null> = {
    basic: 'basicInfo',
    education: 'education',
    work: 'workHistory',
    goals: 'careerGoals',
    skills: 'skills',
    preferences: 'matchPreferences',
    privacy: 'privacy',
  }

  const convex = useConvexClient()
  const profile = useQuery(api.profiles.getOrCreateProfile)
  const completeness = useQuery(api.profiles.getMyCompleteness)
  const attendanceSummary = useQuery(api.attendance.queries.getMyAttendanceSummary)
  const uploadStore = createProfileUploadStore()
  const extractionStore = createProfileExtractionStore()
  const extractionStatus = useQuery(api.extraction.queries.getExtractionStatus, () =>
    extractionStore.state.status === 'extracting' &&
    extractionStore.state.documentId
      ? {
          documentId: extractionStore.state.documentId,
        }
      : 'skip',
  )

  let syncedProfileId = $state<string | null>(null)
  let isSaving = $state(false)
  let isApplyingExtracted = $state(false)
  let lastSaved = $state<Date | null>(null)
  let pendingUpdates: Record<string, unknown> = {}
  let saveTimeout: ReturnType<typeof setTimeout> | undefined
  let skillDraft = $state('')
  let trackedProfileView = $state(false)
  let showLinkedInImport = $state(false)
  let showTextImport = $state(false)

  let name = $state('')
  let pronouns = $state('')
  let location = $state('')
  let headline = $state('')
  let education = $state<EducationEntry[]>([])
  let workHistory = $state<WorkEntry[]>([])
  let careerGoals = $state('')
  let seeking = $state('')
  let aiSafetyInterests = $state<string[]>([])
  let skills = $state<string[]>([])
  let matchPreferences = $state<MatchPreferences>({})
  let privacySettings = $state<PrivacySettings>({
    defaultVisibility: 'connections',
    sectionVisibility: {},
    hiddenFromOrgs: [],
  })

  const syncFromProfile = (data: Doc<'profiles'>) => {
    name = data.name ?? ''
    pronouns = data.pronouns ?? ''
    location = data.location ?? ''
    headline = data.headline ?? ''
    education = structuredClone(data.education ?? [])
    workHistory = structuredClone(data.workHistory ?? [])
    careerGoals = data.careerGoals ?? ''
    seeking = data.seeking ?? ''
    aiSafetyInterests = [...(data.aiSafetyInterests ?? [])]
    skills = [...(data.skills ?? [])]
    matchPreferences = structuredClone(data.matchPreferences ?? {})
    privacySettings = structuredClone(
      data.privacySettings ?? {
        defaultVisibility: 'connections',
        sectionVisibility: {},
        hiddenFromOrgs: [],
      },
    )
  }

  $effect(() => {
    if (profile.data && profile.data._id !== syncedProfileId) {
      syncedProfileId = profile.data._id
      syncFromProfile(profile.data)
    }
  })

  $effect(() => {
    if (!profile.data && profile.isLoading) {
      return
    }

    if (profile.data === null) {
      void convex
        .mutation(api.profiles.create, {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        })
        .catch(() => {
          toast.error('Failed to create profile')
        })
    }
  })

  $effect(() => {
    if (profile.data && completeness.data && !trackedProfileView) {
      trackedProfileView = true
      posthogStore.capture('profile_page_viewed', {
        completeness_pct: completeness.data.percentage,
      })
    }
  })

  $effect(() => {
    const section = page.url.searchParams.get('section')
    if (!section) {
      return
    }

    const node = document.getElementById(section)
    if (!node) {
      return
    }

    const timer = setTimeout(() => {
      node.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)

    return () => clearTimeout(timer)
  })

  $effect(() => {
    extractionStore.syncDocumentStatus(extractionStatus.data)
  })

  const scheduleSave = (field: string, value: unknown, debounceMs = 500) => {
    if (!profile.data?._id) return

    pendingUpdates[field] = value
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    isSaving = true

    saveTimeout = setTimeout(async () => {
      const updates = { ...pendingUpdates }
      pendingUpdates = {}

      try {
        await convex.mutation(api.profiles.updateField, {
          profileId: profile.data!._id,
          updates,
        })
        lastSaved = new Date()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save profile')
      } finally {
        isSaving = false
      }
    }, debounceMs)
  }

  const saveImmediate = async (field: string, value: unknown) => {
    if (!profile.data?._id) return

    isSaving = true
    try {
      await convex.mutation(api.profiles.updateField, {
        profileId: profile.data._id,
        updates: { [field]: value },
      })
      lastSaved = new Date()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save profile')
    } finally {
      isSaving = false
    }
  }

  const updateSectionQuery = async (section: SectionId) => {
    const params = new URLSearchParams(page.url.searchParams)
    params.set('section', section)
    await goto(`/profile?${params.toString()}`, {
      replaceState: true,
      noScroll: true,
      keepFocus: true,
    })
  }

  const isSectionComplete = (section: SectionId) => {
    const id = SECTION_TO_COMPLETENESS[section]
    if (!id || !completeness.data) return false
    return completeness.data.sections.find((item) => item.id === id)?.isComplete ?? false
  }

  const createEmptyEducation = (): EducationEntry => ({
    institution: '',
    degree: '',
    field: '',
    startYear: undefined,
    endYear: undefined,
    current: false,
  })

  const createEmptyWork = (): WorkEntry => ({
    organization: '',
    title: '',
    startDate: undefined,
    endDate: undefined,
    current: false,
    description: '',
  })

  const normalizeEducation = (entries: EducationEntry[]) =>
    entries.filter((entry) => entry.institution.trim() !== '')

  const normalizeWork = (entries: WorkEntry[]) =>
    entries.filter(
      (entry) => entry.organization.trim() !== '' || entry.title.trim() !== '',
    )

  const addSkill = async () => {
    const normalized = skillDraft.trim()
    if (!normalized || skills.includes(normalized)) {
      skillDraft = ''
      return
    }

    skills = [...skills, normalized]
    skillDraft = ''
    await saveImmediate('skills', skills)
  }

  const removeSkill = async (skill: string) => {
    skills = skills.filter((item) => item !== skill)
    await saveImmediate('skills', skills)
  }

  const toggleInterest = async (interest: string) => {
    aiSafetyInterests = aiSafetyInterests.includes(interest)
      ? aiSafetyInterests.filter((item) => item !== interest)
      : [...aiSafetyInterests, interest]

    await saveImmediate('aiSafetyInterests', aiSafetyInterests)
  }

  const togglePreferenceValue = async (
    field: 'roleTypes' | 'experienceLevels' | 'commitmentTypes',
    value: string,
  ) => {
    const current = [...((matchPreferences[field] as string[] | undefined) ?? [])]
    const updated = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value]

    matchPreferences = { ...matchPreferences, [field]: updated }
    await saveImmediate('matchPreferences', matchPreferences)
  }

  const getSectionVisibility = (
    sectionKey: (typeof PRIVACY_SECTION_KEYS)[number],
  ) => privacySettings.sectionVisibility?.[sectionKey] ?? ''

  const updateSectionVisibility = async (
    sectionKey: (typeof PRIVACY_SECTION_KEYS)[number],
    value: string,
  ) => {
    privacySettings = {
      ...privacySettings,
      sectionVisibility: {
        ...(privacySettings.sectionVisibility ?? {}),
        [sectionKey]: value || undefined,
      },
    }
    await saveImmediate('privacySettings', privacySettings)
  }

  const formatMonthValue = (timestamp?: number) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  const parseMonthValue = (value: string) => {
    if (!value) return undefined
    const [year, month] = value.split('-').map(Number)
    return new Date(year, month - 1, 1).getTime()
  }

  const saveIndicator = $derived(
    isSaving
      ? 'Saving...'
      : lastSaved
        ? `Saved ${format(lastSaved, 'p')}`
        : '',
  )

  const startUploadExtraction = async (file: File) => {
    showLinkedInImport = false
    showTextImport = false
    uploadStore.selectFile(file)
    await uploadStore.upload(convex)

    if (uploadStore.state.status === 'success') {
      await extractionStore.extractFromDocument(uploadStore.state.documentId, convex)
    }
  }

  const retryExtraction = async () => {
    await extractionStore.retry(convex)
  }

  const resetImportFlow = () => {
    extractionStore.reset()
    uploadStore.clearFile()
    showLinkedInImport = false
    showTextImport = false
  }

  const applyExtractedData = async (data: AppliedData) => {
    isApplyingExtracted = true

    try {
      await convex.mutation(api.profiles.applyExtractedProfile, {
        extractedData: data,
      })
      toast.success('Imported profile details')
      lastSaved = new Date()
      resetImportFlow()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to apply extracted data',
      )
    } finally {
      isApplyingExtracted = false
    }
  }
</script>

{#if profile.isLoading || completeness.isLoading}
  <div class="flex min-h-[400px] items-center justify-center">
    <Spinner />
  </div>
{:else if !profile.data}
  <div class="flex min-h-[400px] items-center justify-center">
    <Spinner />
  </div>
{:else}
  <div class="flex flex-col gap-6 md:flex-row md:gap-8">
    <aside class="md:w-72 md:shrink-0">
      <div class="md:sticky md:top-8">
        <div class="rounded-[1.75rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm">
          <p class="text-sm font-medium text-slate-700">Profile completeness</p>
          <div class="mt-2 text-3xl font-semibold text-slate-950">
            {completeness.data?.completedCount ?? 0}
            <span class="text-base font-normal text-slate-500">
              {' '}of {completeness.data?.totalCount ?? 7}
            </span>
          </div>

          <div class="mt-4 h-2.5 rounded-full bg-slate-200">
            <div
              class="h-2.5 rounded-full bg-coral-500 transition-all duration-300"
              style={`width: ${completeness.data?.percentage ?? 0}%`}
            ></div>
          </div>

          <nav class="mt-5 space-y-1">
            {#each (Object.keys(SECTION_LABELS) as SectionId[]) as section}
              <button
                type="button"
                class={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition ${
                  page.url.searchParams.get('section') === section
                    ? 'bg-coral-50 text-coral-800'
                    : 'text-slate-600 hover:bg-accent hover:text-foreground'
                }`}
                onclick={() => updateSectionQuery(section)}
              >
                <span class={`grid size-5 place-items-center rounded-full text-xs ${
                  isSectionComplete(section)
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                  {#if isSectionComplete(section)}
                    <Check class="size-3" />
                  {/if}
                </span>
                <span>{SECTION_LABELS[section]}</span>
              </button>
            {/each}
          </nav>

          <div class="mt-5 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
            {#if completeness.data && completeness.data.completedCount >= 5}
              Matching is unlocked.
            {:else}
              Complete {Math.max(0, 5 - (completeness.data?.completedCount ?? 0))} more
              {' '}section{Math.max(0, 5 - (completeness.data?.completedCount ?? 0)) === 1 ? '' : 's'}
              {' '}to unlock matching.
            {/if}
          </div>
        </div>
      </div>
    </aside>

    <div class="flex-1 space-y-6 md:min-w-0">
      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-coral-100 text-coral-700">
            <Upload class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Import your profile</h2>
            <p class="text-sm text-slate-600">
              Pull in resume, CV, or LinkedIn details and review them before they touch
              your profile.
            </p>
          </div>
        </div>

        <div class="space-y-4">
          {#if extractionStore.state.status === 'success'}
            <ResumeExtractionReview
              extractedData={extractionStore.state.extractedData}
              onApply={applyExtractedData}
              onSkip={resetImportFlow}
              isApplying={isApplyingExtracted}
            />
          {:else}
            {#if uploadStore.state.status === 'uploading'}
              <UploadProgress
                status="uploading"
                progress={uploadStore.state.progress}
                fileName={uploadStore.state.file.name}
              />
            {:else if extractionStore.state.status === 'extracting'}
              <div class="space-y-4">
                {#if uploadStore.state.status === 'success'}
                  <FilePreview
                    file={uploadStore.state.file}
                    disabled={true}
                    onRemove={resetImportFlow}
                  />
                {/if}
                <ExtractionProgress
                  stage={extractionStore.state.stage}
                  fileName={
                    uploadStore.state.status === 'success'
                      ? uploadStore.state.file.name
                      : undefined
                  }
                />
              </div>
            {:else if extractionStore.state.status === 'error'}
              <ExtractionError
                error={extractionStore.state.error}
                canRetry={extractionStore.state.canRetry}
                onRetry={() => {
                  void retryExtraction()
                }}
                onPasteText={() => {
                  showTextImport = true
                  showLinkedInImport = false
                }}
                onManualEntry={() => updateSectionQuery('basic')}
              />
            {:else}
              <div class="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                <div class="space-y-4">
                  {#if uploadStore.state.status === 'selected' || uploadStore.state.status === 'error'}
                    <FilePreview
                      file={uploadStore.state.file}
                      onRemove={resetImportFlow}
                      onReplace={resetImportFlow}
                    />
                  {/if}

                  <DocumentUpload
                    onFileSelect={(file) => {
                      void startUploadExtraction(file)
                    }}
                    disabled={isApplyingExtracted}
                    error={uploadStore.state.status === 'error'
                      ? uploadStore.state.error
                      : null}
                    onErrorDismiss={() => uploadStore.retry()}
                  />
                </div>

                <div class="rounded-3xl border border-dashed border-border/70 bg-slate-50/90 p-5">
                  <div class="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Sparkles class="size-4 text-coral-600" />
                    Faster alternatives
                  </div>

                  <div class="space-y-4">
                    {#if showLinkedInImport}
                      <LinkedInImport
                        isLoading={isApplyingExtracted}
                        onSubmit={(url) => {
                          void extractionStore.extractFromLinkedIn(url, convex)
                        }}
                        onCancel={() => {
                          showLinkedInImport = false
                        }}
                      />
                    {:else}
                      <button
                        type="button"
                        class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:border-coral-200 hover:bg-coral-50"
                        onclick={() => {
                          showLinkedInImport = true
                          showTextImport = false
                        }}
                      >
                        Import from LinkedIn
                      </button>
                    {/if}

                    <TextPasteZone
                      defaultExpanded={showTextImport}
                      disabled={isApplyingExtracted}
                      onTextSubmit={(text) => {
                        showTextImport = true
                        showLinkedInImport = false
                        void extractionStore.extractFromText(text, convex)
                      }}
                    />
                  </div>
                </div>
              </div>
            {/if}
          {/if}
        </div>
      </section>

      <section id="basic" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-coral-100 text-coral-700">
            <User class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Basic information</h2>
            <p class="text-sm text-slate-600">Your identity, location, and short headline.</p>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Name</span>
            <input
              bind:value={name}
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => scheduleSave('name', name)}
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Pronouns</span>
            <input
              bind:value={pronouns}
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => scheduleSave('pronouns', pronouns)}
            />
          </label>

          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Location</span>
            <input
              bind:value={location}
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => scheduleSave('location', location)}
            />
          </label>

          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-foreground">Headline</span>
            <textarea
              bind:value={headline}
              rows="2"
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => scheduleSave('headline', headline)}
            ></textarea>
          </label>
        </div>
      </section>

      <section id="education" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-teal-100 text-teal-700">
            <GraduationCap class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Education</h2>
            <p class="text-sm text-slate-600">Degrees, institutions, and study history.</p>
          </div>
        </div>

        <div class="space-y-4">
          {#each education as entry, index}
            <div class="rounded-2xl border border-border/70 p-4">
              <div class="mb-4 flex items-center justify-between">
                <p class="text-sm font-medium text-slate-700">Education {index + 1}</p>
                <button
                  type="button"
                  class="text-sm text-rose-600 transition hover:text-rose-700"
                  onclick={async () => {
                    education = education.filter((_, currentIndex) => currentIndex !== index)
                    await saveImmediate('education', normalizeEducation(education))
                  }}
                >
                  Remove
                </button>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <input
                  bind:value={entry.institution}
                  placeholder="Institution"
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onblur={() => saveImmediate('education', normalizeEducation(education))}
                />
                <input
                  bind:value={entry.degree}
                  placeholder="Degree"
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onblur={() => saveImmediate('education', normalizeEducation(education))}
                />
                <input
                  bind:value={entry.field}
                  placeholder="Field"
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onblur={() => saveImmediate('education', normalizeEducation(education))}
                />
                <div class="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    bind:value={entry.startYear}
                    placeholder="Start year"
                    class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    onblur={() => saveImmediate('education', normalizeEducation(education))}
                  />
                  <input
                    type="number"
                    bind:value={entry.endYear}
                    placeholder="End year"
                    disabled={entry.current}
                    class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    onblur={() => saveImmediate('education', normalizeEducation(education))}
                  />
                </div>
              </div>

              <label class="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  bind:checked={entry.current}
                  onchange={() => saveImmediate('education', normalizeEducation(education))}
                />
                Currently enrolled
              </label>
            </div>
          {/each}

          <button
            type="button"
            class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            onclick={() => {
              education = [...education, createEmptyEducation()]
            }}
          >
            Add education
          </button>
        </div>
      </section>

      <section id="work" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-blue-100 text-blue-700">
            <Briefcase class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Work history</h2>
            <p class="text-sm text-slate-600">Roles, dates, and what you worked on.</p>
          </div>
        </div>

        <div class="space-y-4">
          {#each workHistory as entry, index}
            <div class="rounded-2xl border border-border/70 p-4">
              <div class="mb-4 flex items-center justify-between">
                <p class="text-sm font-medium text-slate-700">Role {index + 1}</p>
                <button
                  type="button"
                  class="text-sm text-rose-600 transition hover:text-rose-700"
                  onclick={async () => {
                    workHistory = workHistory.filter((_, currentIndex) => currentIndex !== index)
                    await saveImmediate('workHistory', normalizeWork(workHistory))
                  }}
                >
                  Remove
                </button>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <input
                  bind:value={entry.title}
                  placeholder="Title"
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onblur={() => saveImmediate('workHistory', normalizeWork(workHistory))}
                />
                <input
                  bind:value={entry.organization}
                  placeholder="Organization"
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onblur={() => saveImmediate('workHistory', normalizeWork(workHistory))}
                />
                <input
                  type="month"
                  value={formatMonthValue(entry.startDate)}
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onchange={(event) => {
                    entry.startDate = parseMonthValue((event.currentTarget as HTMLInputElement).value)
                  }}
                  onblur={() => saveImmediate('workHistory', normalizeWork(workHistory))}
                />
                <input
                  type="month"
                  value={formatMonthValue(entry.endDate)}
                  disabled={entry.current}
                  class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onchange={(event) => {
                    entry.endDate = parseMonthValue((event.currentTarget as HTMLInputElement).value)
                  }}
                  onblur={() => saveImmediate('workHistory', normalizeWork(workHistory))}
                />
                <textarea
                  bind:value={entry.description}
                  rows="3"
                  placeholder="Description"
                  class="md:col-span-2 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onblur={() => saveImmediate('workHistory', normalizeWork(workHistory))}
                ></textarea>
              </div>

              <label class="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  bind:checked={entry.current}
                  onchange={() => saveImmediate('workHistory', normalizeWork(workHistory))}
                />
                I currently work here
              </label>
            </div>
          {/each}

          <button
            type="button"
            class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            onclick={() => {
              workHistory = [...workHistory, createEmptyWork()]
            }}
          >
            Add work experience
          </button>
        </div>
      </section>

      <section id="goals" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-orange-100 text-orange-700">
            <Target class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Career goals</h2>
            <p class="text-sm text-slate-600">What you want to do in AI safety and what you're seeking.</p>
          </div>
        </div>

        <div class="space-y-4">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Career goals</span>
            <textarea
              bind:value={careerGoals}
              rows="4"
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => scheduleSave('careerGoals', careerGoals)}
            ></textarea>
          </label>

          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">What are you looking for?</span>
            <textarea
              bind:value={seeking}
              rows="3"
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => scheduleSave('seeking', seeking)}
            ></textarea>
          </label>

          <div>
            <span class="mb-2 block text-sm font-medium text-foreground">AI safety interests</span>
            <div class="flex flex-wrap gap-2">
              {#each AI_SAFETY_AREAS as interest}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-sm transition ${
                    aiSafetyInterests.includes(interest)
                      ? 'border-coral-300 bg-coral-50 text-coral-800'
                      : 'border-border text-slate-600 hover:bg-accent'
                  }`}
                  onclick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <section id="skills" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-violet-100 text-violet-700">
            <Wrench class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Skills</h2>
            <p class="text-sm text-slate-600">Add the capabilities you want ASTN to match against.</p>
          </div>
        </div>

        <div class="flex gap-3">
          <input
            bind:value={skillDraft}
            class="flex-1 rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
            placeholder="Type a skill and press Add"
            onkeydown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                void addSkill()
              }
            }}
          />
          <button
            type="button"
            class="inline-flex rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600"
            onclick={addSkill}
          >
            Add
          </button>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          {#each skills as skill}
            <button
              type="button"
              class="rounded-full border border-border bg-slate-50 px-3 py-1.5 text-sm text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              onclick={() => removeSkill(skill)}
            >
              {skill}
            </button>
          {/each}
        </div>
      </section>

      <section id="preferences" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <SlidersHorizontal class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Match preferences</h2>
            <p class="text-sm text-slate-600">Filters and constraints applied before matching.</p>
          </div>
        </div>

        <div class="grid gap-5">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Remote preference</span>
            <select
              bind:value={matchPreferences.remotePreference}
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onchange={() => saveImmediate('matchPreferences', matchPreferences)}
            >
              <option value="">No preference</option>
              <option value="remote_only">Remote only</option>
              <option value="on_site_ok">On-site OK</option>
              <option value="no_preference">No preference</option>
            </select>
          </label>

          <div>
            <span class="mb-2 block text-sm font-medium text-foreground">Preferred role types</span>
            <div class="flex flex-wrap gap-2">
              {#each ROLE_TYPES as role}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-sm transition ${
                    (matchPreferences.roleTypes ?? []).includes(role)
                      ? 'border-coral-300 bg-coral-50 text-coral-800'
                      : 'border-border text-slate-600 hover:bg-accent'
                  }`}
                  onclick={() => togglePreferenceValue('roleTypes', role)}
                >
                  {role}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <span class="mb-2 block text-sm font-medium text-foreground">Experience levels</span>
            <div class="flex flex-wrap gap-2">
              {#each EXPERIENCE_LEVELS as level}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-sm transition ${
                    (matchPreferences.experienceLevels ?? []).includes(level)
                      ? 'border-coral-300 bg-coral-50 text-coral-800'
                      : 'border-border text-slate-600 hover:bg-accent'
                  }`}
                  onclick={() => togglePreferenceValue('experienceLevels', level)}
                >
                  {level}
                </button>
              {/each}
            </div>
          </div>

          <label class="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              bind:checked={matchPreferences.willingToRelocate}
              onchange={() => saveImmediate('matchPreferences', matchPreferences)}
            />
            Willing to relocate
          </label>

          <div class="grid gap-4 md:grid-cols-2">
            <input
              bind:value={matchPreferences.workAuthorization}
              placeholder="Work authorization"
              class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => saveImmediate('matchPreferences', matchPreferences)}
            />
            <input
              type="number"
              bind:value={matchPreferences.minimumSalaryUSD}
              placeholder="Minimum salary USD"
              class="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onblur={() => saveImmediate('matchPreferences', matchPreferences)}
            />
          </div>

          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Availability</span>
            <select
              bind:value={matchPreferences.availability}
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onchange={() => saveImmediate('matchPreferences', matchPreferences)}
            >
              <option value="">Select availability</option>
              <option value="immediately">Immediately</option>
              <option value="within_1_month">Within 1 month</option>
              <option value="within_3_months">Within 3 months</option>
              <option value="within_6_months">Within 6 months</option>
              <option value="not_available">Not available</option>
            </select>
          </label>

          <div>
            <span class="mb-2 block text-sm font-medium text-foreground">Commitment types</span>
            <div class="flex flex-wrap gap-2">
              {#each COMMITMENT_TYPES as commitment}
                <button
                  type="button"
                  class={`rounded-full border px-3 py-1.5 text-sm transition ${
                    (matchPreferences.commitmentTypes ?? []).includes(commitment)
                      ? 'border-coral-300 bg-coral-50 text-coral-800'
                      : 'border-border text-slate-600 hover:bg-accent'
                  }`}
                  onclick={() => togglePreferenceValue('commitmentTypes', commitment)}
                >
                  {commitment}
                </button>
              {/each}
            </div>
          </div>
        </div>
      </section>

      <section id="privacy" class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <Shield class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Privacy settings</h2>
            <p class="text-sm text-slate-600">Default visibility and section-level overrides.</p>
          </div>
        </div>

        <div class="grid gap-5">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-foreground">Default visibility</span>
            <select
              bind:value={privacySettings.defaultVisibility}
              class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
              onchange={() => saveImmediate('privacySettings', privacySettings)}
            >
              <option value="public">Public</option>
              <option value="connections">Connections only</option>
              <option value="private">Private</option>
            </select>
          </label>

          <div class="grid gap-3 md:grid-cols-2">
            {#each PRIVACY_SECTION_KEYS as sectionKey}
              <label class="block">
                <span class="mb-1 block text-sm font-medium text-foreground">
                  {sectionKey}
                </span>
                <select
                  value={getSectionVisibility(sectionKey)}
                  class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  onchange={(event) =>
                    updateSectionVisibility(
                      sectionKey,
                      (event.currentTarget as HTMLSelectElement).value,
                    )}
                >
                  <option value="">Use default</option>
                  <option value="public">Public</option>
                  <option value="connections">Connections only</option>
                  <option value="private">Private</option>
                </select>
              </label>
            {/each}
          </div>

          <div class="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-slate-600">
            Org-specific hiding is preserved in your data, but the picker will be
            reconnected in the later privacy polish pass.
          </div>
        </div>
      </section>

      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="mb-4 flex items-center gap-3">
          <div class="grid size-10 place-items-center rounded-2xl bg-coral-100 text-coral-700">
            <CalendarCheck class="size-5" />
          </div>
          <div>
            <h2 class="text-xl font-semibold text-slate-950">Event attendance</h2>
            <p class="text-sm text-slate-600">Recent attendance and a link to full history.</p>
          </div>
        </div>

        {#if attendanceSummary.isLoading}
          <div class="flex justify-center py-6">
            <Spinner />
          </div>
        {:else if !attendanceSummary.data || attendanceSummary.data.total === 0}
          <div>
            <p class="text-sm italic text-slate-500">No events attended yet.</p>
            <a
              href="/orgs"
              class="mt-4 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
            >
              Browse organizations
            </a>
          </div>
        {:else}
          <div class="space-y-3">
            <p class="text-sm text-slate-600">
              {attendanceSummary.data.attended} event{attendanceSummary.data.attended === 1 ? '' : 's'} attended
            </p>

            {#each attendanceSummary.data.recent as record}
              <div class="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
                <div class="min-w-0">
                  <p class="truncate text-sm font-medium text-foreground">
                    {record.event.title}
                  </p>
                  <p class="text-xs text-slate-500">
                    {record.org?.name} · {format(record.event.startAt, 'MMM d, yyyy')}
                  </p>
                </div>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                  {record.status}
                </span>
              </div>
            {/each}

            <a
              href="/profile/attendance"
              class="inline-flex items-center gap-1 text-sm text-coral-700 transition hover:underline"
            >
              View full history
              <ChevronRight class="size-4" />
            </a>
          </div>
        {/if}
      </section>

      {#if saveIndicator}
        <div class="text-sm text-slate-500">{saveIndicator}</div>
      {/if}
    </div>
  </div>
{/if}
