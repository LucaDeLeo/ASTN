import { AgentChat } from './AgentChat'
import { LiveProfileView } from './LiveProfileView'
import type { Id } from '../../../../convex/_generated/dataModel'
import { useIsMobile } from '~/hooks/use-media-query'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/ui/resizable'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'

interface AgentProfileBuilderProps {
  profileId: Id<'profiles'>
  threadId: string
}

export function AgentProfileBuilder({
  profileId,
  threadId,
}: AgentProfileBuilderProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <div className="h-[calc(100vh-65px)]">
        <Tabs defaultValue="chat" className="h-full flex flex-col">
          <TabsList className="w-full mx-4 mt-2">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 min-h-0">
            <AgentChat profileId={profileId} threadId={threadId} />
          </TabsContent>
          <TabsContent
            value="profile"
            className="flex-1 min-h-0 overflow-y-auto"
          >
            <LiveProfileView />
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-65px)]">
      <ResizablePanelGroup orientation="horizontal">
        <ResizablePanel defaultSize={45} minSize={30}>
          <AgentChat profileId={profileId} threadId={threadId} />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={55} minSize={30}>
          <LiveProfileView />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
