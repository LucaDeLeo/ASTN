<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/state'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import {
    Building2,
    Eye,
    EyeOff,
    Link2Off,
    LoaderCircle,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { savePendingInvite } from '$lib/pendingInvite'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'

  type Visibility = 'visible' | 'hidden'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const slug = $derived(page.params.slug ?? null)

  const token = $derived(page.url.searchParams.get('token') ?? '')

  const validation = useQuery(api.orgs.directory.validateInviteToken, () =>
    token
      ? {
          token,
        }
      : 'skip',
  )

  const orgBySlug = useQuery(api.orgs.directory.getOrgBySlug, () =>
    token || !slug
      ? 'skip'
      : {
          slug,
        },
  )

  const activeOrg = $derived.by(() => {
    if (token) {
      return validation.data?.valid
        ? {
            orgId: validation.data.orgId,
            orgName: validation.data.orgName,
            orgSlug: validation.data.orgSlug,
          }
        : null
    }

    return orgBySlug.data
      ? {
          orgId: orgBySlug.data._id,
          orgName: orgBySlug.data.name,
          orgSlug: slug,
        }
      : null
  })

  const existingMembership = useQuery(api.orgs.membership.getMembership, () =>
    clerkContext.currentUser && activeOrg
      ? {
          orgId: activeOrg.orgId,
        }
      : 'skip',
  )

  let visibility = $state<Visibility | null>(null)
  let isJoining = $state(false)

  const saveInviteAndSignIn = async () => {
    if (!slug) {
      return
    }

    savePendingInvite({
      slug,
      token: token || undefined,
    })
    await goto('/login')
  }

  const joinOrg = async () => {
    if (!activeOrg || !visibility) {
      return
    }

    isJoining = true

    try {
      await convex.mutation(api.orgs.membership.joinOrg, {
        orgId: activeOrg.orgId,
        inviteToken: token || undefined,
        directoryVisibility: visibility,
      })

      toast.success(`Welcome to ${activeOrg.orgName}`)
      await goto(`/org/${activeOrg.orgSlug || slug}`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join organization',
      )
    } finally {
      isJoining = false
    }
  }
</script>

<svelte:head>
  <title>Join Organization | ASTN</title>
</svelte:head>

<GradientBg>
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if (token && validation.isLoading) || (!token && orgBySlug.isLoading) || !clerkContext.isClerkLoaded}
      <div class="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle class="size-8 animate-spin text-slate-400" />
      </div>
    {:else if (token && !validation.data?.valid) || (!token && !orgBySlug.data)}
      <div class="mx-auto max-w-md rounded-[2rem] border border-border/70 bg-white/92 px-6 py-12 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
          <Link2Off class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Invalid invite link</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          {token
            ? 'This invite link is invalid or expired. Please request a new link from an organization admin.'
            : 'Organization not found. Please check the link and try again.'}
        </p>
      </div>
    {:else if !clerkContext.currentUser}
      <div class="mx-auto max-w-md rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-coral-50 text-coral-600">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">
          Join {activeOrg?.orgName}
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          Sign in to join this organization and access its member directory,
          programs, and space pages.
        </p>
        <button
          type="button"
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
          onclick={saveInviteAndSignIn}
        >
          Sign in to continue
        </button>
      </div>
    {:else if existingMembership.data}
      <div class="mx-auto max-w-md rounded-[2rem] border border-border/70 bg-white/92 p-8 text-center shadow-warm-sm">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <Building2 class="size-8" />
        </div>
        <h1 class="font-display text-3xl text-slate-950">Already a member</h1>
        <p class="mt-3 text-sm leading-6 text-slate-600">
          You’re already a member of {activeOrg?.orgName}.
        </p>
        <a
          href={`/org/${activeOrg?.orgSlug || page.params.slug}`}
          class="mt-6 inline-flex rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-coral-600"
        >
          View organization
        </a>
      </div>
    {:else}
      <div class="mx-auto max-w-2xl rounded-[2rem] border border-border/70 bg-white/92 p-8 shadow-warm-sm">
        <div class="text-center">
          <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-coral-50 text-coral-600">
            <Building2 class="size-8" />
          </div>
          <h1 class="font-display text-3xl text-slate-950">
            Join {activeOrg?.orgName}
          </h1>
          <p class="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            By joining, organization admins will be able to view your profile.
            If you prefer to keep your profile private, you can still use the
            platform without joining an organization.
          </p>
        </div>

        <section class="mt-8 space-y-3">
          <p class="text-sm font-medium uppercase tracking-[0.18em] text-coral-600">
            Directory visibility
          </p>

          <button
            type="button"
            class={`w-full rounded-[1.5rem] border p-5 text-left transition ${
              visibility === 'visible'
                ? 'border-coral-300 bg-coral-50 shadow-warm-sm'
                : 'border-border/70 bg-white hover:border-coral-200'
            }`}
            onclick={() => {
              visibility = 'visible'
            }}
          >
            <div class="flex items-start gap-4">
              <div class="mt-1 rounded-xl bg-coral-100 p-2 text-coral-700">
                <Eye class="size-5" />
              </div>
              <div>
                <div class="text-base font-semibold text-slate-950">
                  Visible in directory
                </div>
                <p class="mt-1 text-sm leading-6 text-slate-600">
                  Your name and profile summary appear in the public member
                  directory so other members can see you’re part of the
                  organization.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            class={`w-full rounded-[1.5rem] border p-5 text-left transition ${
              visibility === 'hidden'
                ? 'border-slate-300 bg-slate-50 shadow-warm-sm'
                : 'border-border/70 bg-white hover:border-slate-300'
            }`}
            onclick={() => {
              visibility = 'hidden'
            }}
          >
            <div class="flex items-start gap-4">
              <div class="mt-1 rounded-xl bg-slate-100 p-2 text-slate-700">
                <EyeOff class="size-5" />
              </div>
              <div>
                <div class="text-base font-semibold text-slate-950">
                  Hidden from directory
                </div>
                <p class="mt-1 text-sm leading-6 text-slate-600">
                  You won’t appear in the public member directory, but
                  organization admins can still view your profile.
                </p>
              </div>
            </div>
          </button>
        </section>

        <button
          type="button"
          class="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-coral-500 px-4 py-3 text-sm font-medium text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!visibility || isJoining}
          onclick={joinOrg}
        >
          {#if isJoining}
            <span class="inline-flex items-center gap-2">
              <LoaderCircle class="size-4 animate-spin" />
              Joining...
            </span>
          {:else}
            Join organization
          {/if}
        </button>
      </div>
    {/if}
  </main>
</GradientBg>
