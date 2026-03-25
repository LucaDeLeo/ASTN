<script lang="ts">
  import type { Snippet } from 'svelte'
  import OrgCard from './OrgCard.svelte'
  import type { OrgDirectoryOrg } from './org-directory.types'

  let {
    orgs,
    emptyState,
  }: {
    orgs: OrgDirectoryOrg[]
    emptyState?: Snippet
  } = $props()
</script>

{#if orgs.length === 0}
  {@render emptyState?.()}
{:else}
  <div class="relative">
    <div
      class="scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4"
    >
      {#each orgs as org (org._id)}
        <div class="snap-start shrink-0">
          <OrgCard {org} variant="carousel" />
        </div>
      {/each}
    </div>

    <div
      class="pointer-events-none absolute inset-y-0 right-0 bottom-4 w-12 bg-gradient-to-l from-[rgba(250,248,244,0.94)] to-transparent"
    ></div>
  </div>
{/if}

