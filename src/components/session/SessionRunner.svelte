<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { api } from '$convex/_generated/api'
  import PromptResponseViewer from '~/components/course/PromptResponseViewer.svelte'
  import LiveTimer from '~/components/session/LiveTimer.svelte'
  import PairDisplay from '~/components/session/PairDisplay.svelte'
  import PresenceIndicator from '~/components/session/PresenceIndicator.svelte'

  let { sessionId }: { sessionId: Id<'programSessions'> } = $props()

  const convex = useConvexClient()
  const liveState = useQuery(api.course.sessionQueries.getLiveState, () => ({ sessionId }))
  const phases = useQuery(api.course.sessionQueries.getSessionPhases, () => ({ sessionId }))
  const phaseResults = useQuery(api.course.sessionQueries.getPhaseResults, () => ({ sessionId }))

  let mutating = $state(false)

  const currentPhase = $derived(
    phases.data?.find((phase) => phase._id === liveState.data?.currentPhaseId) ?? null,
  )
  const currentIndex = $derived(
    phases.data?.findIndex((phase) => phase._id === liveState.data?.currentPhaseId) ?? -1,
  )

  const runAction = async (action: () => Promise<unknown>) => {
    mutating = true
    try {
      await action()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      mutating = false
    }
  }
</script>

{#if liveState.data?.status === 'completed'}
  <section class="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 p-6 shadow-warm-sm">
    <h2 class="text-xl font-semibold text-emerald-900">Session complete</h2>
    <p class="mt-2 text-sm text-emerald-800">
      {phaseResults.data?.length ?? 0} phase result{phaseResults.data?.length === 1 ? '' : 's'} recorded.
    </p>
  </section>
{:else if liveState.data && currentPhase}
  <div class="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
    <div class="space-y-6">
      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-xs font-medium uppercase tracking-[0.18em] text-coral-700">
              Live session
            </p>
            <h2 class="mt-2 text-2xl font-semibold text-slate-950">{currentPhase.title}</h2>
            <p class="mt-2 text-sm text-slate-600">
              Phase {currentIndex + 1} of {phases.data?.length ?? 0}
            </p>
          </div>
          <LiveTimer
            startedAt={liveState.data.phaseStartedAt}
            durationMs={liveState.data.phaseDurationMs}
          />
        </div>

        {#if currentPhase.notes}
          <div class="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
            {currentPhase.notes}
          </div>
        {/if}

        <div class="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
            disabled={mutating}
            onclick={() =>
              runAction(() => convex.mutation(api.course.sessionRunner.advancePhase, { sessionId }))}
          >
            Next phase
          </button>
          <button
            type="button"
            class="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-accent disabled:opacity-60"
            disabled={mutating}
            onclick={() =>
              runAction(() =>
                convex.mutation(api.course.sessionRunner.extendPhase, {
                  sessionId,
                  additionalMs: 60_000,
                }),
              )}
          >
            +1 minute
          </button>
          <button
            type="button"
            class="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-accent disabled:opacity-60"
            disabled={mutating}
            onclick={() =>
              runAction(() => convex.mutation(api.course.sessionRunner.skipPhase, { sessionId }))}
          >
            Skip phase
          </button>
          <button
            type="button"
            class="rounded-full bg-rose-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-600 disabled:opacity-60"
            disabled={mutating}
            onclick={() =>
              runAction(() => convex.mutation(api.course.sessionRunner.endSession, { sessionId }))}
          >
            End session
          </button>
        </div>
      </section>

      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <h3 class="text-lg font-semibold text-slate-950">Presence</h3>
        <div class="mt-4">
          <PresenceIndicator {sessionId} />
        </div>
      </section>

      {#if liveState.data.activePromptIds.length}
        <section class="space-y-4">
          {#each liveState.data.activePromptIds as promptId (promptId)}
            <PromptResponseViewer {promptId} />
          {/each}
        </section>
      {/if}

      {#if liveState.data.currentPhaseId && currentPhase.pairConfig}
        <PairDisplay
          sessionId={sessionId}
          phaseId={liveState.data.currentPhaseId}
          strategy={currentPhase.pairConfig.strategy === 'manual'
            ? 'random'
            : currentPhase.pairConfig.strategy}
        />
      {/if}
    </div>

    <aside class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h3 class="text-lg font-semibold text-slate-950">Timeline</h3>
      <div class="mt-4 space-y-3">
        {#each phases.data ?? [] as phase (phase._id)}
          {@const result = phaseResults.data?.find((item) => item.phaseId === phase._id)}
          <div class={`rounded-2xl border px-4 py-3 ${
            phase._id === liveState.data.currentPhaseId
              ? 'border-coral-200 bg-coral-50/70'
              : result
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-border/70 bg-slate-50'
          }`}>
            <p class="font-medium text-slate-950">{phase.title}</p>
            <p class="mt-1 text-xs text-slate-600">
              {Math.round(phase.durationMs / 60000)} min
              {#if result}
                · ran {Math.round(result.actualDurationMs / 60000)} min
              {/if}
            </p>
          </div>
        {/each}
      </div>
    </aside>
  </div>
{:else}
  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <p class="text-sm text-slate-600">Waiting for live session state…</p>
  </section>
{/if}
