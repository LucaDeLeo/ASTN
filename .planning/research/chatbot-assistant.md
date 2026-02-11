# AI Career Assistant — Multi-Channel Chatbot

## The Idea

Turn ASTN's existing in-app enrichment chat into a persistent, multi-channel AI career assistant that users interact with on their preferred messaging platform. Instead of users needing to visit the web app to see matches or update their profile, the assistant reaches out to them and responds conversationally.

Inspired by [OpenClaw](https://github.com/openclaw/openclaw/) — a hub-and-spoke personal AI assistant with adapters for WhatsApp, Telegram, Slack, Discord, etc. OpenClaw is single-user/local-first; we'd adapt the pattern for multi-user/cloud (Convex).

## Why This Matters

The core ASTN insight is: people keep profiles updated when they get real value back. A chatbot massively lowers the friction for both sides of that equation:

- **Getting value**: Match alerts arrive where users already are (WhatsApp/Telegram), not buried in a web app they check monthly
- **Giving updates**: "I just started at MIRI" via text message vs. logging in, navigating to profile, editing work history form
- **Maintaining engagement**: Proactive check-ins keep the profile-growth flywheel spinning without requiring the user to remember the app exists

For the BAISH pilot (50-100 users in Buenos Aires), WhatsApp is the natural channel — it's how everyone communicates there already.

## What Exists Today

### Enrichment Chat (`convex/enrichment/conversation.ts`)

- Claude Haiku 4.5 career coach with full profile context
- Persisted messages in `enrichmentMessages` table
- Extraction pipeline: chat → detect summary signal → extract structured data → user reviews → profile update
- Two conversation types: enrichment (profile building) and completion (post-career-action debrief)

### Notifications (`convex/schema.ts`)

- `notifications` table with 10+ types (events, matches, bookings, applications, etc.)
- In-app only (bell icon notification center)
- `notificationPreferences` on profiles: match alerts, weekly digest, timezone

### Career Actions

- LLM-generated personalized career steps (replicate, collaborate, start_org, etc.)
- Full lifecycle: active → in_progress → done
- Completion conversations already feed back into enrichment

### Match System

- Tier-based matching (great/good/exploring) with explanations, probability estimates, recommendations
- Daily opportunity sync cron
- `matchesStaleAt` tracking for recomputation

## Proposed Architecture

```
User (WhatsApp/Telegram/Web)
        │
        ▼
┌─────────────────────┐
│   Channel Adapters   │
│                      │
│  WhatsApp (webhook)  │──┐
│  Telegram (webhook)  │──┤
│  In-app (existing)   │──┤
│  Email (outbound)    │──┘
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│  Convex HTTP Action  │  ← Webhook receiver + message router
│  /api/chat           │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│   AI Agent Layer     │  ← Claude with tool-calling
│                      │
│  System prompt:      │
│  "You are an AI      │
│   safety career      │
│   assistant..."      │
│                      │
│  Tools:              │
│  - getProfile()      │
│  - updateProfile()   │
│  - getMatches()      │
│  - searchOpps()      │
│  - getCareerActions() │
│  - startEnrichment() │
│  - markActionDone()  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Conversation Store  │  ← Generalized from enrichmentMessages
│                      │
│  conversations:      │
│  - userId            │
│  - channel           │
│  - type (general,    │
│    enrichment,       │
│    check-in)         │
│  - messages[]        │
│  - toolCalls[]       │
└─────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Proactive Engine    │  ← Cron-triggered outbound
│                      │
│  - New match alerts  │
│  - Weekly digest     │
│  - Progress check-in │
│  - Event reminders   │
│  - Action nudges     │
└─────────────────────┘
```

## Key Design Decisions

### 1. Channel Selection for Pilot

| Channel      | Pros                                                             | Cons                                                                   | Recommendation                            |
| ------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------- |
| **WhatsApp** | Dominant in Buenos Aires, highest engagement potential           | Business API requires Meta approval + hosting, or Baileys (unofficial) | **Start here** — highest impact for BAISH |
| **Telegram** | Free bot API, AI safety community already uses it, easy to build | Less universal than WhatsApp in LATAM                                  | Good second channel                       |
| **In-app**   | Already exists (enrichment chat)                                 | Low engagement — requires visiting the app                             | Keep as fallback, evolve UI               |
| **Email**    | Universal, good for digests                                      | Poor for conversations, slow feedback loop                             | Outbound only (digests/alerts)            |

**Recommendation**: Start with **one channel** (WhatsApp or Telegram) + keep in-app. Validate engagement before adding more.

### 2. AI Agent: Tool-Calling vs. Simple Router

**Simple router**: Match on keywords, route to existing functions. "Show my matches" → call getMatches query. Low cost, predictable, but brittle.

**Tool-calling agent**: Claude with defined tools that can reason about intent, chain actions, and handle ambiguity. "I think I want to pivot from technical alignment to governance" → updates career goals, triggers match recomputation, suggests relevant actions.

**Recommendation**: **Tool-calling agent**. The enrichment system already proves Claude can extract structured data from conversation. The agent just gets more tools. Use Haiku 4.5 to keep costs low (~$0.001/message).

### 3. Conversation Model

Generalize `enrichmentMessages` into a unified conversation system:

```typescript
// New table: assistantConversations
assistantConversations: defineTable({
  userId: v.string(),
  channel: v.union(
    v.literal('whatsapp'),
    v.literal('telegram'),
    v.literal('web'),
  ),
  status: v.union(v.literal('active'), v.literal('archived')),
  lastMessageAt: v.number(),
  createdAt: v.number(),
})
  .index('by_user', ['userId'])
  .index('by_user_channel', ['userId', 'channel']),

// New table: assistantMessages
assistantMessages: defineTable({
  conversationId: v.id('assistantConversations'),
  role: v.union(
    v.literal('user'),
    v.literal('assistant'),
    v.literal('system'),  // for tool results, context injection
  ),
  content: v.string(),
  channel: v.string(),          // which channel this message came from
  toolCalls: v.optional(v.array(v.object({
    tool: v.string(),
    args: v.string(),           // JSON
    result: v.optional(v.string()),
  }))),
  createdAt: v.number(),
})
  .index('by_conversation', ['conversationId', 'createdAt']),
```

The existing `enrichmentMessages` table stays — it serves the in-app enrichment widget. The new tables handle the general assistant. Over time, the enrichment flow could migrate to be one "mode" of the assistant.

### 4. Proactive Outreach

The assistant shouldn't just wait for messages. Key triggers:

| Trigger              | Message                                                             | Cadence                  |
| -------------------- | ------------------------------------------------------------------- | ------------------------ |
| New great-tier match | "A new role at {org} looks like a great fit for you. Want details?" | Immediate                |
| Weekly digest        | Summary of new matches, action progress, upcoming events            | Weekly (user's timezone) |
| Career action stale  | "You started '{action}' 3 weeks ago — how's it going?"              | 2-3 weeks after start    |
| Profile incomplete   | "Your profile is missing {section} — want to chat about it?"        | Once, after 1 week       |
| Post-event check-in  | "How was {event}? Did you meet anyone interesting?"                 | Day after event          |

### 5. User Identity Linking

Users need to connect their ASTN account to their messaging platform. Options:

- **Magic link**: User sends "/start" to the bot, gets a unique link to click that authenticates their ASTN account and links the channel
- **Code verification**: Web app shows a 6-digit code, user sends it to the bot
- **QR code**: Scan from web app to link WhatsApp/Telegram

**Recommendation**: Magic link — simplest UX, no code to type.

### 6. Privacy Considerations

- Users must explicitly opt in to each channel
- Sensitive data (full match explanations, probability estimates) can flow through the chat since it's their personal conversation
- Profile updates via chat should use the same extraction → review flow (user confirms before data is written)
- Provide easy opt-out: "stop" or "/pause" to halt all proactive messages
- Channel-specific: WhatsApp messages are E2E encrypted; Telegram bot messages are not — note this in onboarding

## Validation Plan

### Phase 0: User Research (1-2 weeks, no code)

Before building anything:

1. **Survey BAISH users** (5-10 interviews or a short form):
   - "How often do you check ASTN?" (validates engagement gap)
   - "Would you want career updates via WhatsApp/Telegram?" (validates channel preference)
   - "What would you want to tell/ask a career assistant?" (validates use cases)
   - "How often would you want to hear from it?" (validates cadence)

2. **Check WhatsApp Business API feasibility**:
   - Does BAISH/ASTN qualify for a WhatsApp Business account?
   - Cost: Meta charges per conversation (~$0.05-0.08 per 24h window in Argentina)
   - Alternative: Telegram is free and trivial to set up — could prototype there first

3. **Define success metrics**:
   - Profile update frequency (before vs. after chatbot)
   - Match view/engagement rate
   - User retention at 30/60/90 days
   - Messages exchanged per user per week

### Phase 1: Telegram Prototype (1-2 weeks)

Build the minimum to test the core hypothesis: **do users engage more through chat than the web app?**

**Scope**:

- Telegram bot (grammY library) with Convex HTTP action webhook
- Tool-calling Claude agent with 3 tools: `getProfile`, `getMatches`, `updateCareerGoals`
- Account linking via magic link
- One proactive trigger: new great-tier match alert
- Reuse existing enrichment extraction pipeline for profile updates

**Not in scope**: WhatsApp, conversation history UI in web app, weekly digests, all tool types.

**Ship to**: 5-10 BAISH beta testers.

### Phase 2: Full Agent + Proactive Engine (2-3 weeks)

If Phase 1 validates engagement:

- Expand tool set (full profile CRUD, opportunity search, career actions, events)
- Add proactive outreach engine (match alerts, check-ins, digests)
- Build conversation history view in web app (see what you discussed with the bot)
- User preferences: cadence, mute, channel selection

### Phase 3: WhatsApp + Scale (2-3 weeks)

- WhatsApp Business API integration
- Channel preference routing (user picks primary channel)
- Rate limiting and cost management
- Admin view: see engagement metrics from chatbot interactions

## Cost Estimates

### Per-user per-month (active user, ~20 messages/month)

| Component                                         | Cost                       |
| ------------------------------------------------- | -------------------------- |
| Claude Haiku 4.5 (~20 messages, ~500 tokens each) | ~$0.02                     |
| Telegram Bot API                                  | Free                       |
| WhatsApp Business API (~4 conversations/month)    | ~$0.20-0.32                |
| Convex (included in existing plan)                | $0 marginal                |
| **Total (Telegram)**                              | **~$0.02/user/month**      |
| **Total (WhatsApp)**                              | **~$0.22-0.34/user/month** |

At 100 users: $2/month (Telegram) or $22-34/month (WhatsApp). Very manageable.

## Open Questions

1. **Should the assistant replace or complement the existing enrichment chat?** Leaning toward complement — the in-app enrichment is a focused onboarding flow; the assistant is an ongoing relationship.

2. **How much autonomy for profile updates?** Current enrichment flow requires user review of extractions. Should the chatbot be able to do "quick updates" without the full extraction review? (e.g., "Add Python to my skills" → just add it, confirm in chat)

3. **Org-level assistant?** Could org admins also interact with an assistant? ("Who are our at-risk members?" "Send a check-in to people who haven't attended in 2 months.") This is a different product but uses the same infra.

4. **Voice messages?** WhatsApp users in LATAM send a lot of voice messages. Could the assistant handle speech-to-text? (Whisper API → text → normal flow.) Nice-to-have but adds complexity.

5. **Multi-language?** BAISH users speak Spanish and English. Claude handles both natively, but proactive messages need to be in the user's preferred language.

## References

- [OpenClaw](https://github.com/openclaw/openclaw/) — Hub-and-spoke personal AI assistant with multi-channel adapters
- [grammY](https://grammy.dev/) — Telegram Bot framework for TypeScript/Deno
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api) — Official cloud API
- [Convex HTTP Actions](https://docs.convex.dev/functions/http-actions) — Webhook endpoint pattern
- [Claude Tool Use](https://docs.anthropic.com/en/docs/tool-use) — Tool-calling for the agent layer
