# Plan 39-02 Summary: Agent Tools + Program Scope

**Status:** Complete
**Commit:** `91e5879`

## What was built

- **agent/tools/facilitator.ts** — 6 read tools: get_participant_progress, get_prompt_responses, get_response_counts, get_attendance_summary, get_sidebar_conversations, get_participant_profile
- **agent/tools/facilitatorProposals.ts** — 4 proposal tools: draft_comment, draft_message, suggest_pairs, flag_pattern
- **agent/agent.ts** — `createFacilitatorAgent()` factory with program-scoped system prompt, claude-sonnet-4-6 default, MCP server pattern
- **agent/cli.ts** — `--program=<programId>` flag, sets FACILITATOR_PROGRAM_ID env, opens browser to program admin page
- **agent/server.ts** — Conditional mode: port 3003 for facilitator (vs 3002 admin), verifies program belongs to org, creates facilitator agent
- **shared/admin-agent/constants.ts** — Added FACILITATOR_AGENT_WS_PORT (3003)

## Key decisions

- Facilitator agent uses claude-sonnet-4-6 by default (cheaper for frequent program queries)
- Read tools format output as markdown for readability in chat
- Proposal tools call the public `createProposalFromAgent` mutation (ConvexClient limitation)
- Server validates program ownership before allowing connection
- Extracted `buildThinkingConfig()` and `buildPromptWithHistory()` as shared module-level helpers
