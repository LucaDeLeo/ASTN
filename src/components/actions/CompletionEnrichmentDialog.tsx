import { useEffect, useRef, useState } from 'react'
import { useAction, useMutation } from 'convex/react'
import { CheckCircle2, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { useCompletionEnrichment } from './hooks/useCompletionEnrichment'
import type { Id } from '../../../convex/_generated/dataModel'
import { EnrichmentChat } from '~/components/profile/enrichment/EnrichmentChat'
import { ExtractionReview } from '~/components/profile/enrichment/ExtractionReview'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'

interface CompletionEnrichmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  actionId: Id<'careerActions'>
  actionTitle: string
  actionDescription: string
  actionType: string
  profileId: Id<'profiles'>
}

export function CompletionEnrichmentDialog({
  open,
  onOpenChange,
  actionId,
  actionTitle,
  actionDescription,
  actionType,
  profileId,
}: CompletionEnrichmentDialogProps) {
  const [mode, setMode] = useState<'chat' | 'review' | 'success'>('chat')
  const [isApplying, setIsApplying] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const hasAutoGreeted = useRef(false)

  const updateField = useMutation(api.profiles.updateField)
  const triggerMatchComputation = useAction(api.matches.triggerMatchComputation)

  const {
    messages,
    input,
    setInput,
    isLoading,
    error,
    shouldShowExtract,
    isExtracting,
    extractions,
    sendMessage,
    extractProfile,
    updateExtractionStatus,
    updateExtractionValue,
  } = useCompletionEnrichment({ profileId, actionId })

  // Auto-send opening message on mount
  useEffect(() => {
    if (
      open &&
      actionId &&
      messages.length === 0 &&
      !isLoading &&
      !hasAutoGreeted.current
    ) {
      hasAutoGreeted.current = true
      void sendMessage(
        `I just completed this action: ${actionTitle}. Here's what it was about: ${actionDescription}`,
        {
          title: actionTitle,
          description: actionDescription,
          type: actionType,
        },
      )
    }
  }, [
    open,
    actionId,
    messages.length,
    isLoading,
    actionTitle,
    actionDescription,
    actionType,
    sendMessage,
  ])

  const handleExtract = async () => {
    await extractProfile()
    setMode('review')
  }

  const handleApply = async () => {
    if (!extractions) return

    setIsApplying(true)

    try {
      // Build updates from accepted/edited extractions
      const updates: Record<string, unknown> = {
        hasEnrichmentConversation: true,
      }

      for (const item of extractions) {
        if (item.status === 'accepted' || item.status === 'edited') {
          const value = item.editedValue ?? item.value

          switch (item.field) {
            case 'skills_mentioned':
              updates.skills = value
              break
            case 'career_interests':
              updates.aiSafetyInterests = value
              break
            case 'career_goals':
              updates.careerGoals = value
              break
            case 'background_summary':
              updates.enrichmentSummary = value
              break
            case 'seeking':
              updates.seeking = value
              break
          }
        }
      }

      await updateField({
        profileId,
        updates: updates as Parameters<typeof updateField>[0]['updates'],
      })

      setMode('success')
    } catch (err) {
      console.error('Failed to apply extractions:', err)
    } finally {
      setIsApplying(false)
    }
  }

  const handleRefreshMatches = async () => {
    setIsRefreshing(true)
    try {
      await triggerMatchComputation()
    } catch (err) {
      console.error('Failed to refresh matches:', err)
    } finally {
      setIsRefreshing(false)
      onOpenChange(false)
    }
  }

  const handleDone = () => {
    onOpenChange(false)
  }

  const handleBack = () => {
    setMode('chat')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>
              {mode === 'chat' && 'Completion Debrief'}
              {mode === 'review' && 'Review Extracted Info'}
              {mode === 'success' && 'Profile Updated'}
            </span>
          </DialogTitle>
        </DialogHeader>

        {/* Error display */}
        {error && (
          <div className="px-1 pb-2">
            <Card className="p-3 bg-red-50 border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </Card>
          </div>
        )}

        {/* Chat mode */}
        {mode === 'chat' && (
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <div className="flex-1 overflow-hidden">
              <EnrichmentChat
                messages={messages}
                input={input}
                onInputChange={setInput}
                onSendMessage={(msg) => void sendMessage(msg)}
                isLoading={isLoading}
              />
            </div>

            {/* Extract button */}
            {messages.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {shouldShowExtract ? (
                    <span className="text-green-600 font-medium">
                      Ready to extract profile updates!
                    </span>
                  ) : (
                    'Continue chatting to share more about what you did.'
                  )}
                </p>
                <Button
                  onClick={handleExtract}
                  disabled={isExtracting || messages.length < 2}
                  variant={shouldShowExtract ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="size-3.5 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-3.5" />
                      See what I learned
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Review mode */}
        {mode === 'review' && extractions && (
          <div className="flex-1 overflow-y-auto px-1">
            <ExtractionReview
              extractions={extractions}
              onUpdateStatus={updateExtractionStatus}
              onUpdateValue={updateExtractionValue}
              onApply={handleApply}
              onBack={handleBack}
              isApplying={isApplying}
            />
          </div>
        )}

        {/* Success mode */}
        {mode === 'success' && (
          <div className="flex flex-col items-center text-center py-8 gap-6">
            <div className="size-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="size-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Profile updated!
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Your changes will improve future matches and actions.
              </p>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <Button
                onClick={handleRefreshMatches}
                disabled={isRefreshing}
                className="gap-2 bg-violet-600 hover:bg-violet-700"
              >
                {isRefreshing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4" />
                    Refresh Matches
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={handleDone}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
