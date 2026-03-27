<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  const profile = useQuery(api.profiles.getOrCreateProfile)
  const completeness = useQuery(api.profiles.getMyCompleteness)
</script>

<section class="h-full overflow-y-auto rounded-[1.75rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm">
  <div class="mb-5">
    <p class="text-xs font-medium uppercase tracking-[0.18em] text-coral-700">
      Live Profile
    </p>
    <h2 class="mt-2 font-display text-2xl text-slate-950">
      {profile.data?.name || 'Your profile'}
    </h2>
    <p class="mt-2 text-sm text-slate-600">
      Completeness: {completeness.data?.percentage ?? 0}%
    </p>
  </div>

  <div class="space-y-4 text-sm text-slate-700">
    <div class="rounded-2xl bg-slate-50 p-4">
      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Headline</p>
      <p class="mt-2">{profile.data?.headline || 'No headline yet.'}</p>
    </div>

    <div class="rounded-2xl bg-slate-50 p-4">
      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Location</p>
      <p class="mt-2">{profile.data?.location || 'No location set.'}</p>
    </div>

    <div class="rounded-2xl bg-slate-50 p-4">
      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Skills</p>
      {#if profile.data?.skills?.length}
        <div class="mt-3 flex flex-wrap gap-2">
          {#each profile.data.skills as skill (skill)}
            <span class="rounded-full border border-border bg-white px-3 py-1 text-xs">
              {skill}
            </span>
          {/each}
        </div>
      {:else}
        <p class="mt-2">No skills added yet.</p>
      {/if}
    </div>

    <div class="rounded-2xl bg-slate-50 p-4">
      <p class="text-xs uppercase tracking-[0.16em] text-slate-500">Career goals</p>
      <p class="mt-2 whitespace-pre-wrap">
        {profile.data?.careerGoals || 'No career goals written yet.'}
      </p>
    </div>
  </div>
</section>
