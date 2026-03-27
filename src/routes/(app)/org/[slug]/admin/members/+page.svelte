<script lang="ts">
  import { page } from '$app/state'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { Search, Shield, Trash2, UserCog, UserRound } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import AdminSection from '~/components/org-admin/core/AdminSection.svelte'

  type MemberRecord = NonNullable<
    ReturnType<typeof useQuery<typeof api.orgs.admin.getAllMembersWithProfiles>>['data']
  >[number]

  type EngagementRecord = NonNullable<
    ReturnType<typeof useQuery<typeof api.engagement.queries.getOrgEngagementForAdmin>>['data']
  >[number]

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  let search = $state('')
  let roleFilter = $state<'all' | 'admin' | 'member'>('all')
  let locationFilter = $state('all')
  let engagementFilter = $state('all')
  let pageNumber = $state(1)

  const pageSize = 25

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const members = useQuery(api.orgs.admin.getAllMembersWithProfiles, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const engagement = useQuery(api.engagement.queries.getOrgEngagementForAdmin, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const adminState = $derived.by(() => {
    if (org.isLoading || membership.isLoading) return 'loading'
    if (!org.data) return 'missing'
    if (membership.data?.role !== 'admin') return 'forbidden'
    return 'ready'
  })

  const engagementMap = $derived.by(() => {
    const map = new Map<string, EngagementRecord>()
    for (const item of engagement.data ?? []) {
      map.set(item.userId, item)
    }
    return map
  })

  const availableLocations = $derived.by(() =>
    Array.from(
      new Set(
        (members.data ?? [])
          .map((member) => member.profile?.location?.trim())
          .filter((value): value is string => Boolean(value)),
      ),
    ).sort(),
  )

  const filteredMembers = $derived.by(() => {
    const query = search.trim().toLowerCase()

    return (members.data ?? []).filter((member) => {
      const name = member.profile?.name?.toLowerCase() ?? ''
      const email = member.email?.toLowerCase() ?? ''
      const location = member.profile?.location ?? ''
      const engagementLevel =
        engagementMap.get(member.membership.userId)?.level ?? 'pending'

      if (query && !name.includes(query) && !email.includes(query)) {
        return false
      }

      if (roleFilter !== 'all' && member.membership.role !== roleFilter) {
        return false
      }

      if (locationFilter !== 'all' && location !== locationFilter) {
        return false
      }

      if (engagementFilter !== 'all' && engagementLevel !== engagementFilter) {
        return false
      }

      return true
    })
  })

  const totalPages = $derived(Math.max(1, Math.ceil(filteredMembers.length / pageSize)))

  const paginatedMembers = $derived.by(() => {
    const start = (pageNumber - 1) * pageSize
    return filteredMembers.slice(start, start + pageSize)
  })

  $effect(() => {
    if (pageNumber > totalPages) {
      pageNumber = totalPages
    }
  })

  const mutateMember = async (
    action: 'promote' | 'demote' | 'remove',
    memberRecord: MemberRecord,
  ) => {
    if (!org.data) return

    try {
      if (action === 'remove') {
        const confirmed = window.confirm(
          `Remove ${memberRecord.profile?.name ?? 'this member'} from ${org.data.name}?`,
        )

        if (!confirmed) return

        await convex.mutation(api.orgs.admin.removeMember, {
          orgId: org.data._id,
          membershipId: memberRecord.membership._id,
        })
        toast.success('Member removed')
        return
      }

      if (action === 'promote') {
        await convex.mutation(api.orgs.admin.promoteToAdmin, {
          orgId: org.data._id,
          membershipId: memberRecord.membership._id,
        })
        toast.success('Member promoted to admin')
        return
      }

      await convex.mutation(api.orgs.admin.demoteToMember, {
        orgId: org.data._id,
        membershipId: memberRecord.membership._id,
      })
      toast.success('Admin demoted to member')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update member')
    }
  }

  const formatEngagement = (value: string | null | undefined) =>
    (value ?? 'pending').replaceAll('_', ' ')

  const isCurrentUserMembership = (membershipId: Id<'orgMemberships'>) =>
    membership.data?._id === membershipId
</script>

{#if adminState === 'loading'}
  <div class="space-y-6">
    <div class="h-28 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
    <div class="h-96 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
  </div>
{:else if adminState === 'missing'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
  </div>
{:else if adminState === 'forbidden'}
  <div class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-10 text-center shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Admin access required</h1>
  </div>
{:else}
  <div class="space-y-6">
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">Members</p>
      <h1 class="mt-2 font-display text-3xl text-slate-950">Member directory</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Review organization membership, audit profile quality, and adjust roles in one place.
      </p>
    </section>

    <AdminSection
      title="Filters"
      subtitle={`${filteredMembers.length} member${filteredMembers.length === 1 ? '' : 's'} match the current view.`}
    >
      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Search</span>
          <div class="relative">
            <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              class="w-full rounded-2xl border border-border bg-white px-10 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
              bind:value={search}
              placeholder="Search name or email"
            />
          </div>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Role</span>
          <select
            class="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
            bind:value={roleFilter}
          >
            <option value="all">All roles</option>
            <option value="admin">Admins</option>
            <option value="member">Members</option>
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Location</span>
          <select
            class="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
            bind:value={locationFilter}
          >
            <option value="all">All locations</option>
            {#each availableLocations as location}
              <option value={location}>{location}</option>
            {/each}
          </select>
        </label>

        <label class="space-y-2">
          <span class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Engagement</span>
          <select
            class="w-full rounded-2xl border border-border bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
            bind:value={engagementFilter}
          >
            <option value="all">All levels</option>
            <option value="highly_engaged">Highly engaged</option>
            <option value="moderate">Moderate</option>
            <option value="at_risk">At risk</option>
            <option value="new">New</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </label>
      </div>
    </AdminSection>

    <AdminSection
      title="Roster"
      subtitle="Use the member detail page for full profile, attendance, and engagement history."
    >
      {#if members.isLoading}
        <p class="text-sm text-slate-500">Loading members…</p>
      {:else if !filteredMembers.length}
        <p class="text-sm text-slate-500">No members matched the current filters.</p>
      {:else}
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-border">
            <thead>
              <tr class="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                <th class="pb-3 pr-4 font-semibold">Member</th>
                <th class="pb-3 pr-4 font-semibold">Role</th>
                <th class="pb-3 pr-4 font-semibold">Engagement</th>
                <th class="pb-3 pr-4 font-semibold">Completeness</th>
                <th class="pb-3 pr-4 font-semibold">Joined</th>
                <th class="pb-3 pr-4 font-semibold">Profile</th>
                <th class="pb-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              {#each paginatedMembers as member}
                {@const memberEngagement = engagementMap.get(member.membership.userId)}
                {@const selfMembership = isCurrentUserMembership(member.membership._id)}
                <tr class="align-top">
                  <td class="py-4 pr-4">
                    <div>
                      <p class="font-medium text-slate-950">{member.profile?.name ?? 'Unnamed member'}</p>
                      <p class="mt-1 text-sm text-slate-500">{member.email ?? 'No email on file'}</p>
                      {#if member.profile?.location}
                        <p class="mt-1 text-sm text-slate-500">{member.profile.location}</p>
                      {/if}
                    </div>
                  </td>
                  <td class="py-4 pr-4">
                    <span class={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      member.membership.role === 'admin'
                        ? 'bg-slate-950 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {member.membership.role}
                    </span>
                  </td>
                  <td class="py-4 pr-4">
                    <div class="space-y-1">
                      <span class="inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-slate-700">
                        {formatEngagement(memberEngagement?.level)}
                      </span>
                      {#if memberEngagement?.hasOverride}
                        <p class="text-xs text-amber-700">Manual override active</p>
                      {/if}
                    </div>
                  </td>
                  <td class="py-4 pr-4">
                    <div class="w-24">
                      <div class="mb-1 flex items-center justify-between text-xs text-slate-500">
                        <span>{member.completeness}%</span>
                      </div>
                      <div class="h-2 rounded-full bg-slate-200">
                        <div
                          class={`h-2 rounded-full ${
                            member.completeness >= 80
                              ? 'bg-emerald-500'
                              : member.completeness >= 40
                                ? 'bg-amber-500'
                                : 'bg-slate-500'
                          }`}
                          style={`width:${member.completeness}%`}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 pr-4 text-sm text-slate-600">
                    {new Date(member.membership.joinedAt).toLocaleDateString()}
                  </td>
                  <td class="py-4 pr-4">
                    <a
                      href={`/org/${slug}/admin/members/${member.membership.userId}`}
                      class="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                    >
                      <UserRound class="size-4" />
                      View
                    </a>
                  </td>
                  <td class="py-4 text-right">
                    <div class="flex flex-wrap justify-end gap-2">
                      {#if member.membership.role === 'admin'}
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          onclick={() => mutateMember('demote', member)}
                          disabled={selfMembership}
                        >
                          <Shield class="size-4" />
                          Demote
                        </button>
                      {:else}
                        <button
                          type="button"
                          class="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                          onclick={() => mutateMember('promote', member)}
                        >
                          <UserCog class="size-4" />
                          Promote
                        </button>
                      {/if}

                      <button
                        type="button"
                        class="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                        onclick={() => mutateMember('remove', member)}
                        disabled={selfMembership}
                      >
                        <Trash2 class="size-4" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        {#if totalPages > 1}
          <div class="mt-5 flex flex-col gap-3 border-t border-border pt-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <span>
              Showing {(pageNumber - 1) * pageSize + 1}–{Math.min(pageNumber * pageSize, filteredMembers.length)} of {filteredMembers.length}
            </span>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-xl border border-border px-3 py-2 transition hover:bg-slate-50 disabled:opacity-60"
                onclick={() => {
                  pageNumber = Math.max(1, pageNumber - 1)
                }}
                disabled={pageNumber === 1}
              >
                Previous
              </button>
              <button
                type="button"
                class="rounded-xl border border-border px-3 py-2 transition hover:bg-slate-50 disabled:opacity-60"
                onclick={() => {
                  pageNumber = Math.min(totalPages, pageNumber + 1)
                }}
                disabled={pageNumber === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </AdminSection>
  </div>
{/if}
