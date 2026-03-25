<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { formatDistanceToNow } from 'date-fns'

  const profiles = useQuery(api.platformAdmin.users.listAllProfiles)
</script>

<section class="space-y-6">
  <div>
    <h1 class="font-display text-3xl text-slate-950">Users</h1>
    <p class="mt-2 text-sm text-slate-600">{profiles.data?.length ?? 0} profiles on the platform.</p>
  </div>

  <div class="space-y-3">
    {#each profiles.data ?? [] as profile (profile._id)}
      <a href={`/admin/users/${profile.userId}`} class="block rounded-[1.5rem] border border-border/70 bg-white/92 px-5 py-4 shadow-warm-sm transition hover:-translate-y-0.5 hover:shadow-lg">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-950">{profile.name || 'Unnamed'}</h2>
            <p class="mt-1 text-sm text-slate-600">{profile.email || 'No email'} · {profile.location || 'No location'}</p>
            <p class="mt-1 text-xs text-slate-500">Created {formatDistanceToNow(profile.createdAt, { addSuffix: true })}</p>
          </div>
          <div class="text-right">
            <p class="text-xl font-semibold text-slate-950">{profile.completenessPercentage}%</p>
            <p class="text-xs text-slate-500">{profile.skillCount} skills</p>
          </div>
        </div>
      </a>
    {/each}
  </div>
</section>
