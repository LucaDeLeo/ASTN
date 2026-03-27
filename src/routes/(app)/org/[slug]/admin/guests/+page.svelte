<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  const slug = $derived(page.params.slug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () => (slug ? { slug } : 'skip'))
  const membership = useQuery(api.orgs.membership.getMembership, () =>
    org.data ? { orgId: org.data._id } : 'skip',
  )
  const space = useQuery(api.coworkingSpaces.getSpaceByOrg, () =>
    org.data && membership.data?.role === 'admin' ? { orgId: org.data._id } : 'skip',
  )
  const pendingGuests = useQuery(api.guestBookings.getPendingGuestApplications, () =>
    space.data ? { spaceId: space.data._id } : 'skip',
  )
  const conversionStats = useQuery(api.spaceBookings.admin.getGuestConversionStats, () =>
    space.data ? { spaceId: space.data._id } : 'skip',
  )
</script>

<div class="space-y-6">
  <section class="rounded-[1.75rem] border border-border/70 bg-white/92 px-6 py-6 shadow-warm-sm">
    <h1 class="font-display text-3xl text-slate-950">Guest visits</h1>
    <p class="mt-2 text-sm text-slate-600">Pending guest applications and conversion stats.</p>
  </section>

  <div class="grid gap-6 xl:grid-cols-2">
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h2 class="text-lg font-semibold text-slate-950">Pending applications</h2>
      <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(pendingGuests.data ?? [], null, 2)}</pre>
    </section>
    <section class="rounded-[1.75rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
      <h2 class="text-lg font-semibold text-slate-950">Conversion stats</h2>
      <pre class="mt-4 overflow-x-auto rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">{JSON.stringify(conversionStats.data ?? {}, null, 2)}</pre>
    </section>
  </div>
</div>
