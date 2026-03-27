<script lang="ts">
  import { page } from '$app/state'
  import { useQuery } from 'convex-svelte'
  import { Building2, LoaderCircle, MapPin, UserPlus } from 'lucide-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import GuestSignupForm from '~/components/guest/GuestSignupForm.svelte'
  import VisitApplicationForm from '~/components/guest/VisitApplicationForm.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  const clerkContext = getClerkContext()
  const slug = $derived(page.params.slug ?? null)
  const spaceInfo = useQuery(api.coworkingSpaces.getSpaceBySlug, () =>
    slug
      ? {
          slug,
        }
      : 'skip',
  )
</script>

<svelte:head>
  <title>Visit Space | ASTN</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if spaceInfo.isLoading || !clerkContext.isClerkLoaded}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if !spaceInfo.data}
      <div class="mx-auto max-w-md rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <MapPin class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Space not available</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          This organization doesn’t have guest access enabled or the space
          doesn’t exist.
        </p>
      </div>
    {:else if !clerkContext.currentUser}
      <div class="mx-auto max-w-5xl grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
          <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-coral-50 text-coral-600">
            <Building2 class="size-8" />
          </div>
          <h1 class="font-display text-3xl text-slate-950">
            Visit {spaceInfo.data.orgName}
          </h1>
          <p class="mt-3 flex items-center justify-center gap-2 text-sm text-slate-600">
            <MapPin class="size-4" />
            {spaceInfo.data.spaceName}
          </p>
          <div class="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-4 text-left text-sm leading-6 text-slate-600">
            <div class="mb-2 flex items-center gap-2 font-medium text-slate-800">
              <UserPlus class="size-4 text-coral-600" />
              Sign in to apply
            </div>
            Create an account or sign in to submit your visit application. We’ll
            notify you when your application is reviewed.
          </div>
        </section>

        <section class="rounded-[2rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm">
          <GuestSignupForm />
        </section>
      </div>
    {:else}
      <VisitApplicationForm spaceInfo={spaceInfo.data} />
    {/if}
  </main>
</GradientBg>
