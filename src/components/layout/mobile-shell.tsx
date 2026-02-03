import { BottomTabBar } from '~/components/layout/bottom-tab-bar'
import { MobileHeader } from '~/components/layout/mobile-header'

interface MobileShellProps {
  children: React.ReactNode
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function MobileShell({ children, user }: MobileShellProps) {
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden w-full">
      <MobileHeader user={user} />
      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-cream-100">
        <div className="pb-safe-bottom w-full">{children}</div>
      </main>
      <BottomTabBar />
    </div>
  )
}
