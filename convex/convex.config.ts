import { defineApp } from 'convex/server'
import resend from '@convex-dev/resend/convex.config.js'

const app = defineApp()

// Resend email component
// Requires RESEND_API_KEY environment variable set in Convex dashboard
// For local development, testMode is enabled (no actual emails sent)
app.use(resend)

export default app
