import { httpRouter } from 'convex/server'
import { corsHandler, streamChat } from './enrichment/streaming'
import { unsubscribeHandler } from './emails/unsubscribe'

const http = httpRouter()

// Enrichment chat streaming endpoint
http.route({
  path: '/enrichment-stream',
  method: 'POST',
  handler: streamChat,
})

// CORS preflight for streaming endpoint
http.route({
  path: '/enrichment-stream',
  method: 'OPTIONS',
  handler: corsHandler,
})

// Email unsubscribe (RFC 8058 one-click via POST, manual via GET)
http.route({
  path: '/unsubscribe',
  method: 'POST',
  handler: unsubscribeHandler,
})

http.route({
  path: '/unsubscribe',
  method: 'GET',
  handler: unsubscribeHandler,
})

export default http
