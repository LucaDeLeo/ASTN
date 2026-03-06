import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'
import { resolveTemplates } from '../emails/autoEmailHelpers'

/**
 * One-time migration: convert legacy flat auto-email configs to templates array.
 * Run after deploy: `npx convex run migrations/migrateAutoEmailTemplates:run`
 */
export const run = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const configs = await ctx.db.query('opportunityAutoEmails').collect()
    let migrated = 0

    for (const config of configs) {
      // Skip if already migrated
      if (config.templates && config.templates.length > 0) continue
      // Skip if no legacy data to migrate
      if (!config.triggers || !config.subject || config.markdownBody == null)
        continue

      const templates = resolveTemplates(config)
      await ctx.db.patch('opportunityAutoEmails', config._id, {
        templates,
        triggers: undefined,
        subject: undefined,
        markdownBody: undefined,
        requiresPoll: undefined,
        updatedAt: Date.now(),
      })
      migrated++
    }

    return migrated
  },
})
