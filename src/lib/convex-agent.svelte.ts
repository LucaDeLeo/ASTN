import { api } from '$convex/_generated/api'
import type { Id } from '$convex/_generated/dataModel'

export type AgentMessage = {
  _creationTime: number
  key: string
  order: number
  role: string
  status: string
  stepOrder: number
  text: string
}

export function getAgentMessageArgs(threadId: string) {
  return {
    threadId,
    paginationOpts: {
      cursor: null,
      numItems: 100,
    },
    streamArgs: {
      kind: 'list' as const,
      startOrder: 0,
    },
  }
}

export function toAgentMessages(result: unknown): AgentMessage[] {
  const page = (result as { page?: AgentMessage[] } | null)?.page ?? []
  return [...page].reverse()
}

export function createSmoothText(text: string) {
  return text
}

export async function optimisticallySendMessage(
  convex: {
    mutation: any
  },
  args: {
    threadId: string
    prompt: string
    profileId: Id<'profiles'>
    pageContext?: string
    pageContextEntityId?: string
    browserLocale?: string
  },
) {
  return convex.mutation(api.agent.threadOps.sendMessage, args)
}

export async function optimisticallySendCourseMessage(
  convex: {
    mutation: any
  },
  args: {
    threadId: string
    prompt: string
    moduleId: Id<'programModules'>
  },
) {
  return convex.mutation(api.course.sidebar.sendMessage, args)
}
