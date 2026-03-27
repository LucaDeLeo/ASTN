<script lang="ts">
  import { goto } from '$app/navigation'
  import { Settings2 } from 'lucide-svelte'
  import { getClerkContext } from '$lib/stores/clerk.svelte'
  import AuthHeader from '~/components/layout/auth-header.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import Spinner from '~/components/ui/spinner.svelte'
  import AttendancePrivacyForm from '~/components/settings/AttendancePrivacyForm.svelte'
  import DeleteAllDataSection from '~/components/settings/DeleteAllDataSection.svelte'
  import EventNotificationPrefsForm from '~/components/settings/EventNotificationPrefsForm.svelte'
  import LocationPrivacyToggle from '~/components/settings/LocationPrivacyToggle.svelte'
  import NotificationPrefsForm from '~/components/settings/NotificationPrefsForm.svelte'

  const clerkContext = getClerkContext()

  $effect(() => {
    if (clerkContext.isClerkLoaded && !clerkContext.currentUser) {
      void goto('/login')
    }
  })
</script>

<GradientBg variant="subtle">
  <AuthHeader />

  <main class="container mx-auto px-4 py-8">
    {#if !clerkContext.isClerkLoaded || !clerkContext.currentUser}
      <div class="flex min-h-[60vh] items-center justify-center">
        <Spinner class="border-slate-300 border-t-coral-500" />
      </div>
    {:else}
      <div class="mx-auto max-w-3xl space-y-6">
        <section class="rounded-[2rem] border border-border/70 bg-white/90 p-6 shadow-warm-sm backdrop-blur">
          <div class="flex items-start gap-4">
            <div class="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral-100 text-coral-700">
              <Settings2 class="size-6" />
            </div>
            <div>
              <h1 class="font-display text-3xl text-slate-950">Settings</h1>
              <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Manage notification timing, event privacy, location-based
                suggestions, and account data from one place.
              </p>
            </div>
          </div>
        </section>

        <NotificationPrefsForm />
        <EventNotificationPrefsForm />
        <LocationPrivacyToggle />
        <AttendancePrivacyForm />
        <DeleteAllDataSection />
      </div>
    {/if}
  </main>
</GradientBg>
