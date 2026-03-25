<script lang="ts">
  import { onMount } from 'svelte'
  import {
    Building2,
    Calendar,
    ClipboardList,
    FileText,
    Globe,
    LayoutDashboard,
    Sparkles,
    Target,
    Users,
  } from 'lucide-svelte'
  import { posthogStore } from '$lib/stores/posthog.svelte'
  import GradientBg from '~/components/layout/GradientBg.svelte'
  import PublicHeader from '~/components/layout/public-header.svelte'
  import AuthPanel from './AuthPanel.svelte'

  const steps = [
    {
      icon: FileText,
      step: '1',
      title: 'Build your profile',
      description:
        'Upload your resume or describe your background so ASTN can capture your skills, experience, and goals.',
    },
    {
      icon: Target,
      step: '2',
      title: 'Get matched to roles',
      description:
        'See curated AI safety opportunities across research, policy, governance, and operations.',
    },
    {
      icon: Sparkles,
      step: '3',
      title: 'Act on the gaps',
      description:
        'Review why you match, where the fit is weak, and what next steps improve your odds.',
    },
  ] as const

  const communityFeatures = [
    {
      icon: Globe,
      title: 'Discover organizations',
      description:
        'Browse AI safety hubs, local communities, and globally distributed organizations in one directory.',
    },
    {
      icon: Calendar,
      title: 'Track events',
      description:
        'See upcoming meetups, talks, and workshops from the communities you care about.',
    },
    {
      icon: Users,
      title: 'Build your network',
      description:
        'Join directories and connect with peers working on adjacent AI safety problems.',
    },
  ] as const

  const orgLeaderFeatures = [
    {
      icon: LayoutDashboard,
      title: 'Admin dashboard',
      description:
        'Track member growth, event activity, and organization health from one control surface.',
    },
    {
      icon: ClipboardList,
      title: 'Member directory',
      description:
        'Search members, review profiles, and export your community data when you need it.',
    },
    {
      icon: Building2,
      title: 'Space operations',
      description:
        'Coordinate coworking spaces, guest visits, and physical hub workflows without extra tooling.',
    },
    {
      icon: Target,
      title: 'Opportunity pipeline',
      description:
        'Publish roles and programs, collect applications, and surface promising candidates quickly.',
    },
  ] as const

  onMount(() => {
    posthogStore.capture('landing_page_viewed', {
      referrer: document.referrer || undefined,
    })
  })
</script>

<GradientBg variant="subtle">
  <PublicHeader />

  <main class="container mx-auto px-4 py-12 md:py-16">
    <section class="mx-auto mb-18 max-w-6xl">
      <div class="grid items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
        <div class="space-y-6 text-center md:text-left">
          <div class="inline-flex rounded-full border border-coral-200 bg-coral-50 px-3 py-1 text-sm font-medium text-coral-700">
            Open Alpha
          </div>
          <div class="space-y-4">
            <h1 class="font-display text-4xl leading-tight text-slate-950 md:text-5xl">
              AI safety roles matched to your actual profile.
            </h1>
            <p class="max-w-2xl text-lg text-slate-600">
              ASTN is a career command center for AI safety talent. Build a
              profile once, get matched to relevant roles, and see the concrete
              next steps that improve your fit.
            </p>
          </div>
          <div class="grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div class="rounded-2xl border border-coral-200 bg-white/80 px-4 py-3 shadow-sm">
              Resume and profile intake
            </div>
            <div class="rounded-2xl border border-teal-200 bg-white/80 px-4 py-3 shadow-sm">
              Match reasoning and gaps
            </div>
            <div class="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 shadow-sm">
              Organizations, events, and actions
            </div>
          </div>
        </div>

        <AuthPanel />
      </div>
    </section>

    <section class="mx-auto mb-18 max-w-5xl">
      <div class="mb-8 text-center">
        <h2 class="font-display text-2xl text-slate-950 md:text-3xl">
          How it works
        </h2>
      </div>
      <div class="grid gap-6 md:grid-cols-3">
        {#each steps as step}
          <article class="h-full rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-center shadow-warm-sm">
            <div class="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-coral-100 text-sm font-semibold text-coral-700">
              {step.step}
            </div>
            <step.icon class="mx-auto mb-3 size-5 text-coral-600" />
            <h3 class="mb-2 font-display text-lg text-slate-950">{step.title}</h3>
            <p class="text-sm leading-6 text-slate-600">{step.description}</p>
          </article>
        {/each}
      </div>
    </section>

    <section class="mx-auto mb-18 max-w-5xl">
      <div class="mb-8 text-center">
        <h2 class="font-display text-2xl text-slate-950 md:text-3xl">
          Join your community
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600">
          Find local hubs, discover events, and connect with peers across the
          AI safety ecosystem.
        </p>
      </div>
      <div class="grid gap-6 md:grid-cols-3">
        {#each communityFeatures as feature}
          <article class="h-full rounded-[1.5rem] border border-border/70 bg-white/88 p-6 text-center shadow-warm-sm">
            <div class="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-coral-100">
              <feature.icon class="size-5 text-coral-600" />
            </div>
            <h3 class="mb-2 font-display text-lg text-slate-950">{feature.title}</h3>
            <p class="text-sm leading-6 text-slate-600">{feature.description}</p>
          </article>
        {/each}
      </div>
    </section>

    <section class="mx-auto mb-18 max-w-5xl">
      <div class="mb-8 text-center">
        <h2 class="font-display text-2xl text-slate-950 md:text-3xl">
          For organization leaders
        </h2>
        <p class="mx-auto mt-3 max-w-2xl text-slate-600">
          Manage your community, post opportunities, and keep operational
          workflows in one place.
        </p>
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        {#each orgLeaderFeatures as feature}
          <article class="flex h-full gap-4 rounded-[1.5rem] border border-border/70 bg-white/88 p-6 shadow-warm-sm">
            <div class="flex size-11 shrink-0 items-center justify-center rounded-full bg-cream-100">
              <feature.icon class="size-5 text-coral-500" />
            </div>
            <div>
              <h3 class="mb-2 font-display text-lg text-slate-950">{feature.title}</h3>
              <p class="text-sm leading-6 text-slate-600">{feature.description}</p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section class="mx-auto max-w-3xl text-center">
      <h2 class="mb-4 font-display text-2xl text-slate-950 md:text-3xl">
        Who it&apos;s for
      </h2>
      <p class="leading-7 text-slate-600">
        Researchers, engineers, policy analysts, operators, and community
        builders using AI safety as the filter for where they want to work.
        ASTN began as a BAISH pilot and now supports a broader ecosystem.
      </p>
    </section>
  </main>

  <footer class="border-t border-border/70 bg-white/70 py-6 backdrop-blur">
    <div class="container mx-auto flex items-center justify-center gap-4 px-4 text-sm text-muted-foreground">
      <a href="/privacy" class="transition-colors hover:text-foreground">
        Privacy Policy
      </a>
      <span aria-hidden="true">·</span>
      <a href="/terms" class="transition-colors hover:text-foreground">
        Terms of Use
      </a>
    </div>
  </footer>
</GradientBg>
