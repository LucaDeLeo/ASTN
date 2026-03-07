import * as Sentry from '@sentry/tanstackstart-react'

Sentry.init({
  dsn: 'https://f7612c740401feef0039be0728f64cc4@o4510997439053824.ingest.de.sentry.io/4510997440692304',
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  enableLogs: true,
  integrations: [
    Sentry.httpIntegration({
      ignoreIncomingRequestUrls: [/^\/ingest/, /^\/tunnel/],
    }),
  ],
})
