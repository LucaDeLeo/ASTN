<script lang="ts">
  let {
    startedAt,
    durationMs,
  }: {
    startedAt: number
    durationMs: number
  } = $props()

  let now = $state(Date.now())

  $effect(() => {
    const interval = window.setInterval(() => {
      now = Date.now()
    }, 1000)

    return () => {
      window.clearInterval(interval)
    }
  })

  const remainingMs = $derived(Math.max(0, startedAt + durationMs - now))
  const remainingMinutes = $derived(Math.floor(remainingMs / 60000))
  const remainingSeconds = $derived(Math.floor((remainingMs % 60000) / 1000))
</script>

<div class="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700">
  {String(remainingMinutes).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
</div>
