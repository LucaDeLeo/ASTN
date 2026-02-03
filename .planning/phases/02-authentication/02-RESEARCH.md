# Phase 2: Authentication - Research

**Researched:** 2026-01-17
**Domain:** Convex Auth with TanStack Start
**Confidence:** HIGH

## Summary

The project already has Convex Auth fully configured in Phase 1 with GitHub, Google, and Password providers declared in `convex/auth.ts`. The backend infrastructure is complete - what remains is setting up OAuth credentials and building the frontend UI. The roadmap's mention of "Clerk integration" is outdated; the project correctly uses Convex Auth which provides native OAuth support via `@auth/core` providers.

**Primary recommendation:** Extend existing Convex Auth setup with OAuth credentials and build custom login UI using `useAuthActions` hook. No additional auth libraries needed.

## Current State

### Already Configured (Phase 1)

- `convex/auth.ts` - Exports `auth`, `signIn`, `signOut`, `store`, `isAuthenticated` with GitHub, Google, and Password providers
- `convex/auth.config.ts` - Basic auth config pointing to CONVEX_SITE_URL
- `convex/http.ts` - HTTP router with auth routes registered via `auth.addHttpRoutes(http)`
- `convex/schema.ts` - Includes `authTables` spread providing users, sessions, accounts tables
- `@convex-dev/auth@0.0.90` and `@auth/core@0.39` installed

### Missing (Phase 2 Scope)

- OAuth credentials (Google, GitHub client ID/secret)
- `ConvexAuthProvider` wrapper in React app (currently uses plain `ConvexProvider`)
- Login page UI (`/login` route)
- Protected route guards
- Session-aware header with avatar dropdown

## Key Findings

### 1. OAuth Provider Setup (HIGH confidence)

OAuth configuration requires environment variables and callback URL setup:

**Google OAuth:**

```bash
npx convex env set AUTH_GOOGLE_ID <client_id>
npx convex env set AUTH_GOOGLE_SECRET <client_secret>
```

Callback URL: `https://<deployment>.convex.site/api/auth/callback/google`

**GitHub OAuth:**

```bash
npx convex env set AUTH_GITHUB_ID <client_id>
npx convex env set AUTH_GITHUB_SECRET <client_secret>
```

Callback URL: `https://<deployment>.convex.site/api/auth/callback/github`

**Note:** The HTTP Actions URL ends in `.site` (not `.cloud`). Find it in Convex Dashboard > Settings.

### 2. React Provider Setup (HIGH confidence)

Must replace `ConvexProvider` with `ConvexAuthProvider`:

```tsx
// Current (router.tsx)
import { ConvexProvider } from 'convex/react'

// Required change
import { ConvexAuthProvider } from '@convex-dev/auth/react'

// In Wrap component
;<ConvexAuthProvider client={convexQueryClient.convexClient}>
  {children}
</ConvexAuthProvider>
```

### 3. Client-Side Auth Hooks (HIGH confidence)

**useAuthActions** - Primary hook for triggering auth:

```tsx
import { useAuthActions } from '@convex-dev/auth/react'

function LoginForm() {
  const { signIn, signOut } = useAuthActions()

  // OAuth sign-in
  const handleGoogleSignIn = () => signIn('google')
  const handleGitHubSignIn = () => signIn('github')

  // Password sign-in/sign-up
  const handlePasswordAuth = (formData: FormData) => {
    signIn('password', formData) // formData includes email, password, flow
  }
}
```

**Authenticated/Unauthenticated components** - Conditional rendering:

```tsx
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

<AuthLoading>Loading...</AuthLoading>
<Unauthenticated><LoginForm /></Unauthenticated>
<Authenticated><Dashboard /></Authenticated>
```

### 4. Password Provider Flow (HIGH confidence)

The Password provider requires a `flow` field to distinguish sign-in vs sign-up:

```tsx
<form
  onSubmit={(e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.append('flow', isSignUp ? 'signUp' : 'signIn')
    signIn('password', formData)
  }}
>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">{isSignUp ? 'Sign Up' : 'Sign In'}</button>
</form>
```

**Custom password validation** (already possible in convex/auth.ts):

```typescript
Password({
  validatePasswordRequirements: (password: string) => {
    if (
      password.length < 8 ||
      !/\d/.test(password) ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password)
    ) {
      throw new ConvexError(
        'Password must be 8+ characters with mixed case and number',
      )
    }
  },
})
```

### 5. TanStack Start Protected Routes (HIGH confidence)

Use `beforeLoad` with redirect for route protection:

```tsx
// src/routes/_authenticated.tsx (layout route)
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: ({ context, location }) => {
    // Note: Need to pass auth state through router context
    if (!context.auth?.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
})
```

**Challenge:** TanStack Router's `beforeLoad` runs before React renders, so we need to either:

1. Pass auth state through router context (requires changes to router setup)
2. Use component-level guards with `Authenticated`/`Unauthenticated` (simpler, recommended)

**Recommended approach for this project:**

```tsx
// In protected page components
<Authenticated>
  <ProtectedContent />
</Authenticated>
<Unauthenticated>
  <Navigate to="/login" />
</Unauthenticated>
```

### 6. Getting User in Convex Functions (HIGH confidence)

```typescript
import { getAuthUserId } from '@convex-dev/auth/server'

export const protectedQuery = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) {
      throw new Error('Not authenticated')
    }
    return ctx.db.get(userId)
  },
})
```

### 7. Session Persistence (HIGH confidence)

Convex Auth handles session persistence automatically:

- Sessions stored in `authSessions` table
- Refresh tokens managed via HTTP-only cookies
- `ConvexAuthProvider` automatically restores sessions on page load
- No additional configuration needed for persistence across browser refreshes

## Standard Stack

### Core (already installed)

| Library          | Version | Purpose         | Why Standard                                    |
| ---------------- | ------- | --------------- | ----------------------------------------------- |
| @convex-dev/auth | 0.0.90  | Auth framework  | Native Convex auth, built on Auth.js            |
| @auth/core       | 0.39    | OAuth providers | Industry standard, required by @convex-dev/auth |

### Supporting (need to add)

| Library                       | Version | Purpose        | When to Use                             |
| ----------------------------- | ------- | -------------- | --------------------------------------- |
| @radix-ui/react-tabs          | latest  | Tab component  | Sign in/sign up toggle (shadcn/ui tabs) |
| @radix-ui/react-avatar        | latest  | Avatar display | Header user dropdown                    |
| @radix-ui/react-dropdown-menu | latest  | Dropdown menu  | Header user actions                     |

**Installation:**

```bash
npx shadcn@latest add tabs avatar dropdown-menu separator
```

## Architecture Patterns

### Recommended Auth Flow Structure

```
src/
├── routes/
│   ├── login.tsx           # /login page with combined sign-in/sign-up
│   ├── _authenticated.tsx  # Layout for protected routes (optional)
│   └── profile/
│       └── setup.tsx       # First-time user profile setup
├── components/
│   ├── auth/
│   │   ├── login-form.tsx      # Main login form with OAuth + password
│   │   ├── oauth-buttons.tsx   # Google/GitHub sign-in buttons
│   │   └── password-form.tsx   # Email/password form
│   └── layout/
│       ├── public-header.tsx   # Header for logged-out users (exists)
│       └── auth-header.tsx     # Header with user avatar dropdown
```

### Sign-In Form Pattern

```tsx
// OAuth first, then email/password (per user decision)
<Card>
  <OAuthButtons /> {/* Google, GitHub */}
  <Separator /> {/* "or continue with email" */}
  <Tabs>
    <TabsList>
      <TabsTrigger value="signin">Sign In</TabsTrigger>
      <TabsTrigger value="signup">Sign Up</TabsTrigger>
    </TabsList>
    <PasswordForm flow={activeTab} />
  </Tabs>
</Card>
```

### Post-Auth Redirect Pattern

```tsx
const handleAuthSuccess = () => {
  // Check if user has completed profile
  const user = useQuery(api.users.current)

  if (user && !user.profileComplete) {
    navigate({ to: '/profile/setup' })
  } else {
    navigate({ to: searchParams.redirect || '/' })
  }
}
```

## Don't Hand-Roll

| Problem          | Don't Build                   | Use Instead                            | Why                                         |
| ---------------- | ----------------------------- | -------------------------------------- | ------------------------------------------- |
| OAuth flows      | Custom OAuth implementation   | @auth/core providers via Convex Auth   | Complex redirect handling, token management |
| Session storage  | localStorage/cookies manually | Convex Auth automatic session handling | Secure HTTP-only cookies, refresh tokens    |
| Password hashing | Custom bcrypt/argon2          | Password provider built-in             | Already implemented securely                |
| Auth state sync  | Custom WebSocket sync         | ConvexAuthProvider                     | Handles auth state reactively               |
| CSRF protection  | Manual token handling         | Built into Convex Auth                 | Automatic for all auth actions              |

## Common Pitfalls

### Pitfall 1: Using ConvexProvider instead of ConvexAuthProvider

**What goes wrong:** Auth state never updates, hooks return undefined
**Why it happens:** ConvexProvider doesn't subscribe to auth state changes
**How to avoid:** Replace ConvexProvider with ConvexAuthProvider in router.tsx
**Warning signs:** `useAuthActions()` returns undefined, Authenticated component never renders

### Pitfall 2: Wrong OAuth callback URL

**What goes wrong:** OAuth redirect fails with "invalid redirect_uri"
**Why it happens:** Using .cloud URL instead of .site URL for HTTP actions
**How to avoid:** Always use `https://<deployment>.convex.site/api/auth/callback/<provider>`
**Warning signs:** OAuth popup shows error immediately after provider approval

### Pitfall 3: Missing flow field in password auth

**What goes wrong:** "Missing flow field" error on password sign-in
**Why it happens:** Password provider requires explicit signIn vs signUp distinction
**How to avoid:** Always include `flow: "signIn"` or `flow: "signUp"` in form data
**Warning signs:** Error when submitting password form

### Pitfall 4: Blocking navigation with beforeLoad auth checks

**What goes wrong:** Routes don't load, infinite redirect loops
**Why it happens:** beforeLoad runs before React context is available
**How to avoid:** Use component-level Authenticated/Unauthenticated guards instead
**Warning signs:** Page never loads, browser shows redirect loop error

### Pitfall 5: Not handling AuthLoading state

**What goes wrong:** Flash of unauthenticated content, then authenticated content
**Why it happens:** Auth state takes a moment to restore from session
**How to avoid:** Always wrap auth-dependent UI in AuthLoading check
**Warning signs:** Login button flashes briefly on protected pages

## Code Examples

### OAuth Button Component

```tsx
// Source: Convex Auth docs + user decision (branded buttons)
import { useAuthActions } from '@convex-dev/auth/react'

export function OAuthButtons() {
  const { signIn } = useAuthActions()

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        onClick={() => signIn('google')}
        className="w-full"
      >
        <GoogleIcon className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
      <Button
        variant="outline"
        onClick={() => signIn('github')}
        className="w-full"
      >
        <GithubIcon className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  )
}
```

### Password Form with Validation

```tsx
// Source: Convex Auth Password docs + user decisions
import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'

export function PasswordForm({ flow }: { flow: 'signIn' | 'signUp' }) {
  const { signIn } = useAuthActions()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('flow', flow)

    try {
      await signIn('password', formData)
    } catch (err) {
      // Generic error per user decision
      setError('Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="password" type="password" placeholder="Password" required />
      {error && <p className="text-destructive text-sm">{error}</p>}
      <Button type="submit" disabled={loading}>
        {flow === 'signIn' ? 'Sign In' : 'Create Account'}
      </Button>
    </form>
  )
}
```

### Auth-Aware Header

```tsx
// Source: Convex Auth docs
import { Authenticated, Unauthenticated, AuthLoading } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'

export function AuthHeader() {
  const { signOut } = useAuthActions()

  return (
    <header>
      <AuthLoading>
        <Skeleton className="h-8 w-8 rounded-full" />
      </AuthLoading>
      <Unauthenticated>
        <Button asChild>
          <Link to="/login">Sign In</Link>
        </Button>
      </Unauthenticated>
      <Authenticated>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>...</Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Authenticated>
    </header>
  )
}
```

## Open Questions

1. **First-time user detection**
   - What we know: Can query user profile to check if complete
   - What's unclear: Exact fields that indicate "profile complete"
   - Recommendation: Add `profileSetupComplete: boolean` to users table, set true after profile setup

2. **Account linking UX**
   - What we know: User wants smart suggestion for existing accounts
   - What's unclear: How Convex Auth surfaces "email exists with different provider"
   - Recommendation: Check for specific error codes in signIn catch block, may need custom query

## Sources

### Primary (HIGH confidence)

- Convex Auth setup docs: https://labs.convex.dev/auth/setup
- Convex Auth OAuth config: https://labs.convex.dev/auth/config/oauth
- Convex Auth Password config: https://labs.convex.dev/auth/config/passwords
- Convex Auth authorization: https://labs.convex.dev/auth/authz
- TanStack Router authenticated routes: https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes

### Secondary (MEDIUM confidence)

- Exa code search results for @convex-dev/auth patterns
- TanStack Router GitHub discussions on beforeLoad auth

### Tertiary (LOW confidence)

- None - all findings verified with official docs

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All from installed packages and official docs
- Architecture: HIGH - Based on existing project patterns and official examples
- Pitfalls: HIGH - Documented in official guides and GitHub issues
- OAuth setup: HIGH - Official Convex Auth documentation

**Research date:** 2026-01-17
**Valid until:** 2026-02-17 (30 days - stable libraries)
