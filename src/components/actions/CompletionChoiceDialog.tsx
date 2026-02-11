import { CheckCircle2, Loader2, MessageSquare } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'

interface CompletionChoiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionTitle: string
  onTellUs: () => void
  onJustDone: () => void
  isLoading: boolean
}

export function CompletionChoiceDialog({
  open,
  onOpenChange,
  actionTitle,
  onTellUs,
  onJustDone,
  isLoading,
}: CompletionChoiceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nice work!</DialogTitle>
          <DialogDescription>You completed: {actionTitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={onTellUs}
            disabled={isLoading}
            className="w-full h-auto flex-col items-start gap-1 px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white"
          >
            <span className="flex items-center gap-2 font-medium">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <MessageSquare className="size-4" />
              )}
              Tell us about it
            </span>
            <span className="text-xs font-normal text-violet-200">
              Share what you did and update your profile
            </span>
          </Button>

          <Button
            variant="ghost"
            onClick={onJustDone}
            disabled={isLoading}
            className="w-full h-auto flex-col items-start gap-1 px-4 py-3"
          >
            <span className="flex items-center gap-2 font-medium">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              Just mark done
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Skip the debrief
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
