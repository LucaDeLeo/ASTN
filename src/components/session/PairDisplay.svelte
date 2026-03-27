<script lang="ts">
  import type { Id } from '$convex/_generated/dataModel'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'

  let {
    sessionId,
    phaseId,
    strategy = 'random',
  }: {
    sessionId: Id<'programSessions'>
    phaseId: Id<'sessionPhases'>
    strategy?: 'random' | 'complementary'
  } = $props()

  const convex = useConvexClient()
  const assignments = useQuery(
    api.course.sessionQueries.getPairAssignments,
    () => ({ sessionId, phaseId }),
  )

  const generatePairs = async () => {
    try {
      await convex.mutation(api.course.sessionPairing.generatePairs, {
        sessionId,
        phaseId,
        strategy,
      })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate pairs')
    }
  }

  const latestAssignment = $derived(
    [...(assignments.data ?? [])].sort((a, b) => b.createdAt - a.createdAt)[0] ?? null,
  )
</script>

<section class="rounded-[1.5rem] border border-border/70 bg-white p-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h4 class="font-medium text-slate-950">Pair assignments</h4>
      <p class="mt-1 text-sm text-slate-600">
        Generate or review conversation pairs for this phase.
      </p>
    </div>
    <button
      type="button"
      class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      onclick={generatePairs}
    >
      Generate pairs
    </button>
  </div>

  {#if latestAssignment?.pairs?.length}
    <div class="mt-4 space-y-2">
      {#each latestAssignment.pairs as pair, index (`${phaseId}-${index}`)}
        <div class="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <span class="font-medium text-slate-900">Pair {index + 1}:</span>
          {pair.members.join(', ')}
        </div>
      {/each}
    </div>
  {:else}
    <p class="mt-4 text-sm text-slate-500">No pairs generated yet.</p>
  {/if}
</section>
