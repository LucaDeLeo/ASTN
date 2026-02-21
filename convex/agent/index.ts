'use node'

import { Agent, stepCountIs } from '@convex-dev/agent'
import { anthropic } from '@ai-sdk/anthropic'
import { components } from '../_generated/api'
import {
  addEducation,
  addWorkExperience,
  setAiSafetyInterests,
  setCareerGoals,
  setMatchPreferences,
  setSeeking,
  setSkills,
  updateBasicInfo,
} from './tools'

export const profileAgent = new Agent(components.agent, {
  name: 'profile-builder',
  languageModel: anthropic.chat('claude-sonnet-4-6'),
  // Instructions are set dynamically per-turn via streamText system prompt
  instructions: '',
  tools: {
    update_basic_info: updateBasicInfo,
    add_education: addEducation,
    add_work_experience: addWorkExperience,
    set_skills: setSkills,
    set_career_goals: setCareerGoals,
    set_ai_safety_interests: setAiSafetyInterests,
    set_seeking: setSeeking,
    set_match_preferences: setMatchPreferences,
  },
  stopWhen: stepCountIs(10),
})
