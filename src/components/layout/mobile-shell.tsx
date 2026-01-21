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
    <div className="fixed inset-0 flex flex-col">
      <MobileHeader user={user} />
      <main className="flex-1 overflow-y-auto overscroll-contain">
        <div className="pb-safe-bottom">
          {children}
        </div>
      </main>
      <BottomTabBar />
    </div>
  )
}
