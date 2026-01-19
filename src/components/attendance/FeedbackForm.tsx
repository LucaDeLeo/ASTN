import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { StarRating } from "./StarRating";

interface FeedbackFormProps {
  eventId: Id<"events">;
  eventTitle: string;
  onComplete: () => void;
}

export function FeedbackForm({
  eventId,
  eventTitle,
  onComplete,
}: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = useMutation(api.attendance.mutations.submitFeedback);

  const handleSubmit = async () => {
    if (rating === 0) return;

    setSubmitting(true);
    try {
      await submitFeedback({
        eventId,
        rating,
        text: text.trim() || undefined,
      });
      onComplete();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (!showSkipConfirm) {
      // First click: show soft nudge
      setShowSkipConfirm(true);
    } else {
      // Second click: actually skip
      onComplete();
    }
  };

  return (
    <div className="py-2 space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">How was {eventTitle}?</p>
        <p className="text-xs text-muted-foreground mb-2">
          Your feedback helps orgs improve their events
        </p>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-muted-foreground">Rating</label>
        <StarRating value={rating} onChange={setRating} size="md" />
      </div>

      <div className="space-y-1">
        <label htmlFor="feedback-text" className="text-xs text-muted-foreground">
          Comments (optional)
        </label>
        <Textarea
          id="feedback-text"
          placeholder="What did you like? What could be improved?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-16 text-sm"
        />
      </div>

      {showSkipConfirm && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2 text-xs text-amber-700">
          Are you sure you do not want to share feedback?
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          size="sm"
        >
          {submitting ? "Submitting..." : "Submit Feedback"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={submitting}
          className="text-muted-foreground"
        >
          {showSkipConfirm ? "Yes, skip feedback" : "Skip"}
        </Button>
      </div>
    </div>
  );
}
