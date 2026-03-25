<script lang="ts">
  import { goto } from '$app/navigation'
  import { Building2, LoaderCircle } from 'lucide-svelte'
  import { toast } from 'svelte-sonner'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'

  const clerkContext = getClerkContext()
  const convex = useConvexClient()

  const profile = useQuery(
    api.profiles.getOrCreateProfile,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )
  const myEmail = useQuery(
    api.orgApplications.getMyEmail,
    () => (clerkContext.currentUser ? {} : 'skip'),
  )

  let orgName = $state('')
  let description = $state('')
  let city = $state('')
  let country = $state('')
  let website = $state('')
  let applicantName = $state('')
  let applicantEmail = $state('')
  let prefilledName = $state(false)
  let prefilledEmail = $state(false)
  let isSubmitting = $state(false)

  $effect(() => {
    if (!prefilledName && profile.data?.name && !applicantName) {
      applicantName = profile.data.name
      prefilledName = true
    }
  })

  $effect(() => {
    if (!prefilledEmail && myEmail.data && !applicantEmail) {
      applicantEmail = myEmail.data
      prefilledEmail = true
    }
  })

  const isValid = $derived(
    Boolean(
      orgName.trim() &&
        description.trim() &&
        city.trim() &&
        country.trim() &&
        applicantName.trim() &&
        applicantEmail.trim(),
    ),
  )

  const submit = async (event: SubmitEvent) => {
    event.preventDefault()

    if (!clerkContext.currentUser || !isValid || isSubmitting) {
      return
    }

    isSubmitting = true

    try {
      await convex.mutation(api.orgApplications.submit, {
        orgName: orgName.trim(),
        description: description.trim(),
        city: city.trim(),
        country: country.trim(),
        website: website.trim() || undefined,
        applicantName: applicantName.trim(),
        applicantEmail: applicantEmail.trim(),
      })

      posthogStore.capture('org_application_submitted', {
        org_name: orgName.trim(),
        city: city.trim(),
        country: country.trim(),
        has_website: Boolean(website.trim()),
      })

      toast.success('Application submitted')
      await goto('/apply/status')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application',
      )
    } finally {
      isSubmitting = false
    }
  }
</script>

<GradientBg>
  <AuthHeader />
  <main class="container mx-auto px-4 py-8">
    <div class="mx-auto max-w-2xl">
      <div class="mb-8 text-center">
        <div class="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Building2 class="size-8 text-primary" />
        </div>
        <h1 class="mb-2 text-2xl font-display font-semibold text-foreground">
          Apply to Join ASTN
        </h1>
        <p class="text-muted-foreground">
          Submit an application to register your organization on the AI Safety
          Talent Network.
        </p>
      </div>

      <section class="rounded-2xl border border-border bg-card shadow-warm-sm">
        <div class="border-b border-border px-6 py-5">
          <h2 class="text-lg font-semibold text-foreground">
            Organization Application
          </h2>
        </div>

        <div class="px-6 py-6">
          {#if !clerkContext.currentUser}
            <div class="space-y-4">
              <div>
                <label for="orgName" class="mb-1 block text-sm font-medium text-foreground">
                  Organization Name
                </label>
                <input
                  id="orgName"
                  placeholder="e.g. AI Safety Hub"
                  disabled
                  class="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
              </div>

              <div>
                <label for="description" class="mb-1 block text-sm font-medium text-foreground">
                  Brief description of your organization
                </label>
                <textarea
                  id="description"
                  placeholder="What does your organization do?"
                  disabled
                  class="min-h-28 w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                ></textarea>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="city" class="mb-1 block text-sm font-medium text-foreground">
                    City
                  </label>
                  <input
                    id="city"
                    placeholder="e.g. Buenos Aires"
                    disabled
                    class="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </div>
                <div>
                  <label for="country" class="mb-1 block text-sm font-medium text-foreground">
                    Country
                  </label>
                  <input
                    id="country"
                    placeholder="e.g. Argentina"
                    disabled
                    class="w-full rounded-xl border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
                  />
                </div>
              </div>

              <div class="pt-4 text-center">
                <p class="mb-3 text-sm text-muted-foreground">
                  You need to sign in to submit an application.
                </p>
                <a
                  href="/login"
                  class="inline-flex rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-coral-600"
                >
                  Sign in to submit
                </a>
              </div>
            </div>
          {:else}
            <form class="space-y-4" onsubmit={submit}>
              <div>
                <label for="orgNameLive" class="mb-1 block text-sm font-medium text-foreground">
                  Organization Name <span class="text-destructive">*</span>
                </label>
                <input
                  id="orgNameLive"
                  bind:value={orgName}
                  placeholder="e.g. AI Safety Hub"
                  required
                  class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                />
              </div>

              <div>
                <label for="descriptionLive" class="mb-1 block text-sm font-medium text-foreground">
                  Brief description of your organization <span class="text-destructive">*</span>
                </label>
                <textarea
                  id="descriptionLive"
                  bind:value={description}
                  placeholder="What does your organization do? What is its mission?"
                  rows="3"
                  required
                  class="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                ></textarea>
              </div>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label for="cityLive" class="mb-1 block text-sm font-medium text-foreground">
                    City <span class="text-destructive">*</span>
                  </label>
                  <input
                    id="cityLive"
                    bind:value={city}
                    placeholder="e.g. Buenos Aires"
                    required
                    class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  />
                </div>
                <div>
                  <label for="countryLive" class="mb-1 block text-sm font-medium text-foreground">
                    Country <span class="text-destructive">*</span>
                  </label>
                  <input
                    id="countryLive"
                    bind:value={country}
                    placeholder="e.g. Argentina"
                    required
                    class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                  />
                </div>
              </div>

              <div>
                <label for="websiteLive" class="mb-1 block text-sm font-medium text-foreground">
                  Website URL
                </label>
                <input
                  id="websiteLive"
                  bind:value={website}
                  placeholder="https://example.org"
                  type="url"
                  class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                />
              </div>

              <div class="mt-4 border-t border-border pt-4">
                <h3 class="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Applicant details
                </h3>

                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label for="applicantName" class="mb-1 block text-sm font-medium text-foreground">
                      Your name <span class="text-destructive">*</span>
                    </label>
                    <input
                      id="applicantName"
                      bind:value={applicantName}
                      placeholder="e.g. Jane Doe"
                      required
                      class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    />
                  </div>
                  <div>
                    <label for="applicantEmail" class="mb-1 block text-sm font-medium text-foreground">
                      Your email <span class="text-destructive">*</span>
                    </label>
                    <input
                      id="applicantEmail"
                      bind:value={applicantEmail}
                      placeholder="you@example.org"
                      type="email"
                      required
                      class="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus:border-coral-300 focus:ring-2 focus:ring-coral-200"
                    />
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between gap-3 pt-2">
                <a href="/apply/status" class="text-sm text-muted-foreground hover:text-foreground">
                  View submitted applications
                </a>
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  class="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {#if isSubmitting}
                    <LoaderCircle class="size-4 animate-spin" />
                    Submitting...
                  {:else}
                    Submit application
                  {/if}
                </button>
              </div>
            </form>
          {/if}
        </div>
      </section>
    </div>
  </main>
</GradientBg>
