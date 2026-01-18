import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import type { Doc } from "../../../../../convex/_generated/dataModel";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";

interface GoalsStepProps {
  profile: Doc<"profiles"> | null;
  saveField: (field: string, value: unknown) => void;
  saveFieldImmediate: (field: string, value: unknown) => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
}

// Pre-defined AI safety interest areas
const AI_SAFETY_AREAS = [
  "Alignment Research",
  "Interpretability",
  "AI Governance",
  "AI Policy",
  "Technical Safety",
  "Robustness",
  "AI Ethics",
  "Scalable Oversight",
  "Red Teaming",
  "Deceptive Alignment",
  "Value Learning",
  "Multi-Agent Safety",
  "Existential Risk",
  "Constitutional AI",
];

export function GoalsStep({
  profile,
  saveField,
  saveFieldImmediate,
  isSaving,
  lastSaved,
}: GoalsStepProps) {
  const [careerGoals, setCareerGoals] = useState(profile?.careerGoals ?? "");
  const [seeking, setSeeking] = useState(profile?.seeking ?? "");
  const [selectedInterests, setSelectedInterests] = useState<Array<string>>(
    profile?.aiSafetyInterests ?? []
  );

  // Sync local state with profile when it changes
  useEffect(() => {
    if (profile) {
      setCareerGoals(profile.careerGoals ?? "");
      setSeeking(profile.seeking ?? "");
      setSelectedInterests(profile.aiSafetyInterests ?? []);
    }
  }, [profile]);

  const toggleInterest = (interest: string) => {
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(newInterests);
    saveFieldImmediate("aiSafetyInterests", newInterests);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Career Goals</h2>
        <p className="text-sm text-slate-500 mt-1">
          Tell us about your career aspirations in AI safety. This helps us
          match you with the right opportunities.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-2">
          <Label htmlFor="careerGoals">
            What are your career goals in AI safety?{" "}
            <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="careerGoals"
            value={careerGoals}
            onChange={(e) => setCareerGoals(e.target.value)}
            onBlur={() => saveField("careerGoals", careerGoals)}
            placeholder="Describe your long-term career aspirations. What kind of impact do you want to have? What problems do you want to work on?"
            rows={4}
          />
        </div>

        <div className="grid gap-3">
          <Label>Which areas of AI safety interest you most?</Label>
          <p className="text-xs text-slate-500">
            Select all that apply. This helps us recommend relevant
            opportunities.
          </p>
          <div className="flex flex-wrap gap-2">
            {AI_SAFETY_AREAS.map((area) => {
              const isSelected = selectedInterests.includes(area);
              return (
                <Badge
                  key={area}
                  variant={isSelected ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-primary hover:bg-primary/90"
                      : "hover:bg-slate-100"
                  }`}
                  onClick={() => toggleInterest(area)}
                >
                  {area}
                  {isSelected && <X className="size-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="seeking">What are you looking for?</Label>
          <Textarea
            id="seeking"
            value={seeking}
            onChange={(e) => setSeeking(e.target.value)}
            onBlur={() => saveField("seeking", seeking)}
            placeholder="Are you looking for full-time roles, research positions, fellowships, mentorship, collaborators, or something else?"
            rows={3}
          />
          <p className="text-xs text-slate-500">
            Be specific about the type of opportunities, timeline, and any
            constraints (e.g., location, visa requirements)
          </p>
        </div>
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
