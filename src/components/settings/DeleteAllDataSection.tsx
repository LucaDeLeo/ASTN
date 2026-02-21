import { useState } from 'react'
import { useMutation } from 'convex/react'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'sonner'
import { Trash2 } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/card'
import { Button } from '~/components/ui/button'
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

export function DeleteAllDataSection() {
  const deleteAll = useMutation(api.accountDeletion.deleteAllMyData)
  const { signOut } = useAuth()
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteAll()
      toast.success('All account data deleted')
      await signOut()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete data',
      )
      setDeleting(false)
    }
  }

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Delete All Data
        </CardTitle>
        <CardDescription>
          Permanently delete your profile, matches, uploads, bookings, and all
          other account data. You will be signed out and can start fresh on your
          next login.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete all my data'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all your data including your
                profile, matches, career actions, uploaded documents, bookings,
                and notification history. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, delete everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}
