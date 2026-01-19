import { formatDistanceToNow } from "date-fns";
import { History } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";

type OverrideHistoryEntry = {
  _id: Id<"engagementOverrideHistory">;
  previousLevel: string;
  newLevel: string;
  notes: string;
  action: "override" | "clear";
  performedAt: number;
};

interface OverrideHistoryProps {
  history: Array<OverrideHistoryEntry>;
}

// Map level values to display labels
const levelLabels: Record<string, string> = {
  highly_engaged: "Active",
  moderate: "Moderate",
  at_risk: "At Risk",
  new: "New",
  inactive: "Inactive",
};

function formatLevel(level: string): string {
  return levelLabels[level] || level;
}

export function OverrideHistory({ history }: OverrideHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-sm text-slate-500 italic py-4 text-center">
        No override history
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <History className="size-4" />
        Override History
      </div>
      <div className="space-y-2">
        {history.map((entry) => (
          <div
            key={entry._id}
            className="text-sm border-l-2 border-slate-200 pl-3 py-1"
          >
            <div className="flex items-center gap-2 text-slate-600">
              <span className="font-medium">
                {entry.action === "override" ? "Overridden" : "Override cleared"}
              </span>
              <span className="text-slate-400">
                {formatDistanceToNow(entry.performedAt, { addSuffix: true })}
              </span>
            </div>
            <div className="text-slate-500 text-xs mt-0.5">
              {formatLevel(entry.previousLevel)} → {formatLevel(entry.newLevel)}
            </div>
            {entry.notes && entry.notes !== "Override cleared" && (
              <div className="text-slate-500 text-xs mt-0.5 italic">
                "{entry.notes}"
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
