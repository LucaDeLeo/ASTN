<script lang="ts">
  import { AlertTriangle, X } from 'lucide-svelte'
  import { useConvexClient, useQuery } from 'convex-svelte'
  import { api } from '$convex/_generated/api'

  let {
    selectedSkills,
    onSkillsChange,
    maxSuggested = 10,
    disabled = false,
  }: {
    selectedSkills: Array<string>
    onSkillsChange: (skills: Array<string>) => void
    maxSuggested?: number
    disabled?: boolean
  } = $props()

  const convex = useConvexClient()
  const taxonomy = useQuery(api.skills.getTaxonomy)

  let container = $state<HTMLDivElement | null>(null)
  let suggestionsList = $state<HTMLUListElement | null>(null)
  let input = $state('')
  let showSuggestions = $state(false)
  let highlightedIndex = $state(-1)
  let seededTaxonomy = $state(false)

  const taxonomyList = $derived(taxonomy.data ?? [])
  const suggestions = $derived.by(() => {
    if (!input.trim() || !taxonomyList.length) {
      return []
    }

    const lowerInput = input.toLowerCase()
    return taxonomyList
      .filter(
        (skill) =>
          skill.name.toLowerCase().includes(lowerInput) &&
          !selectedSkills.includes(skill.name),
      )
      .slice(0, 8)
  })
  const showSoftLimit = $derived(selectedSkills.length >= maxSuggested)

  $effect(() => {
    highlightedIndex = -1
  })

  $effect(() => {
    if (seededTaxonomy || taxonomy.isLoading || taxonomy.data !== null) {
      return
    }

    seededTaxonomy = true
    void convex.action(api.skills.ensureTaxonomySeeded, {})
  })

  $effect(() => {
    if (highlightedIndex < 0 || !suggestionsList) {
      return
    }

    const highlightedElement = suggestionsList.children[
      highlightedIndex
    ] as HTMLElement | null
    highlightedElement?.scrollIntoView({ block: 'nearest' })
  })

  $effect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!container?.contains(event.target as Node)) {
        showSuggestions = false
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  })

  const addSkill = (skill: string) => {
    const trimmedSkill = skill.trim()
    if (trimmedSkill && !selectedSkills.includes(trimmedSkill)) {
      onSkillsChange([...selectedSkills, trimmedSkill])
    }

    input = ''
    showSuggestions = false
  }

  const removeSkill = (skill: string) => {
    onSkillsChange(selectedSkills.filter((selected) => selected !== skill))
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      highlightedIndex =
        highlightedIndex < suggestions.length - 1
          ? highlightedIndex + 1
          : highlightedIndex
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      highlightedIndex = highlightedIndex > 0 ? highlightedIndex - 1 : -1
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()

      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        addSkill(suggestions[highlightedIndex].name)
        return
      }

      if (input.trim()) {
        addSkill(input)
      }
      return
    }

    if (event.key === 'Escape') {
      showSuggestions = false
      highlightedIndex = -1
    }
  }
</script>

<div class="space-y-3" bind:this={container}>
  {#if showSoftLimit}
    <div
      class="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
    >
      <AlertTriangle class="size-4 shrink-0" />
      <span>
        Consider focusing on your top {maxSuggested} skills for better matching
      </span>
    </div>
  {/if}

  {#if selectedSkills.length > 0}
    <div class="flex flex-wrap gap-2">
      {#each selectedSkills as skill (skill)}
        <span
          class="inline-flex items-center gap-1 rounded-full bg-coral-100 px-3 py-1 text-sm text-coral-800 transition-colors hover:bg-coral-200"
        >
          {skill}
          <button
            type="button"
            class="rounded-full text-coral-600 transition-colors hover:text-coral-900 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:ring-offset-1"
            aria-label={`Remove ${skill}`}
            disabled={disabled}
            onclick={() => removeSkill(skill)}
          >
            <X class="size-3.5" />
          </button>
        </span>
      {/each}
    </div>
  {/if}

  <div class="relative">
    <input
      type="text"
      bind:value={input}
      placeholder="Type to search skills..."
      disabled={disabled}
      class="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-coral-500 disabled:cursor-not-allowed disabled:opacity-50"
      onfocus={() => {
        showSuggestions = true
      }}
      oninput={() => {
        showSuggestions = true
      }}
      onkeydown={handleKeyDown}
      onblur={() => {
        if (!input.trim()) {
          highlightedIndex = -1
        }
      }}
    />

    {#if showSuggestions && suggestions.length > 0}
      <ul
        bind:this={suggestionsList}
        class="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg"
      >
        {#each suggestions as skill, index (skill.name)}
          <li>
            <button
              type="button"
              class={`flex w-full items-center justify-between px-3 py-2 text-left ${
                index === highlightedIndex ? 'bg-coral-50' : 'hover:bg-slate-50'
              }`}
              onmouseenter={() => {
                highlightedIndex = index
              }}
              onclick={() => addSkill(skill.name)}
            >
              <span class="text-foreground">{skill.name}</span>
              <span
                class="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
              >
                {skill.category}
              </span>
            </button>
          </li>
        {/each}
      </ul>
    {:else if showSuggestions && input.trim() && suggestions.length === 0}
      <div
        class="absolute z-10 mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 shadow-lg"
      >
        Press Enter to add "{input.trim()}" as a custom skill
      </div>
    {/if}
  </div>

  <p class="text-xs text-slate-500">
    Select from AI safety taxonomy or add your own skills
  </p>
</div>
