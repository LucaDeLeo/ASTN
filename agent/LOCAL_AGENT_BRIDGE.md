# Local Agent Bridge

A generic package that lets any web application add a conversational AI sidebar powered by the user's own Anthropic Max plan. The bridge runs locally on the user's machine and connects to the web app via WebSocket. Zero per-token cost to the app developer.

## Why

SaaS apps want to offer AI-powered features (chat with your data, admin assistants, etc.) but face a cost problem: every API call costs money, and usage scales with users. The Local Agent Bridge flips this — the LLM runs on the user's own subscription. The app just defines tools and a system prompt.

**Current state**: ASTN has a working implementation in `agent/` that's ASTN-specific. This doc describes extracting it into a generic, reusable package.

## Architecture

```
Browser (any web app)              Local CLI (user's machine)
┌─────────────────────┐           ┌──────────────────────────┐
│ <AgentSidebar />     │◄─────────►│ local-agent-bridge       │
│ useLocalAgent() hook │  ws://    │ Anthropic Agent SDK      │
│                      │  :3002   │ Tool execution engine     │
└──────────────────────┘           └──────────────────────────┘
```

The browser sends tool definitions + auth tokens + system prompt over the WebSocket. The bridge handles the Agent SDK, tool execution, and streaming.

## Package Structure

```
@anthropic/local-agent-bridge/
├── src/
│   ├── cli.ts              # Entry point: --port flag, token generation, open browser
│   ├── server.ts           # Bun.serve() WebSocket server
│   ├── agent.ts            # Agent SDK wrapper (query + MCP tools)
│   ├── sdk-mapper.ts       # Maps SDK stream events to bridge protocol
│   ├── tools/
│   │   ├── convex.ts       # ConvexClient tool executor
│   │   ├── http.ts         # HTTP endpoint tool executor
│   │   └── types.ts        # Tool definition types
│   └── protocol.ts         # Shared WebSocket message types
├── react/
│   ├── useLocalAgent.ts    # React hook (WebSocket + streaming)
│   ├── AgentSidebar.tsx    # Drop-in sidebar component
│   ├── AgentChat.tsx       # Chat UI with markdown + tool cards
│   └── index.ts            # React exports
├── package.json
└── README.md
```

## WebSocket Protocol

### Connection

```
ws://localhost:{port}?token={bridgeToken}
```

The bridge generates a random token on startup and opens the browser with `#agent={token}`. The browser reads it from the hash and connects.

### Messages: Browser → Bridge

#### `init` — Configure the agent (sent once after connection opens)

```typescript
{
  type: "init",
  config: {
    // System prompt for the agent
    systemPrompt: string,

    // Model configuration
    model?: AgentModel,           // default: "claude-sonnet-4-6"
    thinking?: ThinkingConfig,    // default: { type: "adaptive" }
    maxTurns?: number,            // default: 10

    // Tool definitions
    tools: ToolDefinition[],

    // Auth for tool execution backends
    auth?: {
      // Convex: pass JWT for ConvexClient.setAuth()
      convex?: { url: string; token: string },
      // HTTP: headers added to all HTTP tool calls
      http?: { headers: Record<string, string> },
      // Custom: opaque token passed to custom tool handlers
      custom?: { token: string },
    },

    // MCP server name (tools are exposed under this namespace)
    mcpServerName?: string,       // default: "app"
  }
}
```

#### `chat` — Send a message

```typescript
{
  type: "chat",
  text: string,
  // Per-message overrides (optional)
  model?: AgentModel,
  thinking?: ThinkingConfig,
}
```

#### `refresh_auth` — Update auth tokens (e.g., Clerk JWT refresh)

```typescript
{
  type: "refresh_auth",
  auth: {
    convex?: { token: string },
    http?: { headers: Record<string, string> },
    custom?: { token: string },
  }
}
```

#### `abort` — Cancel the current generation

```typescript
{
  type: 'abort'
}
```

### Messages: Bridge → Browser

#### `ready` — Init succeeded, agent is ready

```typescript
{
  type: 'ready'
}
```

#### `text` — Streaming text delta

```typescript
{
  type: "text",
  content: string   // delta, not accumulated
}
```

#### `tool_use` — Tool call started

```typescript
{
  type: "tool_use",
  name: string,
  input: unknown
}
```

#### `tool_result` — Tool call completed

```typescript
{
  type: "tool_result",
  name: string,
  output: string,
  isError?: boolean
}
```

#### `done` — Response complete

```typescript
{
  type: 'done'
}
```

#### `error` — Error occurred

```typescript
{
  type: "error",
  message: string,
  code?: "auth_failed" | "init_failed" | "tool_error" | "sdk_error" | "aborted"
}
```

## Tool Definitions

Tools are defined by the web app and sent in the `init` message. Each tool specifies what it does and how to execute it.

```typescript
interface ToolDefinition {
  name: string
  description: string
  parameters: JsonSchema // JSON Schema for arguments

  // How to execute this tool — one of:
  handler: ConvexHandler | HttpHandler | StaticHandler
}

// Execute a Convex query/mutation/action
interface ConvexHandler {
  type: 'convex'
  function: string // e.g., "orgs.admin.getAllMembersWithProfiles"
  method?: 'query' | 'mutation' | 'action' // default: "query"
  // Static args merged with LLM-provided args
  staticArgs?: Record<string, unknown>
}

// Execute an HTTP request
interface HttpHandler {
  type: 'http'
  url: string // Template with {arg} placeholders
  method?: 'GET' | 'POST' // default: "POST"
  // Map tool args to request (default: JSON body)
  mapping?: {
    query?: Record<string, string> // arg → query param
    path?: Record<string, string> // arg → URL path segment
    body?: 'json' | 'form' // how to send remaining args
  }
}

// Return a static value (useful for context injection)
interface StaticHandler {
  type: 'static'
  value: string | Record<string, unknown>
}
```

### Example: Convex tool definitions (ASTN pattern)

```typescript
const tools: ToolDefinition[] = [
  {
    name: 'list_members',
    description: 'List all org members with profiles, names, emails, roles',
    parameters: { type: 'object', properties: {} },
    handler: {
      type: 'convex',
      function: 'orgs.admin.getAllMembersWithProfiles',
      staticArgs: { orgId: currentOrg._id },
    },
  },
  {
    name: 'get_member_profile',
    description: 'Get detailed profile for a specific member',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'The user ID' },
      },
      required: ['userId'],
    },
    handler: {
      type: 'convex',
      function: 'orgs.members.getMemberProfileForAdmin',
      staticArgs: { orgId: currentOrg._id },
    },
  },
]
```

### Example: HTTP tool definitions (generic REST API)

```typescript
const tools: ToolDefinition[] = [
  {
    name: 'search_users',
    description: 'Search users by name or email',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number' },
      },
    },
    handler: {
      type: 'http',
      url: 'https://api.example.com/users/search',
      method: 'GET',
      mapping: { query: { query: 'q', limit: 'limit' } },
    },
  },
]
```

## Tool Execution Engine

The bridge has pluggable executors:

### Convex Executor

- Creates a `ConvexClient` with the provided URL
- Authenticates via `setAuth()` with the Clerk JWT
- Calls `client.query()` / `client.mutation()` / `client.action()` with merged args (staticArgs + LLM args)
- Refreshes auth on `refresh_auth` messages

### HTTP Executor

- Makes fetch requests to the configured URL
- Adds auth headers from `auth.http.headers`
- Maps tool arguments to query params, path segments, or body per the mapping config
- Returns response body as text

### Static Executor

- Returns the configured value directly
- Useful for injecting context the LLM should know about (current user info, app state, etc.)

## Result Formatting

Tools return raw data from their backends. The bridge formats results into readable text for the LLM. Two strategies:

1. **Auto-format** (default): JSON.stringify with indentation for objects, plain text for strings. The LLM is smart enough to interpret structured data.

2. **Custom formatter**: The tool definition can include an optional `format` function (as a string template):

```typescript
{
  name: "list_members",
  // ...
  format: {
    type: "template",
    template: "## Members ({{length}})\n{{#each .}}\n- **{{profile.name}}** ({{email}}) | Role: {{membership.role}}\n{{/each}}"
  }
}
```

For v1, auto-format (JSON) is fine. Custom formatters can be added later.

## React Package

### `useLocalAgent(config)`

```typescript
import { useLocalAgent } from "@anthropic/local-agent-bridge/react"

function AdminPage() {
  const org = useQuery(api.orgs.get, { slug })
  const { getToken } = useAuth()

  const agent = useLocalAgent({
    port: 3002,
    systemPrompt: `You are an admin assistant for ${org.name}...`,
    model: "claude-opus-4-6",
    thinking: { type: "adaptive" },
    tools: [
      { name: "list_members", description: "...", parameters: {...},
        handler: { type: "convex", function: "orgs.admin.getAllMembersWithProfiles", staticArgs: { orgId: org._id } } },
    ],
    auth: {
      convex: { url: import.meta.env.VITE_CONVEX_URL, getToken: () => getToken({ template: "convex" }) },
    },
  })

  return <AgentSidebar agent={agent} side="right" />
}
```

Returns the same interface as the current `useAdminAgent`:

```typescript
interface UseLocalAgentReturn {
  status: 'disconnected' | 'connecting' | 'connected'
  messages: AgentMessage[]
  streamParts: ContentPart[]
  sendMessage: (
    text: string,
    overrides?: { model?: string; thinking?: ThinkingConfig },
  ) => void
  isStreaming: boolean
  abort: () => void
  clearHistory: () => void
}
```

### `<AgentSidebar />`

Drop-in sidebar component with all the UI already built:

```typescript
import { AgentSidebar } from "@anthropic/local-agent-bridge/react"

<AgentSidebar
  agent={agent}
  side="right"              // "left" | "right"
  defaultWidth={400}
  minWidth={280}
  maxWidth={600}
  title="Admin Agent"
  disconnectedMessage="Run `npx @anthropic/local-agent-bridge` to connect"
  keyboardShortcut="cmd+shift+."
  persistMessages={persistFn}  // optional: (messages) => void
  loadMessages={loadFn}        // optional: () => Promise<messages>
/>
```

### `<AgentChat />`

Just the chat part, for custom layouts:

```typescript
import { AgentChat } from "@anthropic/local-agent-bridge/react"

<AgentChat
  agent={agent}
  renderToolCall={(name, input, output) => <CustomToolCard ... />}
/>
```

## CLI

```bash
# Start with defaults
npx @anthropic/local-agent-bridge

# Custom port
npx @anthropic/local-agent-bridge --port 3005

# Open specific URL instead of relying on browser init
npx @anthropic/local-agent-bridge --open "http://localhost:3000/admin"

# Verbose logging
npx @anthropic/local-agent-bridge --verbose
```

The CLI:

1. Generates a random 32-byte token
2. Starts the WebSocket server on the specified port
3. Opens the browser with `#agent={token}` appended to the URL
4. Waits for the browser to connect and send `init`
5. Logs tool calls and errors to stdout

## Auth Flow

```
1. CLI starts → generates bridge token
2. CLI opens browser at app URL with #agent={token}
3. Browser reads token from hash, cleans URL
4. Browser connects WS with ?token={bridgeToken}
5. Bridge validates token
6. Browser sends `init` with Clerk JWT (or other auth)
7. Bridge creates ConvexClient, authenticates with JWT
8. Bridge sends `ready`
9. Browser sends `chat` messages
10. Every 45s, browser sends `refresh_auth` with fresh JWT
```

## Security

- **Bridge token**: Random 32-byte token, shared via URL hash (never sent to servers). Prevents other local processes from connecting to the bridge.
- **Origin check**: Bridge validates `Origin` header — only allows localhost and configured production domains.
- **Auth tokens**: Clerk JWTs passed from browser, used to authenticate Convex calls. The bridge acts as the authenticated user — existing server-side auth checks (e.g., `requireOrgAdmin`) work unchanged.
- **Tool sandboxing**: The bridge only executes tools defined in the `init` config. No arbitrary code execution. Convex tools go through the Convex permission model. HTTP tools only hit URLs specified in the tool definitions.
- **Local only**: The bridge binds to localhost. Not accessible from the network.

## Migration from ASTN Agent

The current ASTN `agent/` directory maps to this package as follows:

| ASTN file                         | Bridge equivalent                                                        |
| --------------------------------- | ------------------------------------------------------------------------ |
| `agent/cli.ts`                    | `src/cli.ts` (generic, no --org flag)                                    |
| `agent/server.ts`                 | `src/server.ts` (accepts init config instead of hardcoded org)           |
| `agent/agent.ts`                  | `src/agent.ts` (tools come from init, not hardcoded)                     |
| `agent/sdk-mapper.ts`             | `src/sdk-mapper.ts` (unchanged)                                          |
| `agent/tools/*.ts`                | Eliminated — tools defined by browser, executed by `src/tools/convex.ts` |
| `shared/admin-agent/types.ts`     | `src/protocol.ts`                                                        |
| `shared/admin-agent/constants.ts` | CLI flags (--port)                                                       |
| `src/hooks/use-admin-agent.ts`    | `react/useLocalAgent.ts`                                                 |
| `src/components/admin-agent/*`    | `react/AgentSidebar.tsx` + `AgentChat.tsx`                               |

The ASTN app would become a thin consumer:

```typescript
// src/components/admin-agent/AdminAgentProvider.tsx
import {
  useLocalAgent,
  AgentSidebar,
} from '@anthropic/local-agent-bridge/react'

const agent = useLocalAgent({
  port: 3002,
  systemPrompt: buildAdminPrompt(org.name),
  tools: buildAdminTools(org._id),
  auth: { convex: { url: CONVEX_URL, getToken } },
})
```

## Open Questions

1. **Message persistence**: Should the bridge handle persistence (SQLite locally?) or leave it to the app? Currently ASTN persists to Convex. The generic bridge should probably offer `persistMessages`/`loadMessages` callbacks and let the app decide.

2. **Multi-connection**: Should one bridge serve multiple browser tabs/windows? Currently it's 1:1. Supporting multiple connections would need session IDs.

3. **Non-Convex backends**: The Convex executor is first-class. HTTP executor covers REST APIs. Should we add GraphQL, gRPC, or database (Prisma/Drizzle) executors?

4. **Tool result formatting**: Auto-format (JSON) works but is token-heavy for large results. Should the bridge support server-side result transformers (map/filter/truncate) before passing to the LLM?

5. **Streaming tool results**: Some tools return large datasets. Should we support streaming tool results (e.g., paginated Convex queries)?

6. **Package naming**: `@anthropic/local-agent-bridge` assumes Anthropic publishes it. If community-published, maybe `local-agent-bridge` or `claude-local-bridge`.
