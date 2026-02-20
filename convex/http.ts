import { httpRouter } from 'convex/server'
import { corsHandler, streamChat } from './enrichment/streaming'

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

export default http
