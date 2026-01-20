import { useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import type { ExtractionFields, ExtractionItem, ExtractionStatus } from "./hooks/useEnrichment";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";

interface ExtractionReviewProps {
  extractions: Array<ExtractionItem>;
  onUpdateStatus: (field: keyof ExtractionFields, status: ExtractionStatus) => void;
  onUpdateValue: (field: keyof ExtractionFields, value: string | Array<string>) => void;
  onApply: () => void;
  onBack: () => void;
  isApplying: boolean;
}

export function ExtractionReview({
  extractions,
  onUpdateStatus,
  onUpdateValue,
  onApply,
  onBack,
  isApplying,
}: ExtractionReviewProps) {
  const [editingField, setEditingField] = useState<keyof ExtractionFields | null>(
    null
  );
  const [editValue, setEditValue] = useState("");

  const handleEdit = (item: ExtractionItem) => {
    setEditingField(item.field);
    const currentValue = item.editedValue ?? item.value;
    setEditValue(
      Array.isArray(currentValue) ? currentValue.join(", ") : currentValue
    );
  };

  const handleSaveEdit = (item: ExtractionItem) => {
    const newValue = Array.isArray(item.value)
      ? editValue.split(",").map((s) => s.trim()).filter(Boolean)
      : editValue;
    onUpdateValue(item.field, newValue);
    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const acceptedCount = extractions.filter(
    (e) => e.status === "accepted" || e.status === "edited"
  ).length;

  const hasAcceptedFields = acceptedCount > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h3 className="text-lg font-medium text-foreground">
            Review Extracted Information
          </h3>
          <p className="text-sm text-slate-500">
            Accept, reject, or edit the information I extracted from our
            conversation.
          </p>
        </div>
      </div>

      {/* Extraction cards */}
      <div className="space-y-4">
        {extractions.map((item) => (
          <Card
            key={item.field}
            className={cn(
              "p-4 transition-all duration-200",
              item.status === "accepted" && "border-green-300 bg-green-50/50",
              item.status === "edited" && "border-amber-300 bg-amber-50/50",
              item.status === "rejected" && "border-slate-200 bg-slate-50 opacity-60"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-foreground">{item.label}</h4>
                  {item.status !== "pending" && (
                    <Badge
                      variant={
                        item.status === "rejected" ? "secondary" : "default"
                      }
                      className={cn(
                        "text-xs",
                        item.status === "accepted" &&
                          "bg-green-100 text-green-800 hover:bg-green-100",
                        item.status === "edited" &&
                          "bg-amber-100 text-amber-800 hover:bg-amber-100"
                      )}
                    >
                      {item.status === "accepted" && (
                        <>
                          <Check className="size-3 mr-1" /> Accepted
                        </>
                      )}
                      {item.status === "rejected" && "Rejected"}
                      {item.status === "edited" && (
                        <>
                          <Pencil className="size-3 mr-1" /> Edited
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                {editingField === item.field ? (
                  <div className="space-y-2">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder={
                        Array.isArray(item.value)
                          ? "Enter values separated by commas"
                          : "Enter value"
                      }
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleSaveEdit(item)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "text-sm",
                      item.status === "rejected"
                        ? "line-through text-slate-400"
                        : "text-slate-700"
                    )}
                  >
                    {Array.isArray(item.editedValue ?? item.value) ? (
                      <div className="flex flex-wrap gap-1.5">
                        {((item.editedValue ?? item.value) as Array<string>).map(
                          (v: string, i: number) => (
                            <span
                              key={i}
                              className={cn(
                                "inline-block px-2 py-0.5 rounded-full text-xs",
                                item.status === "rejected"
                                  ? "bg-slate-200 text-slate-500"
                                  : "bg-slate-100 text-slate-700"
                              )}
                            >
                              {v}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p>{(item.editedValue ?? item.value) as string}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              {editingField !== item.field && (
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUpdateStatus(item.field, "accepted")}
                    disabled={item.status === "accepted"}
                    className={cn(
                      "text-slate-400 hover:text-green-600 hover:bg-green-50",
                      item.status === "accepted" &&
                        "text-green-600 bg-green-100"
                    )}
                  >
                    <Check className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUpdateStatus(item.field, "rejected")}
                    disabled={item.status === "rejected"}
                    className={cn(
                      "text-slate-400 hover:text-red-600 hover:bg-red-50",
                      item.status === "rejected" && "text-red-600 bg-red-100"
                    )}
                  >
                    <X className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleEdit(item)}
                    className="text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                  >
                    <Pencil className="size-4" />
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Apply button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <p className="text-sm text-slate-500">
          {acceptedCount} of {extractions.length} fields will be applied
        </p>
        <Button
          onClick={onApply}
          disabled={!hasAcceptedFields || isApplying}
          className="gap-2"
        >
          {isApplying ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Applying...
            </>
          ) : (
            <>
              <CheckCircle2 className="size-4" />
              Apply to Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
