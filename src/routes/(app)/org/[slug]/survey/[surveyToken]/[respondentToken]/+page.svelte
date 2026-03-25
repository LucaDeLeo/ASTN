<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { CheckCircle2, ClipboardList, LoaderCircle, Lock } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import DynamicFormRenderer from '~/components/public-org/DynamicFormRenderer.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  const convex = useConvexClient()
  const respondentToken = $derived(page.params.respondentToken ?? null)

  const surveyData = useQuery(api.feedbackSurveys.getSurveyByRespondentToken, () =>
    respondentToken
      ? {
          respondentToken,
        }
      : 'skip',
  )

  const existingResponse = useQuery(
    api.feedbackSurveys.getResponseByRespondent,
    () =>
      surveyData.data
        ? {
            surveyId: surveyData.data.survey._id,
            respondentId: surveyData.data.respondentId,
          }
        : 'skip',
  )

  let responses = $state<Record<string, unknown>>({})
  let initialized = $state(false)
  let isSubmitting = $state(false)
  let isSubmitted = $state(false)

  $effect(() => {
    if (!initialized && existingResponse.data !== undefined) {
      responses = (existingResponse.data?.responses as Record<string, unknown> | undefined) ?? {}
      isSubmitted = Boolean(existingResponse.data)
      initialized = true
    }
  })

  const handleChange = (key: string, value: unknown) => {
    responses = { ...responses, [key]: value }
    isSubmitted = false
  }

  const handleSubmit = async () => {
    if (!surveyData.data || isSubmitting) return
    isSubmitting = true
    try {
      await convex.mutation(api.feedbackSurveys.submitResponse, {
        surveyId: surveyData.data.survey._id,
        respondentId: surveyData.data.respondentId,
        responses,
      })
      isSubmitted = true
      toast.success('Response submitted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit response')
    } finally {
      isSubmitting = false
    }
  }

  const pageTitle = $derived(
    surveyData.data
      ? `${surveyData.data.survey.title} | ${surveyData.data.org.name} | ASTN`
      : 'Feedback Survey | ASTN',
  )
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<GradientBg>
  <main class="container mx-auto px-4 py-8">
    {#if surveyData.isLoading}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if !surveyData.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <ClipboardList class="mx-auto mb-4 size-8 text-slate-400" />
        <h1 class="font-display text-3xl text-slate-950">Survey not found</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This survey link may be invalid or expired.
        </p>
      </div>
    {:else if surveyData.data.survey.status !== 'open'}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <Lock class="mx-auto mb-4 size-8 text-slate-400" />
        <h1 class="font-display text-3xl text-slate-950">Survey closed</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          {surveyData.data.survey.status === 'draft'
            ? 'This survey is not yet published.'
            : 'This survey is no longer accepting responses.'}
        </p>
      </div>
    {:else}
      <div class="mx-auto max-w-3xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <p class="text-sm text-slate-500">{surveyData.data.org.name}</p>
          <h1 class="mt-1 font-display text-3xl text-slate-950">
            {surveyData.data.survey.title}
          </h1>
          <p class="mt-2 text-sm text-slate-600">{surveyData.data.opportunity.title}</p>
          {#if surveyData.data.survey.description}
            <p class="mt-3 text-sm leading-6 text-slate-600">
              {surveyData.data.survey.description}
            </p>
          {/if}
          <p class="mt-3 text-sm text-slate-800">
            Responding as: <strong>{surveyData.data.respondentName}</strong>
          </p>
        </section>

        <DynamicFormRenderer
          formFields={surveyData.data.survey.formFields}
          {responses}
          onChange={handleChange}
        />

        <div class="flex items-center justify-end gap-3">
          {#if isSubmitted}
            <span class="flex items-center gap-1.5 text-sm text-green-600">
              <CheckCircle2 class="size-4" />
              Response submitted
            </span>
          {/if}
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:pointer-events-none disabled:opacity-50"
            disabled={isSubmitting}
            onclick={() => {
              void handleSubmit()
            }}
          >
            {#if isSubmitting}
              <LoaderCircle class="size-4 animate-spin" />
              Submitting...
            {:else if isSubmitted}
              Update response
            {:else}
              Submit feedback
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </main>
</GradientBg>
