import { useState } from 'react'
import { useQuery } from 'convex/react'
import { MessageSquare, Users } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { ConversationViewer } from '~/components/course/ConversationViewer'
import { Badge } from '~/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Spinner } from '~/components/ui/spinner'
import { cn } from '~/lib/utils'

interface FacilitatorConversationsProps {
  programId: Id<'programs'>
}

interface ThreadInfo {
  threadId: string
  userId: string
  moduleId: string
  moduleName: string
  userName: string
  createdAt: number
}

export function FacilitatorConversations({
  programId,
}: FacilitatorConversationsProps) {
  const threads = useQuery(api.course.sidebarQueries.getParticipantThreads, {
    programId,
  })
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  if (threads === undefined) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            AI Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <Spinner className="size-6" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (threads.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" />
            AI Conversations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-sm text-center py-4">
            No AI sidebar conversations yet. Conversations will appear here once
            participants start using the AI learning partner.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Group threads by userId
  const participantMap = new Map<
    string,
    { userName: string; threads: Array<ThreadInfo> }
  >()
  for (const thread of threads as Array<ThreadInfo>) {
    const existing = participantMap.get(thread.userId)
    if (existing) {
      existing.threads.push(thread)
    } else {
      participantMap.set(thread.userId, {
        userName: thread.userName,
        threads: [thread],
      })
    }
  }

  const participants = Array.from(participantMap.entries()).sort(
    ([, a], [, b]) => a.userName.localeCompare(b.userName),
  )

  const selectedParticipant = selectedUserId
    ? participantMap.get(selectedUserId)
    : null

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="size-5" />
          AI Conversations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4">
          {/* Left panel: participant list */}
          <div className="w-64 shrink-0 border-r pr-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="size-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-600">
                Participants
              </span>
            </div>
            <div className="space-y-1">
              {participants.map(
                ([userId, { userName, threads: userThreads }]) => (
                  <button
                    key={userId}
                    onClick={() => {
                      setSelectedUserId(userId)
                      setSelectedThreadId(null)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      selectedUserId === userId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-slate-50 text-foreground',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate">{userName}</span>
                      <Badge
                        variant="secondary"
                        className="ml-2 shrink-0 text-xs"
                      >
                        {userThreads.length}
                      </Badge>
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Right panel: module threads and conversation */}
          <div className="flex-1 min-w-0">
            {!selectedUserId ? (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                Select a participant to view their conversations
              </div>
            ) : selectedParticipant ? (
              <div>
                <h4 className="text-sm font-medium text-foreground mb-3">
                  {selectedParticipant.userName} &mdash; Module Conversations
                </h4>
                <div className="space-y-2">
                  {selectedParticipant.threads.map((thread) => (
                    <div key={thread.threadId}>
                      <button
                        onClick={() =>
                          setSelectedThreadId(
                            selectedThreadId === thread.threadId
                              ? null
                              : thread.threadId,
                          )
                        }
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                          selectedThreadId === thread.threadId
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-slate-200 hover:bg-slate-50',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{thread.moduleName}</Badge>
                          <span className="text-xs text-slate-400">
                            {new Date(thread.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </span>
                        </div>
                      </button>
                      {selectedThreadId === thread.threadId && (
                        <div className="mt-2 border rounded-lg bg-background">
                          <ConversationViewer threadId={thread.threadId} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
