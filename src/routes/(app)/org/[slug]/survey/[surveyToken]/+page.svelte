<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { ClipboardList } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  const surveyToken = $derived(page.params.surveyToken ?? null)

  const surveyData = useQuery(api.feedbackSurveys.getSurveyByToken, () =>
    surveyToken
      ? {
          accessToken: surveyToken,
        }
      : 'skip',
  )

  const pageTitle = $derived(
    surveyData.data
      ? `${surveyData.data.survey.title} | ASTN`
      : 'Feedback Survey | ASTN',
  )
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<GradientBg>
  <main class="container mx-auto px-4 py-8">
    <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
      <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <ClipboardList class="size-8" />
      </div>

      <h1 class="font-display text-3xl text-slate-950">
        {surveyData.data ? surveyData.data.survey.title : 'Feedback Survey'}
      </h1>

      <p class="mt-4 text-sm leading-6 text-slate-600">
        This survey uses individual response links. Check your email for your
        personal survey link, or contact the organizer.
      </p>

      <a
        href={`/org/${page.params.slug}`}
        class="mt-6 inline-flex rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Visit Organization
      </a>
    </div>
  </main>
</GradientBg>
