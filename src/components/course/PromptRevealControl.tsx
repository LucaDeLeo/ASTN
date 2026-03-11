import { useState } from 'react'
import { useMutation } from 'convex/react'
import { CheckCircle2, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import { Button } from '~/components/ui/button'

interface PromptRevealControlProps {
  promptId: Id<'coursePrompts'>
  revealMode: 'immediate' | 'facilitator_only' | 'write_then_reveal'
  revealedAt?: number
}

export function PromptRevealControl({
  promptId,
  revealMode,
  revealedAt,
}: PromptRevealControlProps) {
  const triggerReveal = useMutation(api.course.prompts.triggerReveal)
  const [isRevealing, setIsRevealing] = useState(false)

  if (revealMode !== 'write_then_reveal') return null

  if (revealedAt) {
    return (
      <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/30 dark:text-green-300">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        Responses revealed at {new Date(revealedAt).toLocaleString()}
      </div>
    )
  }

  const handleReveal = async () => {
    setIsRevealing(true)
    try {
      await triggerReveal({ promptId })
      toast.success('Responses revealed to all participants')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reveal')
    } finally {
      setIsRevealing(false)
    }
  }

  return (
    <div className="flex items-center justify-between rounded-md bg-amber-50 p-3 dark:bg-amber-950/30">
      <span className="text-sm text-amber-800 dark:text-amber-300">
        Responses are currently hidden from participants
      </span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" disabled={isRevealing}>
            <Eye className="mr-1 h-3 w-3" />
            Reveal All Responses
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reveal all responses?</AlertDialogTitle>
            <AlertDialogDescription>
              This will make all submitted responses visible to all
              participants. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReveal}>
              Reveal Responses
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
