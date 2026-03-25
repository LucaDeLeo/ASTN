<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import {
    Building2,
    Calendar,
    CheckCircle2,
    ExternalLink,
    GraduationCap,
    MapPin,
    UserPlus,
    Users,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import MemberDirectory from '~/components/public-org/member-directory.svelte'

  const clerkContext = getClerkContext()
  const slug = $derived(page.params.slug ?? null)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const memberCount = useQuery(api.orgs.directory.getMemberCount, () =>
    org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const featured = useQuery(api.orgOpportunities.getFeatured, () =>
    org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const membership = useQuery(api.orgs.membership.getMembership, () =>
    clerkContext.currentUser && org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const myPrograms = useQuery(api.programs.getMyPrograms, () =>
    clerkContext.currentUser && org.data
      ? {
          orgId: org.data._id,
        }
      : 'skip',
  )

  const myApplication = useQuery(api.opportunityApplications.getMyApplication, () =>
    clerkContext.currentUser && featured.data
      ? {
          opportunityId: featured.data._id,
        }
      : 'skip',
  )

  const memberCountLabel = $derived.by(() => {
    if (memberCount.data === undefined) return 'Loading member count...'
    return `${memberCount.data} member${memberCount.data === 1 ? '' : 's'}`
  })
</script>

<svelte:head>
  <title>{org.data ? `${org.data.name} | ASTN` : 'Organization | ASTN'}</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if org.isLoading}
      <div class="mx-auto max-w-5xl space-y-6">
        <div class="h-28 animate-pulse rounded-[2rem] bg-slate-100"></div>
        <div class="h-40 animate-pulse rounded-[2rem] bg-slate-100"></div>
        <div class="h-72 animate-pulse rounded-[2rem] bg-slate-100"></div>
      </div>
    {:else if !org.data}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Organization not found</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This organization doesn’t exist or the link is incorrect.
        </p>
        <a
          href="/orgs"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Browse organizations
        </a>
      </div>
    {:else}
      <div class="mx-auto max-w-5xl space-y-6">
        <section class="overflow-hidden rounded-[2rem] border border-border/70 bg-white/92 shadow-warm-sm">
          <div class="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
            <div class="p-6 md:p-8">
              <div class="flex items-start gap-4">
                {#if org.data.logoUrl}
                  <img
                    src={org.data.logoUrl}
                    alt={org.data.name}
                    class="size-16 rounded-2xl object-cover md:size-20"
                  />
                {:else}
                  <div class="flex size-16 items-center justify-center rounded-2xl bg-coral-50 text-coral-600 md:size-20">
                    <Building2 class="size-8 md:size-10" />
                  </div>
                {/if}

                <div class="min-w-0">
                  <p class="text-sm font-medium uppercase tracking-[0.24em] text-coral-600">
                    Organization page
                  </p>
                  <h1 class="mt-2 font-display text-3xl text-slate-950 md:text-4xl">
                    {org.data.name}
                  </h1>
                  <div class="mt-3 flex items-center gap-2 text-sm text-slate-500">
                    <Users class="size-4 shrink-0" />
                    <span>{memberCountLabel}</span>
                  </div>
                </div>
              </div>

              <div class="mt-6 flex flex-wrap gap-3">
                {#if org.data.hasCoworkingSpace}
                  <a
                    href={`/org/${page.params.slug}/space`}
                    class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <MapPin class="size-4" />
                    Space
                  </a>
                {/if}

                {#if org.data.lumaCalendarUrl}
                  <a
                    href={`/org/${page.params.slug}/events`}
                    class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Calendar class="size-4" />
                    Events
                  </a>
                {/if}

                {#if clerkContext.currentUser && (myPrograms.data?.length ?? 0) > 0}
                  <a
                    href={`/org/${page.params.slug}/programs`}
                    class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <GraduationCap class="size-4" />
                    Programs
                  </a>
                {/if}

                {#if clerkContext.currentUser}
                  {#if membership.isLoading}
                    <div class="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm text-slate-500">
                      Checking membership...
                    </div>
                  {:else if membership.data}
                    <div class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                      <CheckCircle2 class="size-4" />
                      Member
                    </div>
                  {:else}
                    <a
                      href={`/org/${page.params.slug}/join`}
                      class="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600"
                    >
                      <UserPlus class="size-4" />
                      Join
                    </a>
                  {/if}
                {:else}
                  <a
                    href={`/org/${page.params.slug}/join`}
                    class="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600"
                  >
                    <UserPlus class="size-4" />
                    Join
                  </a>
                {/if}
              </div>
            </div>

            <div class="border-t border-border/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.96),rgba(255,255,255,0.82))] p-6 lg:border-l lg:border-t-0 md:p-8">
              <p class="text-sm font-medium text-slate-800">What you can do here</p>
              <div class="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                <div class="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  Browse the public member directory and see who is active in the
                  community.
                </div>
                <div class="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                  Check upcoming events and, if you’re a member, access your
                  current programs.
                </div>
                {#if org.data.hasCoworkingSpace}
                  <div class="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                    Explore the co-working space and request a visit or booking.
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </section>

        {#if featured.data}
          <section class="overflow-hidden rounded-[2rem] border border-coral-200 bg-[linear-gradient(135deg,rgba(255,247,237,0.92),rgba(255,255,255,0.96))] shadow-warm-sm">
            <div class="p-6 md:p-7">
              <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div class="min-w-0">
                  <div class="mb-2 inline-flex rounded-full border border-coral-200 bg-white/80 px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em] text-coral-700">
                    Featured opportunity
                  </div>
                  <h2 class="text-xl font-semibold text-slate-950">
                    {featured.data.title}
                  </h2>
                  {#if featured.data.description}
                    <p class="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                      {featured.data.description}
                    </p>
                  {/if}
                </div>

                {#if myApplication.data}
                  <div class="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                    <CheckCircle2 class="size-4" />
                    Application submitted
                  </div>
                {/if}
              </div>

              {#if featured.data.externalUrl}
                <a
                  href={featured.data.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  class="mt-5 inline-flex items-center gap-2 text-sm font-medium text-slate-700 transition hover:text-slate-950"
                >
                  Learn more
                  <ExternalLink class="size-4" />
                </a>
              {/if}
            </div>
          </section>
        {/if}

        <section class="space-y-4">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-sm font-medium uppercase tracking-[0.2em] text-coral-600">
                Member directory
              </p>
              <h2 class="mt-1 font-display text-3xl text-slate-950">
                People in {org.data.name}
              </h2>
            </div>
          </div>

          <MemberDirectory orgId={org.data._id} />
        </section>
      </div>
    {/if}
  </main>
</GradientBg>
