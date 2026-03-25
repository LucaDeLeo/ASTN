<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    ArrowLeft,
    CheckCircle2,
    ExternalLink,
    Info,
    LoaderCircle,
    UserPlus,
  } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import type { FormField } from '$convex/lib/formFields'
  import { validateResponses } from '$convex/lib/formFields'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { saveGuestApplicationEmail } from '$lib/pendingGuestApplication'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import DynamicFormRenderer from '~/components/opportunities/DynamicFormRenderer.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  const PROFILE_PREFILL_KEYS = [
    'firstName',
    'lastName',
    'email',
    'location',
    'profileUrl',
  ] as const

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)
  const opportunityId = $derived(page.params.opportunityId as Id<'orgOpportunities'> | undefined)

  const org = useQuery(api.orgs.directory.getOrgBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )

  const result = useQuery(api.orgOpportunities.getWithRedirect, () =>
    opportunityId
      ? {
          id: opportunityId,
        }
      : 'skip',
  )

  const opportunity = $derived(result.data?.opportunity ?? null)
  const isRedirect = $derived(result.data?.kind === 'redirect')
  const originalTitle = $derived(
    result.data?.kind === 'redirect' ? result.data.originalTitle : null,
  )

  const existingApplication = useQuery(
    api.opportunityApplications.getMyApplication,
    () =>
      clerkContext.currentUser && opportunity
        ? {
            opportunityId: opportunity._id,
          }
        : 'skip',
  )

  const profile = useQuery(
    api.profiles.getOrCreateProfile,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  let isSubmitting = $state(false)
  let submitted = $state(false)
  let submittedAsGuest = $state(false)
  let preFilled = $state(false)
  let responses = $state<Record<string, unknown>>({})

  const formFields = $derived((opportunity?.formFields ?? []) as Array<FormField>)
  const validationErrors = $derived(validateResponses(formFields, responses))
  const isValid = $derived(validationErrors.length === 0)
  const hasPreFilledData = $derived(
    Boolean(
      clerkContext.currentUser &&
        preFilled &&
        PROFILE_PREFILL_KEYS.some((key) => responses[key]),
    ),
  )

  $effect(() => {
    if (
      !clerkContext.currentUser ||
      !profile.data ||
      !formFields.length ||
      preFilled
    ) {
      return
    }

    const fullName =
      profile.data.name ??
      clerkContext.currentUser.fullName ??
      [clerkContext.currentUser.firstName, clerkContext.currentUser.lastName]
        .filter(Boolean)
        .join(' ')
    const nameParts = fullName.trim().split(/\s+/).filter(Boolean)
    const profileData: Record<(typeof PROFILE_PREFILL_KEYS)[number], string> = {
      firstName: nameParts[0] ?? '',
      lastName: nameParts.slice(1).join(' '),
      email: clerkContext.currentUser.primaryEmailAddress?.emailAddress ?? '',
      location: profile.data.location ?? '',
      profileUrl: profile.data.linkedinUrl ?? '',
    }

    const updates: Record<string, unknown> = {}
    for (const key of PROFILE_PREFILL_KEYS) {
      if (profileData[key] && !responses[key]) {
        updates[key] = profileData[key]
      }
    }

    if (Object.keys(updates).length > 0) {
      responses = { ...responses, ...updates }
    }

    preFilled = true
  })

  const handleChange = (key: string, value: unknown) => {
    responses = { ...responses, [key]: value }
  }

  const handleSubmit = async () => {
    if (!opportunity || !slug || !isValid || isSubmitting) {
      return
    }

    isSubmitting = true
    let isGuest = false

    try {
      if (clerkContext.currentUser) {
        await convex.mutation(api.opportunityApplications.submit, {
          opportunityId: opportunity._id,
          responses,
        })
        submitted = true
      } else {
        const email =
          typeof responses.email === 'string' ? responses.email.trim().toLowerCase() : ''
        if (!email) {
          return
        }

        await convex.mutation(api.opportunityApplications.submitGuest, {
          opportunityId: opportunity._id,
          guestEmail: email,
          responses,
        })
        submitted = true
        submittedAsGuest = true
        isGuest = true
      }

      posthogStore.capture('opportunity_application_submitted', {
        opportunity_id: opportunity._id,
        opportunity_title: opportunity.title,
        org_slug: slug,
        org_name: org.data?.name,
        is_guest: isGuest,
        is_redirect: isRedirect,
        ...(isRedirect ? { original_opportunity_id: opportunityId } : {}),
      })
    } finally {
      isSubmitting = false
    }
  }

  const pageTitle = $derived.by(() => {
    const orgName = org.data?.name ?? 'Organization'
    if (!opportunity) {
      return `Apply | ${orgName} | ASTN`
    }

    return isRedirect
      ? `Express Interest | ${opportunity.title} | ${orgName} | ASTN`
      : `${opportunity.title} | Apply at ${orgName} | ASTN`
  })
</script>

<svelte:head>
  <title>{pageTitle}</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if org.isLoading || result.isLoading}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if !org.data || !opportunity || !slug}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <h1 class="font-display text-3xl text-slate-950">Opportunity not found</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This opportunity doesn’t exist or is no longer available.
        </p>
        <a
          href={slug ? `/org/${slug}` : '/'}
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Back to organization
        </a>
      </div>
    {:else if existingApplication.data || (submitted && !submittedAsGuest)}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">
          {isRedirect ? 'Expression of Interest Submitted' : 'Application Submitted'}
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          {#if isRedirect}
            You’ll be notified about future cohorts for <strong>{originalTitle}</strong>.
          {:else}
            Your application for <strong>{opportunity.title}</strong> has been submitted.
          {/if}
        </p>
        <a
          href={`/org/${slug}`}
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          Back to {org.data.name}
        </a>
      </div>
    {:else if submittedAsGuest}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-green-50 text-green-600">
          <CheckCircle2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Application Submitted</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Sign up with the same email to track your application and join {org.data.name}.
        </p>
        <div class="mt-6 flex flex-col gap-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
            onclick={async () => {
              const guestEmail =
                typeof responses.email === 'string' ? responses.email.trim().toLowerCase() : ''
              if (guestEmail) {
                saveGuestApplicationEmail(guestEmail)
              }
              await goto('/login')
            }}
          >
            <UserPlus class="size-4" />
            Create account
          </button>
          <a
            href={`/org/${slug}`}
            class="inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to {org.data.name}
          </a>
        </div>
      </div>
    {:else if formFields.length === 0}
      <div class="mx-auto max-w-lg rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <h1 class="font-display text-3xl text-slate-950">Application form unavailable</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This opportunity does not have a form configured yet.
        </p>
      </div>
    {:else}
      <div class="mx-auto max-w-3xl space-y-6">
        <a
          href={`/org/${slug}`}
          class="inline-flex items-center gap-1 text-sm text-slate-500 transition hover:text-slate-900"
        >
          <ArrowLeft class="size-4" />
          Back to {org.data.name}
        </a>

        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-6 shadow-warm-sm">
          <h1 class="font-display text-3xl text-slate-950">{opportunity.title}</h1>
          {#if opportunity.description}
            <p class="mt-3 text-sm leading-6 text-slate-600">{opportunity.description}</p>
          {/if}
          {#if opportunity.externalUrl}
            <a
              href={opportunity.externalUrl}
              target="_blank"
              rel="noreferrer"
              class="mt-3 inline-flex items-center gap-1 text-sm font-medium text-coral-700 transition hover:text-coral-800"
            >
              Learn more
              <ExternalLink class="size-3" />
            </a>
          {/if}
        </section>

        {#if isRedirect}
          <div class="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
            Applications for <strong>{originalTitle}</strong> have closed. Submit your
            interest below to hear about future cohorts.
          </div>
        {/if}

        {#if hasPreFilledData}
          <div class="flex items-start gap-2 rounded-[1.5rem] border border-blue-200 bg-blue-50 px-5 py-4 text-sm text-blue-800">
            <Info class="mt-0.5 size-4 shrink-0" />
            <span>Some fields were pre-filled from your ASTN profile. Review and edit as needed.</span>
          </div>
        {/if}

        {#if validationErrors.length > 0}
          <div class="rounded-[1.5rem] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
            <p class="font-medium">Complete the required fields before submitting.</p>
            <ul class="mt-2 list-disc pl-5">
              {#each validationErrors as error}
                <li>{error}</li>
              {/each}
            </ul>
          </div>
        {/if}

        <DynamicFormRenderer
          {formFields}
          {responses}
          onChange={handleChange}
        />

        <div class="flex items-center justify-between pb-8">
          <a
            href={`/org/${slug}`}
            class="inline-flex rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </a>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600 disabled:pointer-events-none disabled:opacity-50"
            disabled={!isValid || isSubmitting}
            onclick={() => {
              void handleSubmit()
            }}
          >
            {#if isSubmitting}
              <LoaderCircle class="size-4 animate-spin" />
              Submitting...
            {:else if isRedirect}
              Submit expression of interest
            {:else}
              Submit application
            {/if}
          </button>
        </div>
      </div>
    {/if}
  </main>
</GradientBg>
