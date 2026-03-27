<script lang="ts">
  let {
    variant = 'radial',
    class: className = '',
    children,
  }: {
    variant?: 'radial' | 'linear' | 'subtle'
    class?: string
    children?: import('svelte').Snippet
  } = $props()

  const variantToClass = {
    radial: 'gradient-bg-radial',
    linear: 'gradient-bg-linear',
    subtle: 'gradient-bg-subtle',
  } as const
</script>

<div class={`min-h-screen ${variantToClass[variant]} ${className}`.trim()}>
  {@render children?.()}
</div>
