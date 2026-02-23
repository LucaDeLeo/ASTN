import { Link } from '@tanstack/react-router'
import { UserButton, useUser } from '@clerk/clerk-react'
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useQuery,
} from 'convex/react'
import { Settings, User } from 'lucide-react'

import { api } from '../../../convex/_generated/api'
import { HamburgerMenu } from '~/components/layout/hamburger-menu'
import { NotificationBell } from '~/components/notifications'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

function OrgAvatars() {
  const memberships = useQuery(api.orgs.membership.getUserMemberships)
  if (!memberships?.length) return null
  return (
    <>
      {memberships.map((m) =>
        m.org.slug ? (
          <Tooltip key={m._id}>
            <TooltipTrigger asChild>
              <Link to="/org/$slug" params={{ slug: m.org.slug }}>
                <Avatar className="size-6">
                  {m.org.logoUrl ? (
                    <AvatarImage src={m.org.logoUrl} alt={m.org.name} />
                  ) : null}
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {m.org.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </TooltipTrigger>
            <TooltipContent>{m.org.name}</TooltipContent>
          </Tooltip>
        ) : null,
      )}
    </>
  )
}

export function AuthHeader() {
  const { user } = useUser()
  const hamburgerUser = user
    ? {
        name: user.fullName ?? user.firstName ?? 'User',
        avatarUrl: user.imageUrl,
      }
    : null

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Mobile layout */}
      <div
        className="flex md:hidden h-14 items-center justify-between px-4"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="" className="h-6" />
          <span className="font-semibold font-mono text-foreground">ASTN</span>
        </Link>
        <Authenticated>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <HamburgerMenu user={hamburgerUser} />
          </div>
        </Authenticated>
        <Unauthenticated>
          <Button size="sm" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
        </Unauthenticated>
      </div>

      {/* Desktop layout */}
      <div className="hidden md:flex container mx-auto px-4 py-4 items-center justify-between">
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

          <Link
            to="/orgs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors relative py-2"
            activeProps={{
              className:
                'text-sm text-foreground font-medium transition-colors relative py-2 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full',
            }}
          >
            Organizations
          </Link>

          <Authenticated>
            <OrgAvatars />
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
                <UserButton.Link
                  label="Settings"
                  labelIcon={<Settings className="size-4" />}
                  href="/settings"
                />
              </UserButton.MenuItems>
            </UserButton>
          </Authenticated>
        </nav>
      </div>
    </header>
  )
}
