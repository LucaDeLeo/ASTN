import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { PromptRenderer } from './PromptRenderer'
import type { Id } from '../../../convex/_generated/dataModel'

interface ModulePromptsProps {
  moduleId: Id<'programModules'>
  isContinueHere?: boolean
}

export function ModulePrompts({
  moduleId,
  isContinueHere,
}: ModulePromptsProps) {
  const prompts = useQuery(api.course.prompts.getByModule, { moduleId })

  if (!prompts || prompts.length === 0) return null

  return (
    <div
      className={`mt-3 space-y-3 ${isContinueHere ? 'border-l-2 border-blue-500 pl-2' : ''}`}
    >
      <p className="text-xs font-medium text-slate-500">
        Exercises:
        {isContinueHere && (
          <span className="ml-2 text-blue-600 bg-blue-50 rounded px-1.5 py-0.5">
            Continue here
          </span>
        )}
      </p>
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
