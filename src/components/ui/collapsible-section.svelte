<script lang="ts">
  import type { Snippet } from 'svelte'
  import { onMount } from 'svelte'
  import { cn } from '~/lib/utils'

  type Variant = 'default' | 'emerald' | 'violet'

  const triggerClasses: Record<Variant, string> = {
    default:
      'border bg-card text-foreground hover:bg-accent/50',
    emerald:
      'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80',
    violet:
      'border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100/80',
  }

  const iconColorMap: Record<Variant, string> = {
    default: 'text-primary',
    emerald: 'text-emerald-600',
    violet: 'text-violet-600',
  }

  let {
    icon,
    iconClassName = '',
    title,
    count,
    subtitle,
    variant = 'default',
    defaultOpen = false,
    storageKey,
    itemCount,
    class: className = '',
    children,
  }: {
    icon?: any
    iconClassName?: string
    title: string
    count?: number
    subtitle?: string
    variant?: Variant
    defaultOpen?: boolean
    storageKey?: string
    itemCount?: number
    class?: string
    children?: Snippet
  } = $props()

  let open = $state(false)

  onMount(() => {
    open = defaultOpen

    if (!storageKey) return

    const stored = sessionStorage.getItem(storageKey)
    if (stored !== null) {
      open = stored === 'true'
    }
  })

  $effect(() => {
    if (!storageKey) return
    sessionStorage.setItem(storageKey, String(open))
  })

  const hiddenByPresence = $derived(itemCount != null && itemCount <= 0)
</script>

{#if !hiddenByPresence}
  <section class={cn('space-y-4', className)}>
    <button
      type="button"
      class={cn(
        'flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors',
        triggerClasses[variant],
      )}
      onclick={() => {
        open = !open
      }}
      aria-expanded={open}
    >
      {#if icon}
        <icon class={cn('size-5 shrink-0', iconColorMap[variant], iconClassName)}></icon>
      {/if}

      <div class="flex min-w-0 flex-1 items-center gap-2">
        <span class="text-sm font-semibold">
          {count != null ? `${count} ${title}` : title}
        </span>
        {#if subtitle}
          <span class="text-muted-foreground">·</span>
          <span class="text-sm text-muted-foreground">{subtitle}</span>
        {/if}
      </div>

      <svg
        class={cn(
          'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
          open && 'rotate-180',
        )}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>

    <div
      class={cn(
        'grid transition-[grid-template-rows] duration-200 ease-out',
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
    >
      <div class="overflow-hidden">
        {@render children?.()}
      </div>
    </div>
  </section>
{/if}
