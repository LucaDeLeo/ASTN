import { definePlaygroundAPI } from '@convex-dev/agent'
import { components } from './_generated/api'
import { profileAgent } from './agent/index'
import { learningAgent } from './course/sidebarAgent'

export const {
  isApiKeyValid,
  listAgents,
  listUsers,
  listThreads,
  listMessages,
  createThread,
  generateText,
  fetchPromptContext,
} = definePlaygroundAPI(components.agent, {
  agents: [profileAgent, learningAgent],
})
