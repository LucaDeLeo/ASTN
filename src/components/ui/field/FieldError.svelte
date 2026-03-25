<script lang="ts">
  import type { Snippet } from 'svelte'
  import { cn } from '~/lib/utils'

  let {
    class: className = '',
    errors = [],
    children,
    ...rest
  }: {
    class?: string
    errors?: Array<{ message?: string } | undefined>
    children?: Snippet
  } = $props()

  const messages = $derived(
    [...new Set(errors.map((error) => error?.message).filter(Boolean))] as string[],
  )
</script>

{#if children || messages.length > 0}
  <div
    role="alert"
    data-slot="field-error"
    class={cn('text-sm font-normal text-destructive', className)}
    {...rest}
  >
    {#if children}
      {@render children()}
    {:else if messages.length === 1}
      {messages[0]}
    {:else}
      <ul class="ml-4 flex list-disc flex-col gap-1">
        {#each messages as message}
          <li>{message}</li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}
