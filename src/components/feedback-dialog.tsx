import * as React from 'react'
import { useMutation } from 'convex/react'
import { MessageCircleHeart } from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../convex/_generated/api'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog'
import { Label } from '~/components/ui/label'
import { Textarea } from '~/components/ui/textarea'

export function FeedbackDialog() {
  const [open, setOpen] = React.useState(false)
  const [featureRequests, setFeatureRequests] = React.useState('')
  const [bugReports, setBugReports] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const submitFeedback = useMutation(api.feedback.submit)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!featureRequests.trim() && !bugReports.trim()) {
      toast.error('Please fill in at least one field')
      return
    }
    setSubmitting(true)
    try {
      await submitFeedback({
        featureRequests: featureRequests || undefined,
        bugReports: bugReports || undefined,
        page: window.location.pathname,
      })
      toast.success('Thanks for your feedback!')
      setFeatureRequests('')
      setBugReports('')
      setOpen(false)
    } catch {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex size-12 items-center justify-center rounded-full bg-coral-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Share feedback"
      >
        <MessageCircleHeart className="size-5" />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Share Feedback</DialogTitle>
              <DialogDescription>
                Help us improve ASTN. All feedback is anonymous.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="feature-requests">Feature requests</Label>
                <Textarea
                  id="feature-requests"
                  placeholder="What would you like to see?"
                  value={featureRequests}
                  onChange={(e) => setFeatureRequests(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bug-reports">Bug reports</Label>
                <Textarea
                  id="bug-reports"
                  placeholder="What's not working?"
                  value={bugReports}
                  onChange={(e) => setBugReports(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send Feedback'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
