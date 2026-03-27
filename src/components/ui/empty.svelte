<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'

  export type EmptyVariant =
    | 'no-data'
    | 'no-results'
    | 'error'
    | 'success'
    | 'no-matches'
    | 'no-opportunities'
    | 'no-events'
    | 'profile-incomplete'

  const defaultTitles: Record<EmptyVariant, string> = {
    'no-data': 'Nothing here yet',
    'no-results': 'No matches found',
    error: 'Something went wrong',
    success: 'All done!',
    'no-matches': 'No matches yet',
    'no-opportunities': 'No opportunities right now',
    'no-events': 'No upcoming events',
    'profile-incomplete': 'Complete your profile',
  }

  const defaultDescriptions: Record<EmptyVariant, string> = {
    'no-data': 'Great things take time. Check back soon!',
    'no-results': 'Try adjusting your filters or search terms.',
    error: "We're looking into it. Please try again.",
    success: "You're all caught up.",
    'no-matches':
      "Complete your profile and we'll find opportunities that fit your skills and goals.",
    'no-opportunities':
      'New AI Safety opportunities are added regularly. Check back soon!',
    'no-events':
      'No events are scheduled yet. Follow organizations to get notified.',
    'profile-incomplete':
      'Add your experience and goals to unlock personalized job matches.',
  }

  let {
    variant = 'no-data',
    title,
    description,
    class: className = '',
    children,
    icon,
    titleContent,
    descriptionContent,
  }: {
    variant?: EmptyVariant
    title?: string
    description?: string
    class?: string
    children?: Snippet
    icon?: Snippet
    titleContent?: Snippet
    descriptionContent?: Snippet
  } = $props()

  const resolvedTitle = $derived(title || defaultTitles[variant])
  const resolvedDescription = $derived(description || defaultDescriptions[variant])
</script>

<div
  class={cn(
    'flex flex-col items-center justify-center py-12 text-center',
    className,
  )}
>
  <div class="mb-6 text-coral-400">
    {#if icon}
      {@render icon()}
    {:else}
      <div class="grid size-24 place-items-center rounded-full border border-dashed border-current/40">
        <svg
          viewBox="0 0 24 24"
          class="size-10"
          fill="none"
          stroke="currentColor"
          stroke-width="1.75"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
    {/if}
  </div>

  <div class="space-y-2">
    {#if titleContent}
      {@render titleContent()}
    {:else}
      <h3 class="font-display text-lg font-medium text-foreground">
        {resolvedTitle}
      </h3>
    {/if}

    {#if descriptionContent}
      {@render descriptionContent()}
    {:else}
      <p class="max-w-sm text-sm text-muted-foreground">{resolvedDescription}</p>
    {/if}
  </div>

  {#if children}
    <div class="mt-6">
      {@render children()}
    </div>
  {/if}
</div>
