import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { ResumeReviewStatus } from "./types";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface ExtractionFieldCardProps {
  label: string;
  value: string | undefined;
  editedValue?: string;
  status: ResumeReviewStatus;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (value: string) => void;
  displayOnly?: boolean; // For email - shows but can't be applied
  placeholder?: string; // "Not found in document"
}

export function ExtractionFieldCard({
  label,
  value,
  editedValue,
  status,
  onAccept,
  onReject,
  onEdit,
  displayOnly = false,
  placeholder = "Not found in document",
}: ExtractionFieldCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const displayValue = editedValue ?? value;
  const hasValue = displayValue !== undefined && displayValue !== "";

  const handleStartEdit = () => {
    setEditValue(displayValue ?? "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue("");
  };

  const handleBlur = () => {
    // Save on blur if value changed
    if (editValue.trim() && editValue.trim() !== displayValue) {
      handleSaveEdit();
    } else {
      handleCancelEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // Display-only fields (like email)
  if (displayOnly) {
    return (
      <Card
        className={cn(
          "p-3 transition-all duration-200 shadow-sm",
          "border-slate-300 bg-white"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-slate-900">{label}</h4>
              <Badge variant="secondary" className="text-xs">
                For verification only
              </Badge>
            </div>
            <p className="text-sm text-slate-700">
              {hasValue ? displayValue : (
                <span className="text-slate-400 italic">{placeholder}</span>
              )}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Missing value
  if (!hasValue && (status === "pending" || status === "accepted")) {
    return (
      <Card className="p-3 transition-all duration-200 shadow-sm border-slate-300 bg-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 mb-2">{label}</h4>
            <p className="text-sm text-slate-400 italic">{placeholder}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "p-3 transition-all duration-200 shadow-sm",
        status === "accepted" && "border-slate-300 bg-white",
        status === "edited" && "border-amber-400 bg-amber-50",
        status === "rejected" && "border-slate-300 bg-slate-100 opacity-60",
        status === "pending" && "border-slate-300 bg-white"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-slate-900">{label}</h4>
            {(status === "edited" || status === "rejected") && (
              <Badge
                variant={status === "rejected" ? "secondary" : "default"}
                className={cn(
                  "text-xs",
                  status === "edited" &&
                    "bg-amber-100 text-amber-800 hover:bg-amber-100"
                )}
              >
                {status === "rejected" && "Rejected"}
                {status === "edited" && (
                  <>
                    <Pencil className="size-3 mr-1" /> Edited
                  </>
                )}
              </Badge>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Enter value"
                className="w-full"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              className={cn(
                "text-sm",
                status === "rejected"
                  ? "line-through text-slate-400"
                  : "text-slate-700"
              )}
            >
              {displayValue}
            </p>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onAccept}
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
              onClick={onReject}
              disabled={status === "rejected"}
              className={cn(
                "text-slate-400 hover:text-red-600 hover:bg-red-50",
                status === "rejected" && "text-red-600 bg-red-100"
              )}
            >
              <X className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleStartEdit}
              className="text-slate-400 hover:text-amber-600 hover:bg-amber-50"
            >
              <Pencil className="size-4" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
