import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { useClerk } from '@clerk/clerk-react'
import { useMutation } from 'convex/react'
import {
  Building2,
  HelpCircle,
  LogOut,
  Menu,
  MessageCircleHeart,
  Shield,
  User,
} from 'lucide-react'
import { toast } from 'sonner'

import { api } from '../../../convex/_generated/api'

import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '~/components/ui/sheet'
import { Textarea } from '~/components/ui/textarea'

interface HamburgerMenuProps {
  user: {
    name: string
    avatarUrl?: string
  } | null
}

export function HamburgerMenu({ user }: HamburgerMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [feedbackOpen, setFeedbackOpen] = React.useState(false)
  const [featureRequests, setFeatureRequests] = React.useState('')
  const [bugReports, setBugReports] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const { signOut } = useClerk()
  const submitFeedback = useMutation(api.feedback.submit)

  const handleNavigation = () => {
    setOpen(false)
  }

  const handleLogout = () => {
    setOpen(false)
    signOut()
  }

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
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
      setFeedbackOpen(false)
    } catch {
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="touch-target"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-[280px]"
          showCloseButton={false}
        >
          <SheetHeader className="border-b pb-4">
            {user ? (
              <SheetClose asChild>
                <Link
                  to="/profile"
                  onClick={handleNavigation}
                  className="flex items-center gap-3 rounded-md p-2 hover:bg-accent"
                >
                  <Avatar className="size-10">
                    {user.avatarUrl ? (
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {user.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">
                      View profile
                    </span>
                  </div>
                </Link>
              </SheetClose>
            ) : (
              <div className="flex items-center gap-3 p-2">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-muted">
                    <User className="size-5" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground">Not signed in</span>
              </div>
            )}
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-2">
            <SheetClose asChild>
              <Link
                to="/orgs"
                onClick={handleNavigation}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
              >
                <Building2 className="size-5" />
                <span>Organizations</span>
              </Link>
            </SheetClose>

            <SheetClose asChild>
              <Link
                to="/admin"
                onClick={handleNavigation}
                className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
              >
                <Shield className="size-5" />
                <span>Admin</span>
              </Link>
            </SheetClose>

            <a
              href="mailto:support@aisafetytalent.org"
              className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
            >
              <HelpCircle className="size-5" />
              <span>Help</span>
            </a>

            <button
              onClick={() => {
                setOpen(false)
                setFeedbackOpen(true)
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 hover:bg-accent"
            >
              <MessageCircleHeart className="size-5" />
              <span>Feedback</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="size-5" />
              <span>Logout</span>
            </button>
          </nav>
        </SheetContent>
      </Sheet>

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleFeedbackSubmit}>
            <DialogHeader>
              <DialogTitle>Share Feedback</DialogTitle>
              <DialogDescription>
                Help us improve ASTN. All feedback is anonymous.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile-feature-requests">
                  Feature requests
                </Label>
                <Textarea
                  id="mobile-feature-requests"
                  placeholder="What would you like to see?"
                  value={featureRequests}
                  onChange={(e) => setFeatureRequests(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile-bug-reports">Bug reports</Label>
                <Textarea
                  id="mobile-bug-reports"
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
