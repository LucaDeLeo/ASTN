import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { SkillsInput } from "../../skills/SkillsInput";

interface SkillsStepProps {
  profile: Doc<"profiles"> | null;
  saveFieldImmediate: (field: string, value: unknown) => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
}

export function SkillsStep({
  profile,
  saveFieldImmediate,
  isSaving,
  lastSaved,
}: SkillsStepProps) {
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile?.skills ?? []
  );

  // Sync local state with profile when it changes
  useEffect(() => {
    if (profile) {
      setSelectedSkills(profile.skills ?? []);
    }
  }, [profile]);

  const handleSkillsChange = (skills: string[]) => {
    setSelectedSkills(skills);
    saveFieldImmediate("skills", skills);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Skills</h2>
        <p className="text-sm text-slate-500 mt-1">
          Add your technical and professional skills relevant to AI safety work.
          These help us match you with opportunities that fit your expertise.
        </p>
      </div>

      <SkillsInput
        selectedSkills={selectedSkills}
        onSkillsChange={handleSkillsChange}
        maxSuggested={10}
      />

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
