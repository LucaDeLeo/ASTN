import { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

interface EducationEntry {
  institution: string;
  degree?: string;
  field?: string;
  startYear?: number;
  endYear?: number;
  current?: boolean;
}

interface EducationStepProps {
  profile: Doc<"profiles"> | null;
  saveFieldImmediate: (field: string, value: unknown) => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
}

const createEmptyEntry = (): EducationEntry => ({
  institution: "",
  degree: "",
  field: "",
  startYear: undefined,
  endYear: undefined,
  current: false,
});

export function EducationStep({
  profile,
  saveFieldImmediate,
  isSaving,
  lastSaved,
}: EducationStepProps) {
  const [entries, setEntries] = useState<Array<EducationEntry>>(
    profile?.education ?? []
  );

  // Sync local state with profile when it changes
  useEffect(() => {
    if (profile?.education) {
      setEntries(profile.education);
    }
  }, [profile?.education]);

  const addEntry = () => {
    setEntries([...entries, createEmptyEntry()]);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    // Save immediately when removing
    saveFieldImmediate(
      "education",
      newEntries.filter((e) => e.institution.trim() !== "")
    );
  };

  const updateEntry = (index: number, field: keyof EducationEntry, value: unknown) => {
    const newEntries = [...entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setEntries(newEntries);
  };

  const handleBlur = () => {
    // Only save entries that have at least an institution
    const validEntries = entries.filter((e) => e.institution.trim() !== "");
    saveFieldImmediate("education", validEntries);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Education</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your educational background. This helps match you with
          opportunities that fit your qualifications.
        </p>
      </div>

      <div className="space-y-4">
        {entries.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-slate-500 mb-4">No education entries yet</p>
            <Button onClick={addEntry} variant="outline">
              <Plus className="size-4 mr-2" />
              Add Education
            </Button>
          </Card>
        ) : (
          entries.map((entry, index) => (
            <Card key={index} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <span className="text-sm font-medium text-slate-700">
                  Education {index + 1}
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
                  <Label htmlFor={`institution-${index}`}>
                    Institution <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`institution-${index}`}
                    value={entry.institution}
                    onChange={(e) =>
                      updateEntry(index, "institution", e.target.value)
                    }
                    onBlur={handleBlur}
                    placeholder="e.g., Stanford University"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`degree-${index}`}>Degree</Label>
                    <Input
                      id={`degree-${index}`}
                      value={entry.degree ?? ""}
                      onChange={(e) =>
                        updateEntry(index, "degree", e.target.value)
                      }
                      onBlur={handleBlur}
                      placeholder="e.g., PhD, MSc, BSc"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`field-${index}`}>Field of Study</Label>
                    <Input
                      id={`field-${index}`}
                      value={entry.field ?? ""}
                      onChange={(e) =>
                        updateEntry(index, "field", e.target.value)
                      }
                      onBlur={handleBlur}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`startYear-${index}`}>Start Year</Label>
                    <Input
                      id={`startYear-${index}`}
                      type="number"
                      value={entry.startYear ?? ""}
                      onChange={(e) =>
                        updateEntry(
                          index,
                          "startYear",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      onBlur={handleBlur}
                      placeholder="2020"
                      min={1950}
                      max={2030}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`endYear-${index}`}>End Year</Label>
                    <Input
                      id={`endYear-${index}`}
                      type="number"
                      value={entry.endYear ?? ""}
                      onChange={(e) =>
                        updateEntry(
                          index,
                          "endYear",
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                      onBlur={handleBlur}
                      placeholder="2024"
                      min={1950}
                      max={2030}
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
                        "education",
                        newEntries.filter((e) => e.institution.trim() !== "")
                      );
                    }}
                  />
                  <Label
                    htmlFor={`current-${index}`}
                    className="text-sm font-normal"
                  >
                    Currently enrolled
                  </Label>
                </div>
              </div>
            </Card>
          ))
        )}

        {entries.length > 0 && (
          <Button onClick={addEntry} variant="outline" className="w-full">
            <Plus className="size-4 mr-2" />
            Add Another Education
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
