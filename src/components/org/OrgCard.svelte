<script lang="ts">
  import { Building2, Calendar, Check, MapPin, Users } from 'lucide-svelte'
  import { cn } from '~/lib/utils'
  import {
    type OrgDirectoryOrg,
    getOrgHref,
    getOrgLocation,
  } from './org-directory.types'

  let {
    org,
    variant = 'carousel',
    selected = false,
    onselect,
  }: {
    org: OrgDirectoryOrg
    variant?: 'carousel' | 'list'
    selected?: boolean
    onselect?: (org: OrgDirectoryOrg) => void
  } = $props()

  const location = $derived(getOrgLocation(org))
  const orgHref = $derived(getOrgHref(org))

  const selectOrg = () => {
    onselect?.(org)
  }
</script>

{#if variant === 'carousel'}
  <a
    href={orgHref}
    class={cn(
      'group flex w-72 flex-col rounded-[1.5rem] border border-border/70 bg-white/92 p-4 shadow-warm-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
      selected && 'ring-2 ring-coral-400 ring-offset-2 ring-offset-background',
    )}
  >
    <div class="mb-3 flex items-start gap-3">
      {#if org.logoUrl}
        <img
          src={org.logoUrl}
          alt={`${org.name} logo`}
          class="size-12 rounded-2xl border border-border/60 object-cover shadow-sm"
        />
      {:else}
        <div
          class="flex size-12 items-center justify-center rounded-2xl border border-border/60 bg-slate-100 text-slate-400"
        >
          <Building2 class="size-6" />
        </div>
      {/if}

      <div class="min-w-0 flex-1">
        <div class="flex items-start gap-2">
          <h3 class="truncate text-base font-semibold text-slate-950">
            {org.name}
          </h3>
          {#if org.isJoined}
            <span
              class="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
            >
              <Check class="size-3" />
              Joined
            </span>
          {/if}
        </div>
        {#if location}
          <p class="mt-1 flex items-center gap-1 text-sm text-slate-500">
            <MapPin class="size-3.5 shrink-0" />
            <span class="truncate">{location}</span>
          </p>
        {/if}
      </div>
    </div>

    {#if org.description}
      <p class="mb-4 line-clamp-3 text-sm leading-6 text-slate-600">
        {org.description}
      </p>
    {/if}

    <div class="mt-auto flex flex-wrap gap-3 text-sm text-slate-500">
      {#if org.memberCount}
        <span class="inline-flex items-center gap-1.5">
          <Users class="size-3.5" />
          {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
        </span>
      {/if}
      {#if org.upcomingEventCount}
        <span class="inline-flex items-center gap-1.5">
          <Calendar class="size-3.5" />
          {org.upcomingEventCount} upcoming {org.upcomingEventCount === 1
            ? 'event'
            : 'events'}
        </span>
      {/if}
    </div>

    <span
      class="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-border/70 px-3 py-2 text-sm font-medium text-slate-800 transition-colors group-hover:border-coral-300 group-hover:bg-coral-50 group-hover:text-coral-800"
    >
      View organization
    </span>
  </a>
{:else}
  <article
    class={cn(
      'rounded-[1.5rem] border bg-white/92 p-4 shadow-warm-sm transition-all duration-200',
      selected
        ? 'border-coral-300 ring-2 ring-coral-300/80 ring-offset-2 ring-offset-background'
        : 'border-border/70 hover:border-coral-200 hover:shadow-md',
    )}
  >
    <button
      type="button"
      class={cn(
        'block w-full text-left',
        onselect &&
          'cursor-pointer rounded-[1rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300/80',
      )}
      aria-pressed={onselect ? selected : undefined}
      onclick={onselect ? selectOrg : undefined}
    >
      <div class="flex items-start gap-3">
        {#if org.logoUrl}
          <img
            src={org.logoUrl}
            alt={`${org.name} logo`}
            class="size-14 rounded-2xl border border-border/60 object-cover shadow-sm"
          />
        {:else}
          <div
            class="flex size-14 items-center justify-center rounded-2xl border border-border/60 bg-slate-100 text-slate-400"
          >
            <Building2 class="size-7" />
          </div>
        {/if}

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="min-w-0 flex-1 truncate text-lg font-semibold text-slate-950">
              {org.name}
            </h3>
            {#if org.isJoined}
              <span
                class="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800"
              >
                <Check class="size-3" />
                Joined
              </span>
            {/if}
          </div>

          {#if location}
            <p class="mt-1 flex items-center gap-1 text-sm text-slate-500">
              <MapPin class="size-3.5 shrink-0" />
              <span class="truncate">{location}</span>
            </p>
          {/if}
        </div>
      </div>

      {#if org.description}
        <p class="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {org.description}
        </p>
      {/if}
    </button>

    <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-wrap gap-3 text-sm text-slate-500">
        {#if org.memberCount}
          <span class="inline-flex items-center gap-1.5">
            <Users class="size-3.5" />
            {org.memberCount} {org.memberCount === 1 ? 'member' : 'members'}
          </span>
        {/if}
        {#if org.upcomingEventCount}
          <span class="inline-flex items-center gap-1.5">
            <Calendar class="size-3.5" />
            {org.upcomingEventCount} upcoming {org.upcomingEventCount === 1
              ? 'event'
              : 'events'}
          </span>
        {/if}
      </div>

      <a
        href={orgHref}
        class="inline-flex items-center justify-center rounded-xl border border-border/70 px-3 py-2 text-sm font-medium text-slate-800 transition-colors hover:border-coral-300 hover:bg-coral-50 hover:text-coral-800"
        onclick={(event) => event.stopPropagation()}
      >
        View organization
      </a>
    </div>
  </article>
{/if}
