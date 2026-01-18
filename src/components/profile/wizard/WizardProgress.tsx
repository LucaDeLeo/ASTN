import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Check, Circle, Lock } from "lucide-react";
import { cn } from "~/lib/utils";

type StepId =
  | "basic"
  | "education"
  | "work"
  | "goals"
  | "skills"
  | "enrichment"
  | "privacy";

interface WizardProgressProps {
  currentStep: StepId;
  onStepClick: (step: StepId) => void;
}

const STEP_TO_SECTION: Record<StepId, string> = {
  basic: "basicInfo",
  education: "education",
  work: "workHistory",
  goals: "careerGoals",
  skills: "skills",
  enrichment: "enrichment",
  privacy: "privacy",
};

const STEPS: { id: StepId; label: string }[] = [
  { id: "basic", label: "Basic Information" },
  { id: "education", label: "Education" },
  { id: "work", label: "Work History" },
  { id: "goals", label: "Career Goals" },
  { id: "skills", label: "Skills" },
  { id: "enrichment", label: "Profile Enrichment" },
  { id: "privacy", label: "Privacy Settings" },
];

const UNLOCK_THRESHOLD = 4;

export function WizardProgress({
  currentStep,
  onStepClick,
}: WizardProgressProps) {
  const completeness = useQuery(api.profiles.getMyCompleteness);

  const getSectionComplete = (stepId: StepId) => {
    if (!completeness) return false;
    const sectionId = STEP_TO_SECTION[stepId];
    return (
      completeness.sections.find((s) => s.id === sectionId)?.isComplete ?? false
    );
  };

  const completedCount = completeness?.completedCount ?? 0;
  const totalCount = completeness?.totalCount ?? 7;
  const canUnlock = completedCount >= UNLOCK_THRESHOLD;

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-8">
        <div className="bg-white rounded-lg border p-4 space-y-4">
          <div className="text-sm font-medium text-slate-900">
            Profile Completeness
          </div>

          <div className="text-2xl font-semibold text-slate-900">
            {completedCount}{" "}
            <span className="text-base font-normal text-slate-500">
              of {totalCount} complete
            </span>
          </div>

          <nav className="space-y-1">
            {STEPS.map((step) => {
              const isComplete = getSectionComplete(step.id);
              const isCurrent = currentStep === step.id;

              return (
                <button
                  key={step.id}
                  onClick={() => onStepClick(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors",
                    isCurrent
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {isComplete ? (
                    <Check className="size-4 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="size-4 text-slate-300 shrink-0" />
                  )}
                  <span>{step.label}</span>
                </button>
              );
            })}
          </nav>

          <div
            className={cn(
              "mt-4 p-3 rounded-md text-sm",
              canUnlock
                ? "bg-green-50 text-green-800"
                : "bg-slate-50 text-slate-600"
            )}
          >
            {canUnlock ? (
              <div className="flex items-center gap-2">
                <Check className="size-4" />
                <span>Smart matching unlocked!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="size-4" />
                <span>
                  Complete {UNLOCK_THRESHOLD - completedCount} more section
                  {UNLOCK_THRESHOLD - completedCount !== 1 ? "s" : ""} to unlock
                  smart matching
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
