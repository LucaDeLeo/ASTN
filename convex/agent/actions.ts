'use node'

import { v } from 'convex/values'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import { buildProfileContext } from '../enrichment/conversation'
import { computeProfileCompleteness } from '../profiles'
import {
  buildAgentSystemPrompt,
  buildBaishContextBlock,
  buildCompletenessBlock,
  buildPageContextBlock,
} from './prompts'
import { profileAgent } from './index'
import type { ProfileData } from '../enrichment/conversation'
import type { Id } from '../_generated/dataModel'

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
    pageContextEntityId: v.optional(v.string()),
    userEmail: v.optional(v.string()),
    preferredLanguage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (
    ctx,
    {
      threadId,
      promptMessageId,
      profileId,
      pageContext,
      pageContextEntityId,
      userEmail,
      preferredLanguage,
    },
  ) => {
    const profile = (await ctx.runQuery(internal.agent.queries.getProfileById, {
      profileId,
    })) as ProfileData | null

    const profileContext = profile
      ? buildProfileContext(profile)
      : 'New profile (no data yet)'

    // Fetch rich entity data based on page context type
    let entityData: unknown = null
    if (pageContext === 'viewing_match' && pageContextEntityId) {
      entityData = await ctx.runQuery(
        internal.agent.queries.getMatchWithOpportunity,
        {
          matchId: pageContextEntityId as Id<'matches'>,
          profileId,
        },
      )
    } else if (pageContext === 'viewing_opportunity' && pageContextEntityId) {
      entityData = await ctx.runQuery(
        internal.agent.queries.getOpportunityForContext,
        {
          opportunityId: pageContextEntityId as Id<'opportunities'>,
          profileId,
        },
      )
    } else if (pageContext === 'browsing_matches') {
      entityData = await ctx.runQuery(
        internal.agent.queries.getMatchesSummary,
        { profileId },
      )
    }

    const pageContextData = buildPageContextBlock(pageContext, entityData)

    // Compute profile completeness for the system prompt
    const completeness = computeProfileCompleteness(
      profile as unknown as Record<string, unknown> | null,
    )
    const completenessBlock = buildCompletenessBlock(completeness)

    // Check for BAISH CRM data for new profiles
    // Profile from DB has hasEnrichmentConversation but ProfileData type doesn't include it
    const fullProfile = profile as
      | (ProfileData & { hasEnrichmentConversation?: boolean })
      | null
    let baishContextBlock = ''
    const isNewProfile =
      fullProfile && !fullProfile.name && !fullProfile.hasEnrichmentConversation
    if (isNewProfile && userEmail) {
      const baishRecord = await ctx.runQuery(
        internal.agent.queries.getBaishImport,
        { email: userEmail },
      )
      if (baishRecord) {
        baishContextBlock = buildBaishContextBlock(
          baishRecord as Parameters<typeof buildBaishContextBlock>[0],
        )
      }
    }

    const system =
      buildAgentSystemPrompt(
        profileContext,
        pageContext,
        pageContextData,
        completenessBlock,
        preferredLanguage,
      ) + baishContextBlock

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
