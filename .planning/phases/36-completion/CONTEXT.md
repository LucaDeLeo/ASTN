Now I have a thorough understanding of the entire system. Let me formulate the implementation decisions.

---

## Implementation Decisions

**[1. Completion Modal vs Inline UI for COMP-01]**

- Decision: **Dialog/modal** triggered when user clicks "Mark Done" on an in-progress action. Two buttons: "Tell us about it" and "Just mark done". The "Mark Done" button in `ActionCard` changes from directly calling `completeAction` to opening this dialog.
- Rationale: A modal is the simplest way to intercept the existing "Mark Done" flow and offer two paths without rearranging the card layout. It keeps the ActionCard clean and matches the shadcn/ui Dialog pattern already available. The decision point is brief (two buttons) so a full-page transition would be overkill.
- Confidence: **HIGH**

**[2. Where the Completion Enrichment Chat Lives (COMP-02)]**

- Decision: **Reuse the existing `EnrichmentChat` component and `useEnrichment` hook** but render them in a **new dedicated dialog/sheet** opened from the matches page, NOT by navigating to `/profile/edit?step=enrichment`. The enrichment backend (`sendMessage`) will be extended to accept an optional `contextSeed` parameter for pre-seeding the conversation with action context.
- Rationale: Navigating to the profile edit wizard would be disorienting - the user is completing an action on the matches page, not editing their profile. A sheet/dialog keeps them in context. Reusing `EnrichmentChat` and `useEnrichment` avoids duplicating chat UI. The `contextSeed` parameter lets the backend inject a system-level preamble about the completed action so the LLM starts the conversation relevant to it.
- Confidence: **HIGH**

**[3. How to Seed the Enrichment Chat with Action Context (COMP-02)]**

- Decision: **Modify the `sendMessage` action** to accept an optional `actionContext` object `{ title, description, type }`. When present, the system prompt is augmented with: "The user just completed the following career action: [title] ([type]): [description]. Start by acknowledging this accomplishment and asking them to tell you more about what they did, what they learned, and how it went." The first assistant message is auto-generated on chat open (no user message needed to start).
- Rationale: This is cleaner than pre-inserting fake messages. The LLM gets the context through the system prompt and produces a natural opening. The `completionConversationStarted` flag already exists in the schema to track this.
- Confidence: **MEDIUM** — Alternative is a separate `startCompletionChat` action that sends the seed as a first assistant message. I lean toward modifying `sendMessage` because it keeps one entry point, but a separate action could be cleaner for separation of concerns.

**[4. Separate Conversation Thread vs Reusing Existing Enrichment Messages]**

- Decision: **Use the same `enrichmentMessages` table** but add an optional `actionId` field to messages. The completion chat query filters by `actionId` to isolate this conversation from the general enrichment chat. This prevents completion messages from polluting the profile enrichment conversation.
- Rationale: Creating a separate table would duplicate schema and query logic. Adding `actionId` is minimal and lets us filter cleanly. The existing enrichment chat (for general profile enrichment) continues to work unchanged since those messages have no `actionId`. The extraction flow already works on a message array, so passing filtered messages works naturally.
- Confidence: **HIGH**

**[5. Extraction and Review Flow (COMP-03)]**

- Decision: **Reuse `ExtractionReview` component and `extractFromConversation` action unchanged.** After the completion chat reaches the "summarize" signal, show the extract button. Clicking it runs extraction on the completion conversation's messages only. The review UI renders inline in the same dialog/sheet.
- Rationale: The existing extraction and review system is already well-built with accept/reject/edit per field and "Apply to Profile" button. No reason to rebuild it. The only difference is the messages come from a filtered set (by `actionId`), which the hook can handle.
- Confidence: **HIGH**

**[6. Post-Apply Prompt to Refresh Matches (COMP-04)]**

- Decision: **After "Apply to Profile" succeeds in the completion flow, show a confirmation state in the dialog with a "Refresh Matches" button** that calls `triggerMatchComputation` (which already regenerates both matches and career actions). Dismiss/close is also available if they don't want to refresh now.
- Rationale: `triggerMatchComputation` already fires career action generation in parallel (line 220-225 of `matches.ts`), so a single call satisfies COMP-04's requirement that both matches and actions reflect the updated profile. No new backend logic needed — just a UI prompt at the right moment.
- Confidence: **HIGH**

**[7. Dialog Component Choice]**

- Decision: Use **shadcn `Dialog`** (modal) for the "Mark Done" choice (small, 2 buttons). Use **shadcn `Dialog`** (larger, scrollable) for the enrichment chat + review flow, since the chat needs ~500px height and the review cards need vertical space.
- Rationale: Sheet (slide-in panel) is an alternative but Dialog is more consistent with modal interactions. The chat already has a fixed 500px height container. A responsive dialog that's nearly full-screen on mobile works well.
- Confidence: **MEDIUM** — Sheet might feel better on mobile since it slides up from bottom. But Dialog is simpler to implement and the chat height is already capped.

**[8. State Management: Tracking Completion Conversation]**

- Decision: Use the existing `completionConversationStarted` boolean on the `careerActions` schema. Set it to `true` when the user chooses "Tell us about it". This prevents starting duplicate conversations for the same completed action. The `completeAction` mutation is called regardless of which path the user chooses (it marks the action as done in both cases).
- Rationale: The schema field already exists as a placeholder for exactly this purpose. Simple boolean is sufficient — we don't need to track conversation progress beyond "started or not".
- Confidence: **HIGH**

### Uncertainties

> **Completion chat prompt strategy**: Should the completion chat use the same `CAREER_COACH_PROMPT` with action context appended, or a distinct prompt optimized for post-completion reflection?
>
> - Option A: Append action context to existing `CAREER_COACH_PROMPT` — simpler, one prompt to maintain
> - Option B: Create a `COMPLETION_COACH_PROMPT` — better tailored ("What did you learn?" vs "Tell me about your background"), shorter conversations (2-4 exchanges vs 3-8)
>
> I lean toward **Option B** since completion conversations should be shorter and more focused than general profile enrichment, but either works.

> **Re-opening a completion conversation**: If the user already started a completion conversation (flag is true), should clicking the completed action show the previous conversation or just show the completed state?
>
> - Option A: Show previous conversation read-only — nice for reference but adds complexity
> - Option B: Just show "Conversation completed" badge — simpler, the profile updates are what matter
>
> I lean toward **Option B** for simplicity in this milestone.

### Claude's Discretion

- Exact wording of the two-path dialog ("Tell us about it" / "Just mark done" labels, supporting copy)
- Animation and transition details for dialog open/close
- Whether to show a toast notification after profile updates are applied
- Exact threshold for when the completion chat LLM signals readiness to extract (keyword list tuning)
- Whether the "Refresh Matches" prompt auto-dismisses after triggering or stays open showing progress

---

## Auto-Discuss Metadata

- **Rounds:** 2
- **Codex Available:** no
- **Uncertainties Resolution:**
- **Timestamp:** 2026-02-11T01:47:38Z

<details>
<summary>Codex Review (Round 2)</summary>

[READY] Codex not available

</details>
