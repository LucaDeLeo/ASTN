import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { PromptRenderer } from './PromptRenderer'
import type { Id } from '../../../convex/_generated/dataModel'

interface ModulePromptsProps {
  moduleId: Id<'programModules'>
}

export function ModulePrompts({ moduleId }: ModulePromptsProps) {
  const prompts = useQuery(api.course.prompts.getByModule, { moduleId })

  if (!prompts || prompts.length === 0) return null

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-medium text-slate-500">Exercises:</p>
      {prompts.map((prompt) => (
        <PromptRenderer
          key={prompt._id}
          promptId={prompt._id}
          mode="participate"
        />
      ))}
    </div>
  )
}
