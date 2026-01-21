import * as React from "react"
import { Link } from "@tanstack/react-router"
import { useAuthActions } from "@convex-dev/auth/react"
import { HelpCircle, LogOut, Menu, Shield, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "~/components/ui/sheet"

interface HamburgerMenuProps {
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function HamburgerMenu({ user }: HamburgerMenuProps) {
  const [open, setOpen] = React.useState(false)
  const { signOut } = useAuthActions()

  const handleNavigation = () => {
    setOpen(false)
  }

  const handleLogout = () => {
    setOpen(false)
    signOut()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="touch-target"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px]" showCloseButton={false}>
        <SheetHeader className="border-b pb-4">
          {user ? (
            <SheetClose asChild>
              <Link
                to="/profile"
                onClick={handleNavigation}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-accent"
              >
                <Avatar className="size-10">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    View profile
                  </span>
                </div>
              </Link>
            </SheetClose>
          ) : (
            <div className="flex items-center gap-3 p-2">
              <Avatar className="size-10">
                <AvatarFallback className="bg-muted">
                  <User className="size-5" />
                </AvatarFallback>
              </Avatar>
              <span className="text-muted-foreground">Not signed in</span>
            </div>
          )}
        </SheetHeader>

        <nav className="flex flex-col gap-1 p-2">
          <SheetClose asChild>
            <Link
              to="/admin"
              onClick={handleNavigation}
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
            >
              <Shield className="size-5" />
              <span>Admin</span>
            </Link>
          </SheetClose>

          <a
            href="mailto:support@aisafetytalent.org"
            className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
          >
            <HelpCircle className="size-5" />
            <span>Help</span>
          </a>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10"
          >
            <LogOut className="size-5" />
            <span>Logout</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
