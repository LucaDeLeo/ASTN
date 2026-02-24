import { createContext, useContext } from 'react'
import { AgentFAB } from '~/components/agent-sidebar/AgentFAB'
import { BottomTabBar } from '~/components/layout/bottom-tab-bar'
import { MobileHeader } from '~/components/layout/mobile-header'

const MobileShellContext = createContext(false)

/** Returns true when already inside a MobileShell (prevents nesting). */
export function useInMobileShell() {
  return useContext(MobileShellContext)
}

interface MobileShellProps {
  children: React.ReactNode
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function MobileShell({ children, user }: MobileShellProps) {
  const alreadyInShell = useContext(MobileShellContext)

  // If a parent already rendered the shell, just pass children through
  if (alreadyInShell) {
    return children
  }

  return (
    <MobileShellContext.Provider value={true}>
      <div className="fixed inset-0 flex flex-col overflow-hidden w-full">
        <MobileHeader user={user} />
        <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain bg-cream-100">
          <div className="pb-safe-bottom w-full">{children}</div>
        </main>
        <AgentFAB />
        <BottomTabBar />
      </div>
    </MobileShellContext.Provider>
  )
}
