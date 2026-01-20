import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface WorkEntry {
  organization: string;
  title: string;
  startDate?: number;
  endDate?: number;
  current?: boolean;
  description?: string;
}

interface WorkHistoryStepProps {
  profile: Doc<"profiles"> | null;
  saveFieldImmediate: (field: string, value: unknown) => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
}

const createEmptyEntry = (): WorkEntry => ({
  organization: "",
  title: "",
  startDate: undefined,
  endDate: undefined,
  current: false,
  description: "",
});

// Helper to format date input value (YYYY-MM)
const formatDateForInput = (timestamp?: number): string => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

// Helper to parse date input value to timestamp
const parseDateInput = (value: string): number | undefined => {
  if (!value) return undefined;
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1).getTime();
};

export function WorkHistoryStep({
  profile,
  saveFieldImmediate,
  isSaving,
  lastSaved,
}: WorkHistoryStepProps) {
  const [entries, setEntries] = useState<Array<WorkEntry>>(
    profile?.workHistory ?? []
  );

  // Sync local state with profile when it changes
  useEffect(() => {
    if (profile?.workHistory) {
      setEntries(profile.workHistory);
    }
  }, [profile?.workHistory]);

  const addEntry = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    // Save immediately when removing
    saveFieldImmediate(
      "workHistory",
      newEntries.filter((e) => e.organization.trim() !== "" || e.title.trim() !== "")
    );
  };

  const updateEntry = (index: number, field: keyof WorkEntry, value: unknown) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleBlur = () => {
    // Only save entries that have at least organization or title
    const validEntries = entries.filter(
      (e) => e.organization.trim() !== "" || e.title.trim() !== ""
    );
    saveFieldImmediate("workHistory", validEntries);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Work History</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your professional experience. Include relevant positions in AI
          safety, research, tech, or related fields.
        </p>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-slate-500 mb-4">No work history entries yet</p>
            <Button onClick={addEntry} variant="outline">
              <Plus className="size-4 mr-2" />
              Add Work Experience
            </Button>
          </Card>
        ) : (
          entries.map((entry, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-slate-700">
                  Position {index + 1}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEntry(index)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`title-${index}`}>
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`title-${index}`}
                    value={entry.title}
                    onChange={(e) => updateEntry(index, "title", e.target.value)}
                    onBlur={handleBlur}
                    placeholder="e.g., Research Scientist"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`organization-${index}`}>
                    Organization <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`organization-${index}`}
                    value={entry.organization}
                    onChange={(e) =>
                      updateEntry(index, "organization", e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="e.g., Anthropic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`startDate-${index}`}>Start Date</Label>
                    <Input
                      id={`startDate-${index}`}
                      type="month"
                      value={formatDateForInput(entry.startDate)}
                      onChange={(e) =>
                        updateEntry(
                          index,
                          "startDate",
                          parseDateInput(e.target.value)
                        )
                      }
                      onBlur={handleBlur}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`endDate-${index}`}>End Date</Label>
                    <Input
                      id={`endDate-${index}`}
                      type="month"
                      value={formatDateForInput(entry.endDate)}
                      onChange={(e) =>
                        updateEntry(
                          index,
                          "endDate",
                          parseDateInput(e.target.value)
                        )
                      }
                      onBlur={handleBlur}
                      disabled={entry.current}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`current-${index}`}
                    checked={entry.current ?? false}
                    onCheckedChange={(checked) => {
                      updateEntry(index, "current", checked);
                      // Save immediately when toggling current
                      const newEntries = [...entries];
                      newEntries[index] = { ...newEntries[index], current: !!checked };
                      saveFieldImmediate(
                        "workHistory",
                        newEntries.filter(
                          (e) =>
                            e.organization.trim() !== "" || e.title.trim() !== ""
                        )
                      );
                    }}
                  />
                  <Label
                    htmlFor={`current-${index}`}
                    className="text-sm font-normal"
                  >
                    I currently work here
                  </Label>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={entry.description ?? ""}
                    onChange={(e) =>
                      updateEntry(index, "description", e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="Describe your role and key accomplishments..."
                    rows={3}
                  />
                </div>
              </div>
            </Card>
          ))
        )}

        {entries.length > 0 && (
          <Button onClick={addEntry} variant="outline" className="w-full">
            <Plus className="size-4 mr-2" />
            Add Another Position
          </Button>
        )}
      </div>

      {/* Save indicator */}
      <div className="h-6 flex items-center">
        {isSaving ? (
          <span className="text-sm text-slate-500">Saving...</span>
        ) : lastSaved ? (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <Check className="size-3" />
            Saved
          </span>
        ) : null}
      </div>
    </div>
  );
}
