import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type {EngagementLevel} from "~/components/engagement/EngagementBadge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import {
  EngagementBadge
  
} from "~/components/engagement/EngagementBadge";
import { OverrideHistory } from "~/components/engagement/OverrideHistory";

interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagementId: Id<"memberEngagement">;
  memberName: string;
  currentLevel: EngagementLevel;
  currentExplanation: string;
  hasOverride: boolean;
  overrideNotes?: string;
  orgId: Id<"organizations">;
  userId: string;
}

const levelOptions: Array<{ value: EngagementLevel; label: string }> = [
  { value: "highly_engaged", label: "Active" },
  { value: "moderate", label: "Moderate" },
  { value: "at_risk", label: "At Risk" },
  { value: "new", label: "New" },
  { value: "inactive", label: "Inactive" },
];

export function OverrideDialog({
  open,
  onOpenChange,
  engagementId,
  memberName,
  currentLevel,
  currentExplanation,
  hasOverride,
  overrideNotes,
  orgId,
  userId,
}: OverrideDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<EngagementLevel>(currentLevel);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const overrideMutation = useMutation(api.engagement.mutations.overrideEngagement);
  const clearOverrideMutation = useMutation(api.engagement.mutations.clearOverride);

  // Fetch full engagement data including history
  const engagementData = useQuery(
    api.engagement.queries.getMemberEngagementForAdmin,
    { orgId, userId }
  );

  const handleOverride = async () => {
    if (!notes.trim()) {
      toast.error("Notes are required for engagement overrides");
      return;
    }

    setIsSubmitting(true);
    try {
      await overrideMutation({
        engagementId,
        newLevel: selectedLevel,
        notes: notes.trim(),
      });
      toast.success(`Engagement level updated to ${levelOptions.find(l => l.value === selectedLevel)?.label}`);
      onOpenChange(false);
      setNotes("");
    } catch (error) {
      toast.error("Failed to override engagement level");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearOverride = async () => {
    setIsSubmitting(true);
    try {
      await clearOverrideMutation({ engagementId });
      toast.success("Override cleared, returning to computed level");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to clear override");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Override Engagement for {memberName}</DialogTitle>
          <DialogDescription>
            Manually adjust engagement level when you have context the system
            doesn't capture.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current level section */}
          <div className="space-y-2">
            <Label className="text-slate-600">Current Level</Label>
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <EngagementBadge level={currentLevel} hasOverride={hasOverride} />
              <p className="text-sm text-slate-600 flex-1">
                {currentExplanation}
              </p>
            </div>
            {hasOverride && overrideNotes && (
              <p className="text-xs text-slate-500 italic">
                Manual override: "{overrideNotes}"
              </p>
            )}
          </div>

          {/* New level selection */}
          <div className="space-y-2">
            <Label htmlFor="level">New Level</Label>
            <Select
              value={selectedLevel}
              onValueChange={(value) => setSelectedLevel(value as EngagementLevel)}
            >
              <SelectTrigger id="level" className="w-full">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes (required) */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notes <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="e.g., Spoke at meetup last week, working on a research project offline..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
            <p className="text-xs text-slate-500">
              Required. Briefly explain why you're overriding.
            </p>
          </div>

          {/* Override history */}
          {engagementData?.overrideHistory && (
            <OverrideHistory history={engagementData.overrideHistory} />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {hasOverride && (
            <Button
              variant="outline"
              onClick={handleClearOverride}
              disabled={isSubmitting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
              Clear Override
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleOverride} disabled={isSubmitting || !notes.trim()}>
            {isSubmitting ? <Spinner className="size-4 mr-2" /> : null}
            Override
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
