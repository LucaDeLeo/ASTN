# Phase 3: Profiles - Research

**Researched:** 2026-01-17
**Domain:** Profile Management with Multi-Step Wizard, LLM Enrichment, Skills Taxonomy, Privacy Controls
**Confidence:** HIGH

## Summary

Phase 3 involves building a comprehensive profile creation system with multi-step wizard, auto-save on blur, AI safety skills selection, LLM-powered enrichment conversation, privacy controls, and completeness tracking. The existing codebase uses Convex + TanStack Router + React, with Claude Sonnet/Haiku for LLM operations.

Key technical domains researched:

1. **Multi-step wizard patterns** in React with state management
2. **Auto-save with debounce** for Convex mutations
3. **Claude tool use** for structured data extraction from conversations
4. **Tag input with autocomplete** for skills selection
5. **Section-level privacy controls** with dropdown visibility settings
6. **Profile completeness tracking** as a checklist

**Primary recommendation:** Build a React wizard using local component state with URL step sync via TanStack Router search params, auto-save individual fields via debounced Convex mutations on blur, and use Claude tool use for structured extraction from the enrichment conversation.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)

| Library           | Version  | Purpose                   | Why Standard                               |
| ----------------- | -------- | ------------------------- | ------------------------------------------ |
| Convex            | ^1.31.0  | Backend mutations/queries | Already used; real-time sync built-in      |
| TanStack Router   | ^1.132.2 | URL-synced wizard steps   | Already used; search params for step state |
| @anthropic-ai/sdk | Latest   | Claude API calls          | Direct Anthropic SDK for tool use          |
| React 19          | ^19.2.1  | UI framework              | Already in project                         |

### Supporting (New for Phase 3)

| Library                               | Version | Purpose                  | When to Use                                    |
| ------------------------------------- | ------- | ------------------------ | ---------------------------------------------- |
| @convex-dev/agent                     | Latest  | LLM conversation threads | Optional - for persistent conversation history |
| @convex-dev/persistent-text-streaming | Latest  | Stream LLM responses     | For real-time enrichment conversation UI       |
| date-fns                              | ^4.1.0  | Date formatting          | Already in project - for work history dates    |

### Alternatives Considered

| Instead of           | Could Use                  | Tradeoff                                                            |
| -------------------- | -------------------------- | ------------------------------------------------------------------- |
| Local wizard state   | react-hook-form with steps | RHF adds complexity; simple useState sufficient for wizard          |
| Anthropic SDK direct | Vercel AI SDK              | AI SDK adds abstraction; direct SDK gives more control for tool use |
| Custom debounce      | lodash.debounce            | lodash adds dependency; simple custom hook sufficient               |

**Installation:**

```bash
# Optional - only if using Convex agent components
npm install @convex-dev/agent @convex-dev/persistent-text-streaming
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── routes/
│   └── profile/
│       ├── index.tsx           # Profile view (read-only)
│       └── edit.tsx            # Wizard entry point
├── components/
│   └── profile/
│       ├── wizard/
│       │   ├── ProfileWizard.tsx       # Main wizard container
│       │   ├── WizardProgress.tsx      # Completeness checklist
│       │   ├── steps/
│       │   │   ├── BasicInfoStep.tsx   # Name, location, education
│       │   │   ├── WorkHistoryStep.tsx # Work experience entries
│       │   │   ├── SkillsStep.tsx      # Tag input with taxonomy
│       │   │   ├── GoalsStep.tsx       # Career goals, interests
│       │   │   ├── EnrichmentStep.tsx  # LLM conversation
│       │   │   └── PrivacyStep.tsx     # Visibility controls
│       │   └── hooks/
│       │       ├── useAutoSave.ts      # Debounced save on blur
│       │       └── useWizardStep.ts    # Step navigation
│       ├── skills/
│       │   ├── SkillsInput.tsx         # Tag input with autocomplete
│       │   └── SkillChip.tsx           # Individual skill chip
│       ├── enrichment/
│       │   ├── EnrichmentChat.tsx      # Chat UI for LLM
│       │   ├── ExtractionReview.tsx    # Accept/reject extractions
│       │   └── hooks/
│       │       └── useEnrichment.ts    # Conversation + extraction logic
│       └── privacy/
│           ├── SectionVisibility.tsx   # Per-section dropdown
│           └── OrgSelector.tsx         # Search + browse orgs

convex/
├── profiles.ts                 # Profile CRUD mutations/queries
├── profileSections.ts          # Individual section mutations
├── skills.ts                   # Skills taxonomy queries
├── organizations.ts            # Org list for privacy controls
├── enrichment/
│   ├── conversation.ts         # Chat mutations (save messages)
│   ├── extraction.ts           # LLM extraction action
│   └── prompts.ts              # Prompt templates
└── schema.ts                   # Updated with profile tables
```

### Pattern 1: Multi-Step Wizard with URL State

**What:** Sync wizard step to URL search params for bookmarkable/shareable progress
**When to use:** Multi-step forms where users might refresh or share their progress
**Example:**

```typescript
// routes/profile/edit.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';

const searchSchema = z.object({
  step: z.enum(['basic', 'work', 'skills', 'goals', 'enrichment', 'privacy']).optional().default('basic'),
});

export const Route = createFileRoute('/profile/edit')({
  validateSearch: searchSchema,
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const { step } = Route.useSearch();
  const navigate = useNavigate();

  const goToStep = (newStep: string) => {
    navigate({ search: { step: newStep } });
  };

  return (
    <ProfileWizard
      currentStep={step}
      onStepChange={goToStep}
    />
  );
}
```

### Pattern 2: Auto-Save on Blur with Debounce

**What:** Save individual fields when user leaves them, with debounce to prevent excessive mutations
**When to use:** Forms where you want continuous saving without explicit submit
**Example:**

```typescript
// components/profile/wizard/hooks/useAutoSave.ts
import { useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useAutoSave(profileId: string, debounceMs = 500) {
  const updateField = useMutation(api.profiles.updateField);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingUpdatesRef = useRef<Record<string, unknown>>({});

  const saveField = useCallback((field: string, value: unknown) => {
    // Accumulate pending updates
    pendingUpdatesRef.current[field] = value;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      const updates = { ...pendingUpdatesRef.current };
      pendingUpdatesRef.current = {};

      await updateField({
        profileId,
        updates,
      });
    }, debounceMs);
  }, [profileId, updateField, debounceMs]);

  return { saveField };
}

// Usage in component
function BasicInfoStep({ profileId, initialData }) {
  const { saveField } = useAutoSave(profileId);
  const [name, setName] = useState(initialData.name);

  return (
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      onBlur={() => saveField('name', name)}
    />
  );
}
```

### Pattern 3: Claude Tool Use for Structured Extraction

**What:** Use Claude's tool_use feature to extract structured profile data from conversation
**When to use:** Converting free-form LLM conversation into database-ready fields
**Example:**

```typescript
// convex/enrichment/extraction.ts
import { action } from '../_generated/server'
import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'

const profileExtractionTool = {
  name: 'extract_profile_info',
  description: 'Extract structured profile information from the conversation',
  input_schema: {
    type: 'object' as const,
    properties: {
      skills_mentioned: {
        type: 'array',
        items: { type: 'string' },
        description: 'Technical and professional skills mentioned',
      },
      career_interests: {
        type: 'array',
        items: { type: 'string' },
        description: 'AI safety areas the user is interested in',
      },
      career_goals: {
        type: 'string',
        description: 'Summary of career aspirations',
      },
      background_summary: {
        type: 'string',
        description: 'Brief summary of professional background',
      },
      seeking: {
        type: 'string',
        description:
          'What the user is looking for (roles, opportunities, mentorship)',
      },
    },
    required: ['skills_mentioned', 'career_interests'],
  },
}

export const extractFromConversation = action({
  args: {
    messages: v.array(
      v.object({
        role: v.union(v.literal('user'), v.literal('assistant')),
        content: v.string(),
      }),
    ),
  },
  handler: async (ctx, { messages }) => {
    const anthropic = new Anthropic()

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250514',
      max_tokens: 1024,
      tools: [profileExtractionTool],
      tool_choice: { type: 'tool', name: 'extract_profile_info' },
      system: `You are extracting structured profile information from a career coaching conversation.
Extract all relevant details that were discussed.`,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    })

    const toolUse = response.content.find((block) => block.type === 'tool_use')
    if (toolUse && toolUse.type === 'tool_use') {
      return toolUse.input
    }
    throw new Error('Failed to extract profile data')
  },
})
```

### Pattern 4: Tag Input with Taxonomy Autocomplete

**What:** Freeform tag input that suggests from a predefined taxonomy
**When to use:** Skills selection where users should primarily pick from standard list but can add custom
**Example:**

```typescript
// components/profile/skills/SkillsInput.tsx
import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface SkillsInputProps {
  selectedSkills: string[];
  onSkillsChange: (skills: string[]) => void;
  maxSuggested?: number;
}

export function SkillsInput({ selectedSkills, onSkillsChange, maxSuggested = 10 }: SkillsInputProps) {
  const [input, setInput] = useState('');
  const taxonomy = useQuery(api.skills.getTaxonomy);

  const suggestions = useMemo(() => {
    if (!input || !taxonomy) return [];
    const lower = input.toLowerCase();
    return taxonomy
      .filter(skill =>
        skill.name.toLowerCase().includes(lower) &&
        !selectedSkills.includes(skill.name)
      )
      .slice(0, 8);
  }, [input, taxonomy, selectedSkills]);

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      onSkillsChange([...selectedSkills, skill]);
    }
    setInput('');
  };

  const removeSkill = (skill: string) => {
    onSkillsChange(selectedSkills.filter(s => s !== skill));
  };

  return (
    <div className="space-y-2">
      {selectedSkills.length >= maxSuggested && (
        <p className="text-sm text-amber-600">
          Consider focusing on your top {maxSuggested} skills
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {selectedSkills.map(skill => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 px-3 py-1 bg-coral-100 text-coral-800 rounded-full text-sm"
          >
            {skill}
            <button onClick={() => removeSkill(skill)} className="hover:text-coral-600">
              &times;
            </button>
          </span>
        ))}
      </div>

      <div className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) {
              e.preventDefault();
              addSkill(input.trim());
            }
          }}
          placeholder="Type to search skills..."
          className="w-full px-3 py-2 border rounded-md"
        />

        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
            {suggestions.map(skill => (
              <li
                key={skill.name}
                onClick={() => addSkill(skill.name)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              >
                <span>{skill.name}</span>
                {skill.category && (
                  <span className="ml-2 text-xs text-gray-500">{skill.category}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Saving entire profile on every keystroke:** Use field-level saves with debounce
- **Storing conversation as single string:** Store as array of message objects for context preservation
- **Hard-coding skills list in frontend:** Store taxonomy in Convex for easy updates
- **Making LLM calls in Convex mutations:** Use Convex actions for non-deterministic LLM calls
- **Single visibility setting for entire profile:** Section-level granularity per user requirement

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem             | Don't Build         | Use Instead                           | Why                            |
| ------------------- | ------------------- | ------------------------------------- | ------------------------------ |
| Debounce function   | Custom debounce     | Simple custom hook or lodash.debounce | Well-tested edge cases         |
| Tag input UI        | Custom from scratch | Radix Combobox patterns               | Accessibility, keyboard nav    |
| Dropdown menu       | Custom dropdown     | @radix-ui/react-dropdown-menu         | Already in project, accessible |
| Toast notifications | Custom toast        | sonner or existing pattern            | Already established in project |
| Form validation     | Manual checks       | zod schemas                           | Type-safe, composable          |

**Key insight:** The project already has Radix UI primitives installed. Use them for accessible components rather than building custom.

## Common Pitfalls

### Pitfall 1: LLM Calls in Convex Mutations

**What goes wrong:** Convex mutations must be deterministic; LLM responses are not
**Why it happens:** Natural to want to save message and get response in one operation
**How to avoid:** Use Convex actions for LLM calls, then call mutations to persist results
**Warning signs:** Convex errors about non-deterministic operations

### Pitfall 2: Losing Conversation Context on Page Refresh

**What goes wrong:** Enrichment conversation history lost when user refreshes
**Why it happens:** Storing only in React state, not persisting to database
**How to avoid:** Persist each message to Convex immediately; load on mount
**Warning signs:** Users complaining about lost progress

### Pitfall 3: Race Conditions in Auto-Save

**What goes wrong:** Rapid edits cause out-of-order saves, older values overwrite newer
**Why it happens:** Multiple debounced mutations can resolve in different order
**How to avoid:** Include optimistic updates; use field-level timestamps; or batch updates
**Warning signs:** Data reverting unexpectedly

### Pitfall 4: Skills Taxonomy Not Extensible

**What goes wrong:** Can't add new AI safety skills without code deploy
**Why it happens:** Hard-coding skills array in frontend
**How to avoid:** Store taxonomy in Convex table; add admin interface for updates
**Warning signs:** Users can't find relevant skills

### Pitfall 5: Privacy Controls Applied Only at Query Time

**What goes wrong:** Privacy settings can be bypassed by direct API access
**Why it happens:** Only filtering in frontend or client-side queries
**How to avoid:** Enforce privacy in Convex queries/mutations with server-side checks
**Warning signs:** Users reporting visibility of hidden sections

## Code Examples

### Convex Schema for Profiles

```typescript
// convex/schema.ts - additions for Phase 3
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  // Existing opportunities table...

  profiles: defineTable({
    userId: v.string(),

    // Basic info
    name: v.optional(v.string()),
    pronouns: v.optional(v.string()),
    location: v.optional(v.string()),
    headline: v.optional(v.string()),

    // Education (array of entries)
    education: v.optional(
      v.array(
        v.object({
          institution: v.string(),
          degree: v.optional(v.string()),
          field: v.optional(v.string()),
          startYear: v.optional(v.number()),
          endYear: v.optional(v.number()),
          current: v.optional(v.boolean()),
        }),
      ),
    ),

    // Work history (array of entries)
    workHistory: v.optional(
      v.array(
        v.object({
          organization: v.string(),
          title: v.string(),
          startDate: v.optional(v.number()),
          endDate: v.optional(v.number()),
          current: v.optional(v.boolean()),
          description: v.optional(v.string()),
        }),
      ),
    ),

    // Skills (from taxonomy)
    skills: v.optional(v.array(v.string())),

    // Career goals and interests
    careerGoals: v.optional(v.string()),
    aiSafetyInterests: v.optional(v.array(v.string())),
    seeking: v.optional(v.string()),

    // LLM-generated content
    enrichmentSummary: v.optional(v.string()),

    // Privacy settings (section-level)
    privacySettings: v.optional(
      v.object({
        defaultVisibility: v.union(
          v.literal('public'),
          v.literal('connections'),
          v.literal('private'),
        ),
        sectionVisibility: v.optional(
          v.object({
            basicInfo: v.optional(v.string()),
            education: v.optional(v.string()),
            workHistory: v.optional(v.string()),
            skills: v.optional(v.string()),
            careerGoals: v.optional(v.string()),
          }),
        ),
        hiddenFromOrgs: v.optional(v.array(v.id('organizations'))),
      }),
    ),

    // Completeness tracking
    completedSections: v.optional(v.array(v.string())),
    hasEnrichmentConversation: v.optional(v.boolean()),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),

  // Enrichment conversation messages
  enrichmentMessages: defineTable({
    profileId: v.id('profiles'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    createdAt: v.number(),
  }).index('by_profile', ['profileId', 'createdAt']),

  // Extractions from enrichment (pending review)
  enrichmentExtractions: defineTable({
    profileId: v.id('profiles'),
    field: v.string(),
    extractedValue: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('accepted'),
      v.literal('rejected'),
      v.literal('edited'),
    ),
    editedValue: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_profile', ['profileId']),

  // Skills taxonomy
  skillsTaxonomy: defineTable({
    name: v.string(),
    category: v.string(),
    description: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
  })
    .index('by_category', ['category'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['category'],
    }),
})
```

### Enrichment Conversation Action

```typescript
// convex/enrichment/conversation.ts
import { action, mutation, query } from '../_generated/server'
import { v } from 'convex/values'
import Anthropic from '@anthropic-ai/sdk'
import { internal } from '../_generated/api'

const CAREER_COACH_PROMPT = `You are a friendly career coach helping someone build their AI safety career profile.

Your tone is:
- Warm and encouraging, like a supportive mentor
- Curious and exploratory ("Tell me more about...")
- Not interrogative or clinical

Your goal is to understand:
1. Their background and how they got interested in AI safety
2. Specific skills and experiences relevant to the field
3. What types of roles or opportunities they're seeking
4. What motivates them about AI safety work

Ask open-ended questions. When you feel you have enough context (usually 3-8 exchanges),
let them know you have a good picture and can help populate their profile.

Current profile context:
{profileContext}`

export const sendMessage = action({
  args: {
    profileId: v.id('profiles'),
    message: v.string(),
  },
  handler: async (ctx, { profileId, message }) => {
    // Get existing conversation
    const messages = await ctx.runQuery(
      internal.enrichment.conversation.getMessages,
      { profileId },
    )

    // Get profile context
    const profile = await ctx.runQuery(internal.profiles.getInternal, {
      profileId,
    })

    // Build context string
    const profileContext = profile
      ? `Name: ${profile.name || 'Not set'}, Skills: ${profile.skills?.join(', ') || 'Not set'}`
      : 'New profile'

    // Save user message
    await ctx.runMutation(internal.enrichment.conversation.saveMessage, {
      profileId,
      role: 'user',
      content: message,
    })

    // Call Claude
    const anthropic = new Anthropic()
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20250514',
      max_tokens: 500,
      system: CAREER_COACH_PROMPT.replace('{profileContext}', profileContext),
      messages: [
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user', content: message },
      ],
    })

    const assistantMessage =
      response.content[0].type === 'text' ? response.content[0].text : ''

    // Save assistant message
    await ctx.runMutation(internal.enrichment.conversation.saveMessage, {
      profileId,
      role: 'assistant',
      content: assistantMessage,
    })

    return { message: assistantMessage }
  },
})

export const getMessages = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    return await ctx.db
      .query('enrichmentMessages')
      .withIndex('by_profile', (q) => q.eq('profileId', profileId))
      .collect()
  },
})

export const saveMessage = mutation({
  args: {
    profileId: v.id('profiles'),
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
  },
  handler: async (ctx, { profileId, role, content }) => {
    await ctx.db.insert('enrichmentMessages', {
      profileId,
      role,
      content,
      createdAt: Date.now(),
    })
  },
})
```

### Profile Completeness Calculation

```typescript
// convex/profiles.ts
import { query } from './_generated/server'
import { v } from 'convex/values'

const COMPLETENESS_SECTIONS = [
  { id: 'basicInfo', label: 'Basic Information', fields: ['name', 'location'] },
  { id: 'education', label: 'Education', fields: ['education'] },
  { id: 'workHistory', label: 'Work History', fields: ['workHistory'] },
  { id: 'skills', label: 'Skills', fields: ['skills'] },
  {
    id: 'careerGoals',
    label: 'Career Goals',
    fields: ['careerGoals', 'aiSafetyInterests', 'seeking'],
  },
  {
    id: 'enrichment',
    label: 'Profile Enrichment',
    fields: ['hasEnrichmentConversation'],
  },
  { id: 'privacy', label: 'Privacy Settings', fields: ['privacySettings'] },
]

export const getCompleteness = query({
  args: { profileId: v.id('profiles') },
  handler: async (ctx, { profileId }) => {
    const profile = await ctx.db.get(profileId)
    if (!profile) return null

    const sections = COMPLETENESS_SECTIONS.map((section) => {
      const isComplete = section.fields.every((field) => {
        const value = profile[field as keyof typeof profile]
        if (Array.isArray(value)) return value.length > 0
        if (typeof value === 'boolean') return value === true
        return value !== undefined && value !== null && value !== ''
      })

      return {
        id: section.id,
        label: section.label,
        isComplete,
      }
    })

    const completedCount = sections.filter((s) => s.isComplete).length
    const totalCount = sections.length

    return {
      sections,
      completedCount,
      totalCount,
      percentage: Math.round((completedCount / totalCount) * 100),
      isFullyComplete: completedCount === totalCount,
    }
  },
})
```

## AI Safety Skills Taxonomy

Based on research from LessWrong's Technical AI Safety Research Taxonomy (2025), the International AI Safety Report 2025, and AI safety job boards, here is a recommended skills taxonomy:

### Research Areas

- Alignment Research
- Interpretability / Mechanistic Interpretability
- AI Governance & Policy
- AI Safety Evaluation
- Robustness & Security
- Multi-Agent Safety
- Scalable Oversight
- Value Learning / RLHF
- Deceptive Alignment Detection
- Constitutional AI
- Red Teaming

### Technical Skills

- Machine Learning Engineering
- Deep Learning / Neural Networks
- Natural Language Processing
- Reinforcement Learning
- Python / PyTorch / JAX
- Statistical Analysis
- Formal Verification
- Causal Inference

### Domain Knowledge

- AI Risk Assessment
- Existential Risk
- AI Ethics
- Technology Policy
- International Coordination
- Regulatory Frameworks

### Soft Skills

- Technical Writing
- Research Communication
- Cross-functional Collaboration
- Stakeholder Engagement
- Project Management

**Note:** Store this taxonomy in Convex `skillsTaxonomy` table for easy updates without code deploys.

## State of the Art

| Old Approach                           | Current Approach                  | When Changed | Impact                                       |
| -------------------------------------- | --------------------------------- | ------------ | -------------------------------------------- |
| Vector embeddings for profile matching | Programmatic context construction | 2024+        | More explainable matches, no embedding drift |
| Prompt-only extraction                 | Claude tool use                   | 2024         | Guaranteed structured output                 |
| Form validation libraries              | Zod schemas                       | 2024+        | Type-safe, runtime + compile-time validation |
| Redux for form state                   | React useState + URL params       | 2023+        | Simpler, sufficient for wizard pattern       |

**Deprecated/outdated:**

- `react-hook-form` multi-step wizards: Overkill for simple linear wizard
- Vector search for profile-opportunity matching: Project uses programmatic context construction per ADR-003

## Open Questions

Things that couldn't be fully resolved:

1. **Streaming LLM responses in Convex**
   - What we know: Convex has @convex-dev/persistent-text-streaming component
   - What's unclear: Whether it's needed for short career coach responses
   - Recommendation: Start without streaming; add if conversation feels slow

2. **Enrichment conversation length limit**
   - What we know: Context window limits exist; user decided "adaptive length"
   - What's unclear: When exactly should LLM decide "enough info"
   - Recommendation: Prompt LLM to signal completion; track message count as backup

3. **Skills taxonomy initial data**
   - What we know: Need AI safety-specific taxonomy
   - What's unclear: Exact comprehensive list
   - Recommendation: Start with research-based list above; add admin interface for updates

## Sources

### Primary (HIGH confidence)

- Convex Documentation - Real-time mutations, actions, schema design
- Anthropic Tool Use Documentation - Structured extraction patterns
- TanStack Router Documentation - Search params for state

### Secondary (MEDIUM confidence)

- LessWrong Technical AI Safety Research Taxonomy (2025) - Skills categories
- International AI Safety Report 2025 - AI safety domain knowledge
- Convex Stack Blog - Streaming patterns, LLM integration

### Tertiary (LOW confidence)

- Web search for multi-step wizard patterns - General React patterns
- Web search for LinkedIn-style privacy controls - UI patterns only

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - Verified against existing codebase and Convex docs
- Architecture: HIGH - Follows established Convex patterns
- LLM Integration: HIGH - Anthropic tool use is well-documented
- Skills Taxonomy: MEDIUM - Based on research, may need iteration
- Privacy patterns: MEDIUM - UI patterns clear, exact UX TBD

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days - stable domain)
