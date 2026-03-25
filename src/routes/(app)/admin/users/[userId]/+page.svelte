<script lang="ts">
  import { page } from '$app/state'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  const convex = useConvexClient()
  const userId = $derived(page.params.userId ?? '')

  const profile = useQuery(api.platformAdmin.users.getProfileDetail, () => ({ userId }))
  const matches = useQuery(api.platformAdmin.users.getUserMatches, () =>
    profile.data ? { profileId: profile.data._id } : 'skip',
  )
  const agentMessages = useQuery(api.platformAdmin.users.getAgentMessages, () =>
    profile.data?.agentThreadId ? { threadId: profile.data.agentThreadId } : 'skip',
  )
  const toolCalls = useQuery(api.platformAdmin.users.getAgentToolCalls, () =>
    profile.data?.agentThreadId ? { threadId: profile.data.agentThreadId } : 'skip',
  )
  const enrichmentMessages = useQuery(api.platformAdmin.users.getEnrichmentMessages, () =>
    profile.data ? { profileId: profile.data._id } : 'skip',
  )

  const recomputeMatches = async () => {
    if (!profile.data?._id) return
    try {
      await convex.mutation(api.platformAdmin.users.recomputeMatches, {
        profileId: profile.data._id,
      })
      toast.success('Match recompute scheduled')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to recompute matches')
    }
  }
</script>

{#if profile.data}
  <section class="space-y-6">
    <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="font-display text-3xl text-slate-950">{profile.data.name || 'Unnamed user'}</h1>
          <p class="mt-2 text-sm text-slate-600">{profile.data.email || 'No email'} · {profile.data.location || 'No location'}</p>
          <p class="mt-2 text-sm text-slate-500">Completeness {profile.data.completeness.percentage}%</p>
        </div>
        <button type="button" class="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white" onclick={recomputeMatches}>
          Recompute matches
        </button>
      </div>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <h2 class="text-lg font-semibold text-slate-950">Profile</h2>
        <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(profile.data, null, 2)}</pre>
      </section>

      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <h2 class="text-lg font-semibold text-slate-950">Matches</h2>
        <div class="mt-4 space-y-3">
          {#each matches.data ?? [] as match (match._id)}
            <div class="rounded-2xl bg-slate-50 p-4">
              <div class="flex items-center gap-2">
                <p class="font-medium text-slate-950">{match.opportunity?.title}</p>
                <span class="rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-600">{match.tier}</span>
              </div>
              <p class="mt-2 text-sm text-slate-600">{match.opportunity?.organization}</p>
            </div>
          {/each}
        </div>
      </section>
    </div>

    <div class="grid gap-6 xl:grid-cols-2">
      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <h2 class="text-lg font-semibold text-slate-950">Agent messages</h2>
        <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(agentMessages.data ?? [], null, 2)}</pre>
      </section>
      <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
        <h2 class="text-lg font-semibold text-slate-950">Tool calls</h2>
        <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(toolCalls.data ?? [], null, 2)}</pre>
      </section>
    </div>

    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h2 class="text-lg font-semibold text-slate-950">Legacy enrichment</h2>
      <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(enrichmentMessages.data ?? [], null, 2)}</pre>
    </section>
  </section>
{:else if profile.isLoading}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">Loading user…</div>
{:else}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">User not found.</div>
{/if}
