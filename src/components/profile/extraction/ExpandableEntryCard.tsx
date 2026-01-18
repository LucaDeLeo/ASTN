import { useState } from "react";
import { Check, ChevronDown, Pencil, X } from "lucide-react";
import type { ExtractedData, ResumeReviewStatus } from "./types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

type EducationEntry = NonNullable<ExtractedData["education"]>[0];
type WorkHistoryEntry = NonNullable<ExtractedData["workHistory"]>[0];

interface ExpandableEntryCardProps {
  type: "education" | "workHistory";
  entry: EducationEntry | WorkHistoryEntry;
  editedEntry?: EducationEntry | WorkHistoryEntry;
  status: ResumeReviewStatus;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (entry: EducationEntry | WorkHistoryEntry) => void;
}

/**
 * Format date range for work history
 */
function formatWorkDateRange(entry: WorkHistoryEntry): string {
  const parts: Array<string> = [];
  if (entry.startDate) {
    parts.push(entry.startDate);
  }
  if (entry.current) {
    parts.push("Present");
  } else if (entry.endDate) {
    parts.push(entry.endDate);
  }
  return parts.length > 0 ? `(${parts.join(" - ")})` : "";
}

/**
 * Format date range for education
 */
function formatEducationDateRange(entry: EducationEntry): string {
  const parts: Array<string> = [];
  if (entry.startYear) {
    parts.push(String(entry.startYear));
  }
  if (entry.current) {
    parts.push("Present");
  } else if (entry.endYear) {
    parts.push(String(entry.endYear));
  }
  return parts.length > 0 ? `(${parts.join(" - ")})` : "";
}

/**
 * Generate summary title for work history
 */
function formatWorkTitle(entry: WorkHistoryEntry): string {
  return `${entry.title} at ${entry.organization}`;
}

/**
 * Generate summary title for education
 */
function formatEducationTitle(entry: EducationEntry): string {
  const parts: Array<string> = [];
  if (entry.degree) parts.push(entry.degree);
  if (entry.field) parts.push(`in ${entry.field}`);
  parts.push(`at ${entry.institution}`);
  return parts.join(" ");
}

export function ExpandableEntryCard({
  type,
  entry,
  editedEntry,
  status,
  onAccept,
  onReject,
  onEdit,
}: ExpandableEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localEntry, setLocalEntry] = useState<EducationEntry | WorkHistoryEntry>(
    editedEntry ?? entry
  );

  const currentEntry = editedEntry ?? entry;
  const isEducation = type === "education";
  const title = isEducation
    ? formatEducationTitle(currentEntry as EducationEntry)
    : formatWorkTitle(currentEntry as WorkHistoryEntry);
  const dateRange = isEducation
    ? formatEducationDateRange(currentEntry as EducationEntry)
    : formatWorkDateRange(currentEntry as WorkHistoryEntry);

  const handleFieldChange = (field: string, value: string | number | boolean) => {
    const updated = { ...localEntry, [field]: value };
    setLocalEntry(updated);
    onEdit(updated);
  };

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card
      className={cn(
        "transition-all duration-200 overflow-hidden",
        status === "accepted" && "border-green-300 bg-green-50/50",
        status === "edited" && "border-amber-300 bg-amber-50/50",
        status === "rejected" && "border-slate-200 bg-slate-50 opacity-60",
        status === "pending" && "border-slate-200"
      )}
    >
      {/* Collapsed header */}
      <button
        type="button"
        onClick={handleToggleExpand}
        className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4
              className={cn(
                "font-medium",
                status === "rejected"
                  ? "line-through text-slate-400"
                  : "text-slate-900"
              )}
            >
              {title}
            </h4>
            {dateRange && (
              <span
                className={cn(
                  "text-sm",
                  status === "rejected" ? "text-slate-400" : "text-slate-500"
                )}
              >
                {dateRange}
              </span>
            )}
            {status !== "pending" && (
              <Badge
                variant={status === "rejected" ? "secondary" : "default"}
                className={cn(
                  "text-xs",
                  status === "accepted" &&
                    "bg-green-100 text-green-800 hover:bg-green-100",
                  status === "edited" &&
                    "bg-amber-100 text-amber-800 hover:bg-amber-100"
                )}
              >
                {status === "accepted" && (
                  <>
                    <Check className="size-3 mr-1" /> Accepted
                  </>
                )}
                {status === "rejected" && "Rejected"}
                {status === "edited" && (
                  <>
                    <Pencil className="size-3 mr-1" /> Edited
                  </>
                )}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Action buttons - stop propagation to prevent toggle */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
            disabled={status === "accepted"}
            className={cn(
              "text-slate-400 hover:text-green-600 hover:bg-green-50",
              status === "accepted" && "text-green-600 bg-green-100"
            )}
          >
            <Check className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={status === "rejected"}
            className={cn(
              "text-slate-400 hover:text-red-600 hover:bg-red-50",
              status === "rejected" && "text-red-600 bg-red-100"
            )}
          >
            <X className="size-4" />
          </Button>
          <ChevronDown
            className={cn(
              "size-5 text-slate-400 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </button>

      {/* Expanded content */}
      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
            {isEducation ? (
              <EducationFields
                entry={localEntry as EducationEntry}
                onChange={handleFieldChange}
              />
            ) : (
              <WorkHistoryFields
                entry={localEntry as WorkHistoryEntry}
                onChange={handleFieldChange}
              />
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface EducationFieldsProps {
  entry: EducationEntry;
  onChange: (field: string, value: string | number | boolean) => void;
}

function EducationFields({ entry, onChange }: EducationFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Institution
          </label>
          <Input
            value={entry.institution}
            onChange={(e) => onChange("institution", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Degree
          </label>
          <Input
            value={entry.degree ?? ""}
            onChange={(e) => onChange("degree", e.target.value)}
            placeholder="e.g., PhD, MSc, BSc"
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">
          Field of Study
        </label>
        <Input
          value={entry.field ?? ""}
          onChange={(e) => onChange("field", e.target.value)}
          placeholder="e.g., Computer Science, AI Safety"
          className="h-9 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Start Year
          </label>
          <Input
            type="number"
            value={entry.startYear ?? ""}
            onChange={(e) =>
              onChange("startYear", e.target.value ? parseInt(e.target.value) : "")
            }
            placeholder="YYYY"
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            End Year
          </label>
          <Input
            type="number"
            value={entry.endYear ?? ""}
            onChange={(e) =>
              onChange("endYear", e.target.value ? parseInt(e.target.value) : "")
            }
            placeholder="YYYY"
            disabled={entry.current}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={entry.current ?? false}
              onChange={(e) => onChange("current", e.target.checked)}
              className="rounded border-slate-300"
            />
            Current
          </label>
        </div>
      </div>
    </>
  );
}

interface WorkHistoryFieldsProps {
  entry: WorkHistoryEntry;
  onChange: (field: string, value: string | boolean) => void;
}

function WorkHistoryFields({ entry, onChange }: WorkHistoryFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Organization
          </label>
          <Input
            value={entry.organization}
            onChange={(e) => onChange("organization", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Title
          </label>
          <Input
            value={entry.title}
            onChange={(e) => onChange("title", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            Start Date
          </label>
          <Input
            type="month"
            value={entry.startDate ?? ""}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="h-9 text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">
            End Date
          </label>
          <Input
            type="month"
            value={entry.endDate ?? ""}
            onChange={(e) => onChange("endDate", e.target.value)}
            disabled={entry.current}
            className="h-9 text-sm"
          />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={entry.current ?? false}
              onChange={(e) => onChange("current", e.target.checked)}
              className="rounded border-slate-300"
            />
            Current
          </label>
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">
          Description
        </label>
        <textarea
          value={entry.description ?? ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Describe your role and responsibilities..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent resize-none"
        />
      </div>
    </>
  );
}
