<script lang="ts">
  import type { MatchSummary } from './types'
  import MatchCard from './MatchCard.svelte'

  let {
    matches = [],
    onToggleSave,
  }: {
    matches?: MatchSummary[]
    onToggleSave: (matchId: MatchSummary['_id']) => void | Promise<void>
  } = $props()
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {#each matches as match (match._id)}
    <MatchCard
      {match}
      isSaved
      onUnsave={() => onToggleSave(match._id)}
    />
  {/each}
</div>
