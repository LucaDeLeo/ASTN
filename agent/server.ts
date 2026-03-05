import { ConvexClient } from 'convex/browser'
import { api } from '../convex/_generated/api'
import { createAdminAgent } from './agent'
import { ADMIN_AGENT_WS_PORT } from '../shared/admin-agent/constants'
import type { AdminClientMessage } from '../shared/admin-agent/types'
import type { Id } from '../convex/_generated/dataModel'

const token = process.env.AGENT_TOKEN!
const convexUrl = process.env.VITE_CONVEX_URL ?? process.env.CONVEX_URL
if (!convexUrl) {
  throw new Error('Missing VITE_CONVEX_URL or CONVEX_URL in environment')
}

// Track per-connection state
type ConnectionState = {
  convex: ConvexClient
  agent: ReturnType<typeof createAdminAgent>
  orgName: string
  clerkToken: string
  tokenHolder: { current: string }
}

const connections = new Map<object, ConnectionState>()

Bun.serve({
  port: ADMIN_AGENT_WS_PORT,
  async fetch(req, server) {
    const url = new URL(req.url)
    const clientToken = url.searchParams.get('token')

    if (clientToken !== token) {
      console.log(
        `Auth failed: got "${clientToken?.slice(0, 8)}..." expected "${token.slice(0, 8)}..."`,
      )
      return new Response('Unauthorized', { status: 401 })
    }

    const origin = req.headers.get('origin')
    if (origin && !isAllowedOrigin(origin)) {
      return new Response('Forbidden', { status: 403 })
    }

    const orgSlug = url.searchParams.get('orgSlug')
    const clerkToken = url.searchParams.get('clerkToken')

    if (!orgSlug || !clerkToken) {
      return new Response('Missing orgSlug or clerkToken', { status: 400 })
    }

    server.upgrade(req, { data: { orgSlug, clerkToken } as any })
  },
  websocket: {
    async open(ws) {
      const { orgSlug, clerkToken } = ws.data as unknown as {
        orgSlug: string
        clerkToken: string
      }

      try {
        // Create a dedicated ConvexClient for this connection
        const convex = new ConvexClient(convexUrl)

        // Mutable token holder — the setAuth callback reads from this
        const tokenHolder = { current: clerkToken }

        // Set auth once — callback always returns latest token
        convex.setAuth(async () => tokenHolder.current)

        // Wait for auth to actually propagate to the Convex backend
        // by polling until getUserIdentity would succeed
        let authed = false
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 200))
          try {
            // Try an authenticated query to verify auth is working
            const profile = await convex.query(
              api.profiles.getOrCreateProfile,
              {},
            )
            if (profile !== null) {
              authed = true
              break
            }
          } catch {
            // Auth not ready yet, retry
          }
        }

        if (!authed) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message:
                'Authentication failed — could not verify Clerk token with Convex',
            }),
          )
          ws.close()
          convex.close()
          return
        }

        // Resolve org by slug
        const org = await convex.query(api.orgs.directory.getOrgBySlug, {
          slug: orgSlug,
        })

        if (!org) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: `Organization not found: ${orgSlug}`,
            }),
          )
          ws.close()
          return
        }

        const agent = createAdminAgent(convex, org._id, org.name)

        const state: ConnectionState = {
          convex,
          agent,
          orgName: org.name,
          clerkToken: tokenHolder.current,
          tokenHolder,
        }

        // Store the state with a reference that lets refresh_token update the closure
        connections.set(ws, state)

        console.log(`Connected: org="${org.name}" (${org._id})`)
      } catch (e: any) {
        console.error('Connection setup failed:', e)
        ws.send(
          JSON.stringify({
            type: 'error',
            message: `Setup failed: ${e.message}`,
          }),
        )
        ws.close()
      }
    },

    async message(ws, raw) {
      const state = connections.get(ws)
      if (!state) return

      const msg: AdminClientMessage = JSON.parse(raw as string)

      switch (msg.type) {
        case 'chat': {
          try {
            for await (const event of state.agent.chat(
              msg.text,
              msg.model,
              msg.thinking,
            )) {
              ws.send(JSON.stringify(event))
            }
          } catch (e: any) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: e?.message ?? 'Unknown error',
              }),
            )
          }
          ws.send(JSON.stringify({ type: 'done' }))
          break
        }

        case 'refresh_token': {
          // Update the mutable token ref — the setAuth callback reads from this
          // Don't call setAuth() again as it triggers a re-auth cycle
          state.clerkToken = msg.clerkToken
          state.tokenHolder.current = msg.clerkToken
          console.log('Clerk token refreshed')
          break
        }
      }
    },

    close(ws) {
      const state = connections.get(ws)
      if (state) {
        state.convex.close()
        connections.delete(ws)
        console.log(`Disconnected: org="${state.orgName}"`)
      }
    },
  },
})

function isAllowedOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost(:\d+)?|safetytalent\.org)$/.test(origin)
}

console.log(`Admin agent WebSocket server listening on :${ADMIN_AGENT_WS_PORT}`)
