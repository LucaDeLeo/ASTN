<script lang="ts">
  import { page } from '$app/state'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { CalendarDays, CheckCircle2, Link2 } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import AdminSection from '~/components/org-admin/core/AdminSection.svelte'

  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  let lumaCalendarUrl = $state('')
  let initialized = $state(false)
  let saving = $state(false)
  let resolved = $state(false)

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

  const lumaConfig = useQuery(api.orgs.admin.getLumaConfig, () =>
    org.data && membership.data?.role === 'admin'
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  $effect(() => {
    if (lumaConfig.data && !initialized) {
      lumaCalendarUrl = lumaConfig.data.lumaCalendarUrl ?? ''
      resolved = Boolean(lumaConfig.data.lumaCalendarApiId)
      initialized = true
    }
  })

  const adminState = $derived.by(() => {
    if (org.isLoading || membership.isLoading) return 'loading'
    if (!org.data) return 'missing'
    if (membership.data?.role !== 'admin') return 'forbidden'
    return 'ready'
  })

  const saveSettings = async () => {
    if (!org.data) return

    try {
      saving = true
      const trimmed = lumaCalendarUrl.trim()
      let lumaCalendarApiId: string | undefined

      if (trimmed) {
        lumaCalendarApiId = await convex.action(api.events.sync.resolveLumaCalendar, {
          calendarUrl: trimmed,
        })
      }

      await convex.mutation(api.orgs.admin.updateLumaConfig, {
        orgId: org.data._id,
        lumaCalendarUrl: trimmed || undefined,
        lumaCalendarApiId,
      })

      resolved = Boolean(lumaCalendarApiId)
      toast.success('Settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      saving = false
    }
  }
</script>

{#if adminState === 'loading'}
  <div class="space-y-6">
    <div class="h-28 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
    <div class="h-80 animate-pulse rounded-[1.75rem] bg-slate-100"></div>
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
      <p class="text-xs font-semibold uppercase tracking-[0.22em] text-coral-600">Settings</p>
      <h1 class="mt-2 font-display text-3xl text-slate-950">Integrations</h1>
      <p class="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        Connect external systems that feed the public org page and member dashboard.
      </p>
    </section>

    <AdminSection
      title="Lu.ma events integration"
      subtitle="Resolve your Lu.ma calendar once, then ASTN can sync org events automatically."
    >
      {#snippet actions()}
        <button
          type="button"
          class="rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:opacity-60"
          onclick={saveSettings}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      {/snippet}
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div class="space-y-3">
          <label class="space-y-2">
            <span class="text-sm font-medium text-slate-900">Lu.ma calendar URL</span>
            <div class="relative">
              <Link2 class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                class="w-full rounded-2xl border border-border bg-white px-10 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                bind:value={lumaCalendarUrl}
                placeholder="https://lu.ma/your-calendar"
                type="url"
                oninput={() => {
                  resolved = false
                }}
              />
            </div>
          </label>

          <p class="text-sm leading-6 text-slate-600">
            This should be the public Lu.ma calendar URL for the organization. On save,
            ASTN resolves the calendar API identifier and stores it for future syncs.
          </p>
        </div>

        <div class="rounded-[1.5rem] border border-border bg-slate-50 p-5">
          <div class="flex items-center gap-3">
            <div class={`flex size-11 items-center justify-center rounded-2xl ${
              resolved ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {#if resolved}
                <CheckCircle2 class="size-5" />
              {:else}
                <CalendarDays class="size-5" />
              {/if}
            </div>
            <div>
              <p class="text-sm font-medium text-slate-900">
                {resolved ? 'Calendar connected' : 'Awaiting connection'}
              </p>
              <p class="mt-1 text-sm text-slate-600">
                {#if resolved}
                  Events can now sync into the org page and dashboard.
                {:else}
                  Save a valid Lu.ma URL to connect the feed.
                {/if}
              </p>
            </div>
          </div>

          {#if lumaConfig.data?.eventsLastSynced}
            <p class="mt-5 text-xs uppercase tracking-[0.18em] text-slate-500">
              Last synced {new Date(lumaConfig.data.eventsLastSynced).toLocaleString()}
            </p>
          {/if}
        </div>
      </div>
    </AdminSection>
  </div>
{/if}
