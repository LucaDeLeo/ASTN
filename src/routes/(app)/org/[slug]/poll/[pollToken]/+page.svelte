<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { Clock } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  const pollToken = $derived(page.params.pollToken ?? null)

  const pollData = useQuery(api.availabilityPolls.getPollByToken, () =>
    pollToken
      ? {
          accessToken: pollToken,
        }
      : 'skip',
  )

  const pageTitle = $derived(
    pollData.data ? `${pollData.data.poll.title} | ASTN` : 'Availability Poll | ASTN',
  )
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<GradientBg>
  <main class="container mx-auto px-4 py-8">
    <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
      <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Clock class="size-8" />
      </div>

      <h1 class="font-display text-3xl text-slate-950">
        {pollData.data ? pollData.data.poll.title : 'Availability Poll'}
      </h1>

      <p class="mt-4 text-sm leading-6 text-slate-600">
        This poll uses individual response links. Check your email for your
        personal poll link, or contact the organizer.
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
