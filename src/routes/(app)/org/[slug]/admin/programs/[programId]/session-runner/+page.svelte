<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import SessionRunner from '~/components/session/SessionRunner.svelte'
  import SessionSetup from '~/components/session/SessionSetup.svelte'

  const sessionId = $derived(page.url.searchParams.get('sessionId') as any)
  const programId = $derived(page.params.programId as any)

  const program = useQuery(api.programs.getProgram, () => ({ programId }))
  const liveState = useQuery(api.course.sessionQueries.getLiveState, () =>
    sessionId ? { sessionId } : 'skip',
  )
</script>

<GradientBg variant="subtle">
  <div class="space-y-6">
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
      <h1 class="font-display text-3xl text-slate-950">{program.data?.name || 'Session runner'}</h1>
      <p class="mt-2 text-sm text-slate-600">Live facilitation controls and prompt response monitoring.</p>
    </section>

    {#if sessionId}
      {#if liveState.data?.status === 'running' || liveState.data?.status === 'completed'}
        <SessionRunner {sessionId} />
      {:else}
        <SessionSetup {sessionId} />
      {/if}
    {:else}
      <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">Choose a session first.</div>
    {/if}
  </div>
</GradientBg>
