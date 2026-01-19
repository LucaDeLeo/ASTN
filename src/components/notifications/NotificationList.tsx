import { formatDistanceToNow } from "date-fns";
import { Bell, Calendar, RefreshCw } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { cn } from "~/lib/utils";

interface Notification {
  _id: Id<"notifications">;
  type: "event_new" | "event_reminder" | "event_updated";
  title: string;
  body: string;
  actionUrl?: string;
  read: boolean;
  createdAt: number;
  eventTitle?: string;
  orgName?: string;
}

interface NotificationListProps {
  notifications: Array<Notification>;
}

const typeIcons = {
  event_new: Calendar,
  event_reminder: Bell,
  event_updated: RefreshCw,
};

export function NotificationList({ notifications }: NotificationListProps) {
  const markAsRead = useMutation(api.notifications.mutations.markAsRead);

  if (notifications.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-muted-foreground">
        No notifications yet
      </div>
    );
  }

  return (
    <div className="max-h-80 overflow-y-auto">
      {notifications.map((notification) => {
        const Icon = typeIcons[notification.type];

        return (
          <button
            key={notification._id}
            className={cn(
              "w-full px-4 py-3 text-left hover:bg-muted/50 border-b last:border-0 flex gap-3",
              !notification.read && "bg-primary/5"
            )}
            onClick={() => {
              if (!notification.read) {
                markAsRead({ notificationId: notification._id });
              }
              if (notification.actionUrl) {
                window.location.href = notification.actionUrl;
              }
            }}
          >
            <div className={cn(
              "size-8 rounded-full flex items-center justify-center shrink-0",
              notification.read ? "bg-muted" : "bg-primary/10"
            )}>
              <Icon className={cn(
                "size-4",
                notification.read ? "text-muted-foreground" : "text-primary"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn(
                "text-sm truncate",
                !notification.read && "font-medium"
              )}>
                {notification.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {notification.body}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
              </p>
            </div>
            {!notification.read && (
              <div className="size-2 rounded-full bg-primary shrink-0 mt-2" />
            )}
          </button>
        );
      })}
    </div>
  );
}
