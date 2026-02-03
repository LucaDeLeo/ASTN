import { Link } from '@tanstack/react-router'

import { HamburgerMenu } from '~/components/layout/hamburger-menu'

interface MobileHeaderProps {
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function MobileHeader({ user }: MobileHeaderProps) {
  return (
    <header
      className="shrink-0 border-b bg-background"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
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
