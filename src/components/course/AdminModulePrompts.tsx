import { useState } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { Eye, MessageSquare, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import { PromptForm } from './PromptForm'
import { PromptResponseViewer } from './PromptResponseViewer'
import type { Id } from '../../../convex/_generated/dataModel'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'

interface AdminModulePromptsProps {
  programId: Id<'programs'>
  moduleId: Id<'programModules'>
}

const revealModeLabels = {
  immediate: 'Immediate',
  facilitator_only: 'Facilitator Only',
  write_then_reveal: 'Write Then Reveal',
}

export function AdminModulePrompts({
  programId,
  moduleId,
}: AdminModulePromptsProps) {
  const prompts = useQuery(api.course.prompts.getByModule, { moduleId })
  const removePrompt = useMutation(api.course.prompts.remove)
  const [createOpen, setCreateOpen] = useState(false)
  const [viewingPromptId, setViewingPromptId] =
    useState<Id<'coursePrompts'> | null>(null)

  const handleDelete = async (promptId: Id<'coursePrompts'>, title: string) => {
    if (
      !confirm(`Delete prompt "${title}"? This will also delete all responses.`)
    )
      return
    try {
      await removePrompt({ promptId })
      toast.success('Prompt deleted')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete prompt')
    }
  }

  if (!prompts) return null

  return (
    <div className="mt-2 ml-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-slate-400">
          {prompts.length > 0
            ? `${prompts.length} prompt${prompts.length !== 1 ? 's' : ''}`
            : ''}
        </span>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              <Plus className="mr-1 h-3 w-3" />
              Add Prompt
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Prompt</DialogTitle>
            </DialogHeader>
            <PromptForm
              programId={programId}
              attachedTo={{ type: 'module', moduleId }}
              orderIndex={prompts.length}
              onSuccess={() => setCreateOpen(false)}
              onCancel={() => setCreateOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {prompts.map((prompt) => (
        <div key={prompt._id} className="flex items-center gap-2 py-1 text-xs">
          <MessageSquare className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-sm truncate">{prompt.title}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {revealModeLabels[prompt.revealMode]}
          </Badge>
          <span className="text-slate-400">
            {prompt.fields.length} field{prompt.fields.length !== 1 ? 's' : ''}
          </span>
          <div className="ml-auto flex items-center gap-1 shrink-0">
            <Dialog
              open={viewingPromptId === prompt._id}
              onOpenChange={(open) =>
                setViewingPromptId(open ? prompt._id : null)
              }
            >
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Eye className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Responses</DialogTitle>
                </DialogHeader>
                <PromptResponseViewer promptId={prompt._id} />
              </DialogContent>
            </Dialog>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={() => handleDelete(prompt._id, prompt.title)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
