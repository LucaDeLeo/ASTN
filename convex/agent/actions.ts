'use node'

import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { buildProfileContext } from '../enrichment/conversation'
import { buildAgentSystemPrompt } from './prompts'
import { profileAgent } from './index'
import type { ProfileData } from '../enrichment/conversation'

/**
 * Internal action that streams the agent response.
 * Loads fresh profile context, then runs agent.streamText via continueThread.
 */
export const streamResponse = internalAction({
  args: {
    threadId: v.string(),
    promptMessageId: v.string(),
    profileId: v.id('profiles'),
    pageContext: v.optional(
      v.union(
        v.literal('viewing_home'),
        v.literal('viewing_profile'),
        v.literal('editing_profile'),
        v.literal('browsing_matches'),
        v.literal('viewing_match'),
        v.literal('browsing_opportunities'),
        v.literal('viewing_opportunity'),
      ),
    ),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { threadId, promptMessageId, profileId, pageContext },
  ) => {
    const profile = (await ctx.runQuery(internal.agent.queries.getProfileById, {
      profileId,
    })) as ProfileData | null

    const profileContext = profile
      ? buildProfileContext(profile)
      : 'New profile (no data yet)'
    const system = buildAgentSystemPrompt(profileContext, pageContext)

    const { thread } = await profileAgent.continueThread(ctx, { threadId })
    // Type assertion needed: @convex-dev/agent generic resolution for
    // StreamingTextArgs resolves to `never` with complex tool types
    const result = await thread.streamText(
      { promptMessageId, system } as Parameters<typeof thread.streamText>[0],
      { saveStreamDeltas: { chunking: 'word', throttleMs: 100 } },
    )

    await result.consumeStream()

    // Mark enrichment as done after first successful response
    await ctx.runMutation(internal.agent.mutations.markEnrichmentDone, {
      profileId,
    })

    return null
  },
})
