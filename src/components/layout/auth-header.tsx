import { Link } from '@tanstack/react-router'
import { UserButton } from '@clerk/clerk-react'
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { User } from 'lucide-react'

import { NotificationBell } from '~/components/notifications'
import { Button } from '~/components/ui/button'

export function AuthHeader() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-7" />
          <span className="font-semibold text-foreground font-mono">
            AI Safety Talent Network
          </span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link
            to="/opportunities"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative py-2"
            activeProps={{
              className:
                'text-sm text-foreground font-medium transition-colors relative py-2 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full',
            }}
          >
            Opportunities
          </Link>

          <Authenticated>
            <Link
              to="/matches"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors relative py-2"
              activeProps={{
                className:
                  'text-sm text-foreground font-medium transition-colors relative py-2 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full',
              }}
            >
              Matches
            </Link>
          </Authenticated>

          {/* Auth state: loading, signed out, signed in */}
          <AuthLoading>
            <div className="size-8 rounded-full bg-muted animate-pulse" />
          </AuthLoading>

          <Unauthenticated>
            <Button size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </Unauthenticated>

          <Authenticated>
            <NotificationBell />
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label="ASTN Profile"
                  labelIcon={<User className="size-4" />}
                  href="/profile"
                />
              </UserButton.MenuItems>
            </UserButton>
          </Authenticated>
        </nav>
      </div>
    </header>
  )
}
