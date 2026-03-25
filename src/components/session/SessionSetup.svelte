<script lang="ts">
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { api } from '$convex/_generated/api'

  let {
    sessionId,
  }: {
    sessionId: Id<'programSessions'>
  } = $props()

  const convex = useConvexClient()
  const phases = useQuery(api.course.sessionQueries.getSessionPhases, () => ({ sessionId }))

  let title = $state('')
  let durationMinutes = $state(20)
  let notes = $state('')
  let saving = $state(false)
  let starting = $state(false)

  const createPhase = async () => {
    if (!title.trim()) return

    saving = true
    try {
      await convex.mutation(api.course.sessionSetup.createPhase, {
        sessionId,
        title: title.trim(),
        durationMs: durationMinutes * 60_000,
        notes: notes.trim() || undefined,
      })
      title = ''
      notes = ''
      durationMinutes = 20
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create phase')
    } finally {
      saving = false
    }
  }

  const startSession = async () => {
    starting = true
    try {
      await convex.mutation(api.course.sessionRunner.startSession, { sessionId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to start session')
    } finally {
      starting = false
    }
  }
</script>

<section class="space-y-6">
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h2 class="text-xl font-semibold text-slate-950">Session setup</h2>
    <p class="mt-2 text-sm text-slate-600">
      Add phases and then start the live session when you are ready.
    </p>

    <div class="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
      <div>
        <label class="mb-2 block text-sm font-medium text-slate-700" for="phase-title">
          Phase title
        </label>
        <input
          id="phase-title"
          bind:value={title}
          class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
          placeholder="Opening check-in"
        />
      </div>
      <div>
        <label class="mb-2 block text-sm font-medium text-slate-700" for="phase-duration">
          Minutes
        </label>
        <input
          id="phase-duration"
          bind:value={durationMinutes}
          type="number"
          min="1"
          class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
        />
      </div>
    </div>

    <div class="mt-4">
      <label class="mb-2 block text-sm font-medium text-slate-700" for="phase-notes">
        Facilitator notes
      </label>
      <textarea
        id="phase-notes"
        bind:value={notes}
        rows="4"
        class="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-coral-400 focus:ring-2 focus:ring-coral-100"
        placeholder="What should facilitators watch for?"
      ></textarea>
    </div>

    <div class="mt-4 flex flex-wrap gap-3">
      <button
        type="button"
        class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
        disabled={saving || !title.trim()}
        onclick={createPhase}
      >
        Add phase
      </button>
      <button
        type="button"
        class="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600 disabled:opacity-60"
        disabled={starting || !(phases.data?.length)}
        onclick={startSession}
      >
        Start session
      </button>
    </div>
  </div>

  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
    <h3 class="text-lg font-semibold text-slate-950">Planned phases</h3>
    <div class="mt-4 space-y-3">
      {#if phases.data?.length}
        {#each phases.data as phase (phase._id)}
          <div class="rounded-2xl bg-slate-50 px-4 py-3">
            <div class="flex items-start justify-between gap-3">
              <div>
                <p class="font-medium text-slate-950">{phase.title}</p>
                {#if phase.notes}
                  <p class="mt-1 text-sm text-slate-600">{phase.notes}</p>
                {/if}
              </div>
              <span class="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {Math.round(phase.durationMs / 60000)} min
              </span>
            </div>
          </div>
        {/each}
      {:else}
        <p class="text-sm text-slate-500">No phases defined yet.</p>
      {/if}
    </div>
  </div>
</section>
