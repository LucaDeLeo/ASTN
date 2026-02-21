import { defineApp } from 'convex/server'
import resend from '@convex-dev/resend/convex.config.js'
import persistentTextStreaming from '@convex-dev/persistent-text-streaming/convex.config'
import agent from '@convex-dev/agent/convex.config'

const app = defineApp()

// Resend email component
// Requires RESEND_API_KEY environment variable set in Convex dashboard
// For local development, testMode is enabled (no actual emails sent)
app.use(resend)

// Persistent text streaming for enrichment chat
app.use(persistentTextStreaming)

// Agent component for chat-driven profile builder
app.use(agent)

export default app
