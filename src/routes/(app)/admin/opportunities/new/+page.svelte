<script lang="ts">
  import OpportunityEditor from '~/components/platform-admin/OpportunityEditor.svelte'
</script>

<section class="space-y-6">
  <div>
    <h1 class="font-display text-3xl text-slate-950">Add opportunity</h1>
    <p class="mt-2 text-sm text-slate-600">Create a new platform-managed opportunity.</p>
  </div>
  <OpportunityEditor mode="create" />
</section>
