<script lang="ts">
  import { useQuery } from 'convex-svelte'
  import type { Id } from '$convex/_generated/dataModel'
  import { api } from '$convex/_generated/api'
  import { renderMarkdownToHtml } from '$lib/render-markdown'

  let { promptId }: { promptId: Id<'coursePrompts'> } = $props()

  const prompt = useQuery(api.course.prompts.get, () => ({ promptId }))
  const responses = useQuery(api.course.responses.getPromptResponses, () => ({ promptId }))

  const submittedResponses = $derived(
    (responses.data ?? []).filter((response) => response.status === 'submitted'),
  )
</script>

<section class="rounded-[1.5rem] border border-border/70 bg-white p-4">
  <div class="flex items-center justify-between gap-3">
    <div>
      <h4 class="font-medium text-slate-950">{prompt.data?.title || 'Prompt'}</h4>
      <p class="mt-1 text-xs text-slate-500">
        {submittedResponses.length} submitted response{submittedResponses.length === 1 ? '' : 's'}
      </p>
    </div>
  </div>

  {#if prompt.data?.body}
    <div class="prose prose-sm mt-3 max-w-none prose-p:my-2">
      {@html renderMarkdownToHtml(prompt.data.body)}
    </div>
  {/if}

  {#if submittedResponses.length}
    <div class="mt-4 space-y-3">
      {#each submittedResponses as response (response._id)}
        <div class="rounded-2xl bg-slate-50 p-3 text-sm text-slate-700">
          {#each response.fieldResponses as fieldResponse (fieldResponse.fieldId)}
            <div class="mb-2 last:mb-0">
              {#if fieldResponse.textValue}
                <p class="whitespace-pre-wrap">{fieldResponse.textValue}</p>
              {:else if fieldResponse.selectedOptionIds?.length}
                <p>{fieldResponse.selectedOptionIds.join(', ')}</p>
              {/if}
            </div>
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</section>
