<script lang="ts">
  import { Brain, FileText, LoaderCircle, Tags } from 'lucide-svelte'
  import type { ExtractionStage } from '$lib/stores/profile-extraction.svelte'

  const stages: Record<
    ExtractionStage,
    { label: string; icon: typeof FileText }
  > = {
    reading: { label: 'Reading document...', icon: FileText },
    extracting: { label: 'Extracting information...', icon: Brain },
    matching: { label: 'Matching skills...', icon: Tags },
  }

  const stageOrder: Array<ExtractionStage> = [
    'reading',
    'extracting',
    'matching',
  ]

  let {
    stage,
    fileName,
  }: {
    stage: ExtractionStage
    fileName?: string
  } = $props()

  const currentIndex = $derived(stageOrder.indexOf(stage))
</script>

<div class="space-y-4 rounded-lg border bg-card p-6 text-center">
  <div class="flex justify-center">
    <div class="relative flex h-16 w-16 items-center justify-center">
      {#each stageOrder as currentStage}
        {@const Icon = stages[currentStage].icon}
        <Icon
          class={cn(
            'absolute h-8 w-8 transition-all duration-300 ease-out',
            currentStage === stage
              ? 'scale-100 opacity-100 text-primary'
              : 'scale-75 opacity-0',
          )}
        />
      {/each}
      <LoaderCircle class="absolute h-16 w-16 animate-spin text-primary/40" />
    </div>
  </div>

  <div class="flex h-12 flex-col items-center justify-center space-y-1">
    <div class="relative flex h-6 items-center justify-center">
      {#each stageOrder as currentStage}
        <p
          class={cn(
            'whitespace-nowrap font-medium text-foreground transition-all duration-300 ease-out',
            currentStage === stage
              ? 'translate-y-0 opacity-100'
              : 'pointer-events-none absolute inset-0 flex translate-y-2 items-center justify-center opacity-0',
          )}
        >
          {stages[currentStage].label}
        </p>
      {/each}
    </div>

    {#if fileName}
      <p class="text-sm text-muted-foreground">{fileName}</p>
    {/if}
  </div>

  <div class="flex justify-center gap-2">
    {#each stageOrder as currentStage, index}
      <div
        class={cn(
          'h-2 w-2 rounded-full transition-all duration-300 ease-out',
          index === currentIndex
            ? 'scale-125 bg-primary'
            : index < currentIndex
              ? 'scale-100 bg-primary/50'
              : 'scale-100 bg-muted',
        )}
      ></div>
    {/each}
  </div>
</div>

<script lang="ts" module>
  import { cn } from '~/lib/utils'
</script>
