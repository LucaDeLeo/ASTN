<script lang="ts">
  import { goto } from '$app/navigation'
  import { formatDistanceToNow } from 'date-fns'
  import {
    Building2,
    CheckCircle2,
    Clock3,
    FileText,
    LoaderCircle,
    XCircle,
  } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import type { Id } from '$convex/_generated/dataModel'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'

  type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

  type Application = {
    _id: Id<'orgApplications'>
    orgName: string
    status: ApplicationStatus
    createdAt: number
    rejectionReason?: string
    orgSlug?: string | null
  }

  const clerkContext = getClerkContext()
  const convex = useConvexClient()
  const applications = useQuery(
    api.orgApplications.getMyApplications,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  let withdrawingId = $state<Id<'orgApplications'> | null>(null)
  let confirmWithdrawId = $state<Id<'orgApplications'> | null>(null)

  $effect(() => {
    if (!clerkContext.currentUser && clerkContext.isClerkLoaded) {
      void goto('/login')
    }
  })

  const withdraw = async (applicationId: Id<'orgApplications'>) => {
    withdrawingId = applicationId

    try {
      await convex.mutation(api.orgApplications.withdraw, { applicationId })
      toast.success('Application withdrawn')
      confirmWithdrawId = null
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to withdraw application',
      )
    } finally {
      withdrawingId = null
    }
  }

  const statusConfig: Record<
    ApplicationStatus,
    {
      label: string
      badgeClass: string
      icon: typeof Clock3
    }
  > = {
    pending: {
      label: 'Pending',
      badgeClass:
        'border-slate-300 bg-white text-slate-700',
      icon: Clock3,
    },
    approved: {
      label: 'Approved',
      badgeClass:
        'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Rejected',
      badgeClass:
        'border-rose-200 bg-rose-50 text-rose-700',
      icon: XCircle,
    },
    withdrawn: {
      label: 'Withdrawn',
      badgeClass:
        'border-slate-200 bg-slate-100 text-slate-600',
      icon: FileText,
    },
  }
</script>

<GradientBg>
  <AuthHeader />
  <main class="container mx-auto px-4 py-8">
    {#if !clerkContext.currentUser || applications.isLoading}
      <div class="flex min-h-[60vh] items-center justify-center">
        <div class="size-6 animate-spin rounded-full border-2 border-border border-t-coral-500"></div>
      </div>
    {:else}
      <div class="mx-auto max-w-2xl">
        <div class="mb-6">
          <h1 class="text-2xl font-display font-semibold text-foreground">
            Your Applications
          </h1>
          <p class="mt-1 text-muted-foreground">
            Track the status of your organization applications.
          </p>
        </div>

        {#if !applications.data?.length}
          <section class="rounded-2xl border border-border bg-card px-6 py-12 text-center shadow-warm-sm">
            <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <FileText class="size-8 text-muted-foreground" />
            </div>
            <h2 class="mb-2 text-lg font-medium text-foreground">
              No applications yet
            </h2>
            <p class="mb-4 text-sm text-muted-foreground">
              Submit an application to register your organization on ASTN.
            </p>
            <a
              href="/apply"
              class="inline-flex rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-600"
            >
              Apply now
            </a>
          </section>
        {:else}
          <div class="space-y-4">
            {#each applications.data as application (application._id)}
              {@const config = statusConfig[application.status]}
              {@const StatusIcon = config.icon}
              <section class="rounded-2xl border border-border bg-card shadow-warm-sm">
                <div class="flex items-start justify-between gap-4 px-6 py-5">
                  <div class="flex items-center gap-3">
                    <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Building2 class="size-5 text-primary" />
                    </div>
                    <div>
                      <h2 class="text-lg font-semibold text-foreground">
                        {application.orgName}
                      </h2>
                      <p class="text-sm text-muted-foreground">
                        Submitted
                        {formatDistanceToNow(application.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div
                    class={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${config.badgeClass}`}
                  >
                    <StatusIcon class="size-3.5" />
                    {config.label}
                  </div>
                </div>

                <div class="space-y-3 px-6 pb-6">
                  {#if application.status === 'rejected' && application.rejectionReason}
                    <div class="rounded-xl border border-rose-200 bg-rose-50 p-3">
                      <p class="mb-1 text-sm font-medium text-rose-700">
                        Rejection reason
                      </p>
                      <p class="text-sm text-slate-600">{application.rejectionReason}</p>
                    </div>
                  {/if}

                  {#if application.status === 'approved' && application.orgSlug}
                    <a
                      href={`/org/${application.orgSlug}/admin`}
                      class="inline-flex rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-600"
                    >
                      Configure your organization
                    </a>
                  {/if}

                  {#if application.status === 'pending'}
                    <button
                      type="button"
                      class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                      onclick={() => {
                        confirmWithdrawId = application._id
                      }}
                    >
                      Withdraw application
                    </button>
                  {/if}
                </div>
              </section>
            {/each}

            <div class="pt-4 text-center">
              <a
                href="/apply"
                class="inline-flex rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                Submit another application
              </a>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </main>

  {#if confirmWithdrawId}
    {@const currentApplication = applications.data?.find(
      (application) => application._id === confirmWithdrawId,
    ) as Application | undefined}
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div class="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-warm-lg">
        <h2 class="text-lg font-semibold text-foreground">
          Withdraw application
        </h2>
        <p class="mt-2 text-sm text-muted-foreground">
          Are you sure you want to withdraw your application for
          "{currentApplication?.orgName}"? This action cannot be undone.
        </p>
        <div class="mt-5 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            onclick={() => {
              confirmWithdrawId = null
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            class="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={withdrawingId === confirmWithdrawId}
            onclick={() => {
              if (confirmWithdrawId) {
                void withdraw(confirmWithdrawId)
              }
            }}
          >
            {#if withdrawingId === confirmWithdrawId}
              <LoaderCircle class="size-4 animate-spin" />
              Withdrawing...
            {:else}
              Withdraw
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</GradientBg>
