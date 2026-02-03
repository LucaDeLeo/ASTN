import { Link } from '@tanstack/react-router'
import { useAuthActions } from '@convex-dev/auth/react'
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react'
import { LogOut, Settings, User } from 'lucide-react'

import { NotificationBell } from '~/components/notifications'
import { ThemeToggle } from '~/components/theme/theme-toggle'
import { Avatar, AvatarFallback } from '~/components/ui/avatar'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function AuthHeader() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="font-semibold text-foreground font-mono">
          AI Safety Talent Network
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

          {/* Theme toggle - visible to all users */}
          <ThemeToggle />

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
            <UserMenu />
          </Authenticated>
        </nav>
      </div>
    </header>
  )
}

function UserMenu() {
  const { signOut } = useAuthActions()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem asChild>
          <Link to="/profile" className="cursor-pointer">
            <User className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/settings" className="cursor-pointer">
            <Settings className="mr-2 size-4" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut()}
          className="cursor-pointer text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 size-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
