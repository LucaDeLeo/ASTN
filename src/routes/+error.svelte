<script lang="ts">
  import ErrorDisplay from '~/components/ErrorDisplay.svelte'

  let { error }: { error: App.Error } = $props()
</script>

<ErrorDisplay {error} />
