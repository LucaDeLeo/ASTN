<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import { MapPin, Shield, Users } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'

  let { orgId }: { orgId: Id<'organizations'> } = $props()

  const members = useQuery(api.orgs.directory.getVisibleMembers, () => ({
    orgId,
  }))
</script>

{#if members.isLoading}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each Array.from({ length: 3 }) as _, index (`loading-${index}`)}
      <div class="rounded-[1.5rem] border border-border/70 bg-white/88 p-4 shadow-warm-sm">
        <div class="mb-2 h-6 w-3/4 animate-pulse rounded bg-slate-100"></div>
        <div class="mb-4 h-4 w-1/2 animate-pulse rounded bg-slate-100"></div>
        <div class="flex gap-2">
          <div class="h-5 w-16 animate-pulse rounded-full bg-slate-100"></div>
          <div class="h-5 w-16 animate-pulse rounded-full bg-slate-100"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if !members.data?.length}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/88 px-6 py-10 text-center shadow-warm-sm">
    <div class="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <Users class="size-7" />
    </div>
    <h2 class="font-display text-2xl text-slate-950">No visible members yet</h2>
    <p class="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
      Members can choose whether to appear in the organization directory when
      they join.
    </p>
  </div>
{:else}
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {#each members.data as member (member.membershipId)}
      <article class="rounded-[1.5rem] border border-border/70 bg-white/92 p-5 shadow-warm-sm transition hover:-translate-y-0.5 hover:shadow-warm-md">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-slate-950">
              {member.profile.name}
            </h3>
            {#if member.profile.headline}
              <p class="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
                {member.profile.headline}
              </p>
            {/if}
          </div>

          {#if member.role === 'admin'}
            <span class="inline-flex shrink-0 items-center gap-1 rounded-full border border-coral-200 bg-coral-50 px-2.5 py-1 text-xs font-medium text-coral-700">
              <Shield class="size-3.5" />
              Admin
            </span>
          {/if}
        </div>

        {#if member.profile.location}
          <div class="mt-3 flex items-center gap-1.5 text-sm text-slate-500">
            <MapPin class="size-3.5 shrink-0" />
            <span class="truncate">{member.profile.location}</span>
          </div>
        {/if}

        {#if member.profile.skills.length > 0}
          <div class="mt-4 flex flex-wrap gap-2">
            {#each member.profile.skills as skill (skill)}
              <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
                {skill}
              </span>
            {/each}
          </div>
        {/if}
      </article>
    {/each}
  </div>
{/if}
