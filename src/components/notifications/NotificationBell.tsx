import { useMutation, useQuery } from 'convex/react'
import { Bell } from 'lucide-react'
import { api } from '../../../convex/_generated/api'
import { NotificationList } from './NotificationList'
import { Button } from '~/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui/popover'

export function NotificationBell() {
  const unreadCount = useQuery(api.notifications.queries.getUnreadCount)
  const notifications = useQuery(
    api.notifications.queries.getRecentNotifications,
    { limit: 10 },
  )
  const markAllAsRead = useMutation(api.notifications.mutations.markAllAsRead)

  // Don't render for unauthenticated users
  if (unreadCount === undefined) return null

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 size-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1"
              onClick={() => markAllAsRead()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <NotificationList notifications={notifications || []} />
      </PopoverContent>
    </Popover>
  )
}
