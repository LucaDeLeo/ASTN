import { BottomTabBar } from "~/components/layout/bottom-tab-bar"
import { MobileHeader } from "~/components/layout/mobile-header"

interface MobileShellProps {
  children: React.ReactNode
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function MobileShell({ children, user }: MobileShellProps) {
  return (
    <div className="min-h-screen">
      <MobileHeader user={user} />
      <main className="pt-14 pb-safe-bottom">
        {children}
      </main>
      <BottomTabBar />
    </div>
  )
}
