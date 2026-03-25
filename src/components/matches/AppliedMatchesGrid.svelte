<script lang="ts">
  import type { MatchSummary } from './types'
  import MatchCard from './MatchCard.svelte'

  let {
    matches = [],
  }: {
    matches?: MatchSummary[]
  } = $props()
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {#each matches as match (match._id)}
    <MatchCard {match} />
  {/each}
</div>
