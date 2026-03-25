<script lang="ts">
  import type { Id } from '$convex/_generated/dataModel'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  let { sessionId }: { sessionId: Id<'programSessions'> } = $props()

  const presence = useQuery(api.course.sessionQueries.getPresence, () => ({ sessionId }))

  const statusCounts = $derived.by(() => {
    const counts = {
      typing: 0,
      idle: 0,
      submitted: 0,
    }

    for (const item of presence.data ?? []) {
      counts[item.status] += 1
    }

    return counts
  })
</script>

<div class="grid gap-3 sm:grid-cols-3">
  <div class="rounded-2xl bg-slate-50 px-4 py-3">
    <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Typing</p>
    <p class="mt-2 text-lg font-semibold text-slate-950">{statusCounts.typing}</p>
  </div>
  <div class="rounded-2xl bg-slate-50 px-4 py-3">
    <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Idle</p>
    <p class="mt-2 text-lg font-semibold text-slate-950">{statusCounts.idle}</p>
  </div>
  <div class="rounded-2xl bg-slate-50 px-4 py-3">
    <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Submitted</p>
    <p class="mt-2 text-lg font-semibold text-slate-950">{statusCounts.submitted}</p>
  </div>
</div>
