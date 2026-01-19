import { useState } from "react";
import { CheckCircle, XCircle, MinusCircle, Clock } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { FeedbackForm } from "./FeedbackForm";

interface AttendancePromptProps {
  notificationId: Id<"notifications">;
  eventId: Id<"events">;
  eventTitle: string;
  orgName?: string;
  onDismiss: () => void;
}

export function AttendancePrompt({
  notificationId,
  eventId,
  eventTitle,
  orgName,
  onDismiss,
}: AttendancePromptProps) {
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);

  const recordAttendance = useMutation(api.attendance.mutations.recordAttendance);
  const snoozePrompt = useMutation(api.attendance.mutations.snoozeAttendancePrompt);

  const handleResponse = async (
    status: "attended" | "partial" | "not_attended"
  ) => {
    setSubmitting(status);
    try {
      await recordAttendance({
        eventId,
        status,
        notificationId,
      });

      if (status === "attended" || status === "partial") {
        setShowFeedback(true);
      } else {
        onDismiss();
      }
    } catch (error) {
      console.error("Failed to record attendance:", error);
    } finally {
      setSubmitting(null);
    }
  };

  const handleSnooze = async () => {
    setSubmitting("snooze");
    try {
      await snoozePrompt({ notificationId });
      onDismiss();
    } catch (error) {
      console.error("Failed to snooze prompt:", error);
    } finally {
      setSubmitting(null);
    }
  };

  if (showFeedback) {
    return (
      <FeedbackForm
        eventId={eventId}
        eventTitle={eventTitle}
        onComplete={onDismiss}
      />
    );
  }

  return (
    <div className="py-2">
      <p className="text-sm font-medium mb-1">Did you attend?</p>
      <p className="text-xs text-muted-foreground mb-3">
        {eventTitle}
        {orgName && ` - ${orgName}`}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResponse("attended")}
          disabled={submitting !== null}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="size-4" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResponse("partial")}
          disabled={submitting !== null}
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
        >
          <MinusCircle className="size-4" />
          Partial
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResponse("not_attended")}
          disabled={submitting !== null}
          className="text-slate-500 hover:text-slate-600"
        >
          <XCircle className="size-4" />
          No
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSnooze}
          disabled={submitting !== null}
          className="text-muted-foreground"
        >
          <Clock className="size-4" />
          Later
        </Button>
      </div>
    </div>
  );
}
