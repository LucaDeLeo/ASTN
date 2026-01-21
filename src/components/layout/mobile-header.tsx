import { Link } from "@tanstack/react-router"

import { HamburgerMenu } from "~/components/layout/hamburger-menu"

interface MobileHeaderProps {
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function MobileHeader({ user }: MobileHeaderProps) {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b bg-background pt-[var(--safe-area-inset-top)]"
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link to="/" className="font-semibold font-mono text-foreground">
          ASTN
        </Link>
        <HamburgerMenu user={user} />
      </div>
    </header>
  )
}
