import { useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { WizardProgress } from "./WizardProgress";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { EducationStep } from "./steps/EducationStep";
import { WorkHistoryStep } from "./steps/WorkHistoryStep";
import { GoalsStep } from "./steps/GoalsStep";
import { SkillsStep } from "./steps/SkillsStep";
import { EnrichmentStep } from "./steps/EnrichmentStep";
import { PrivacyStep } from "./steps/PrivacyStep";
import { useAutoSave } from "./hooks/useAutoSave";
import { Spinner } from "~/components/ui/spinner";
import { Button } from "~/components/ui/button";

type StepId =
  | "basic"
  | "education"
  | "work"
  | "goals"
  | "skills"
  | "enrichment"
  | "privacy";

interface ProfileWizardProps {
  currentStep: StepId;
  onStepChange: (step: StepId) => void;
  fromExtraction?: boolean;
  chatFirst?: boolean;
}

const STEPS: Array<StepId> = [
  "basic",
  "education",
  "work",
  "goals",
  "skills",
  "enrichment",
  "privacy",
];

// Step labels for reference (used in step navigation)
const _STEP_LABELS: Record<StepId, string> = {
  basic: "Basic Information",
  education: "Education",
  work: "Work History",
  goals: "Career Goals",
  skills: "Skills",
  enrichment: "Profile Enrichment",
  privacy: "Privacy Settings",
};
void _STEP_LABELS; // Mark as intentionally unused for now

export function ProfileWizard({ currentStep, onStepChange, fromExtraction, chatFirst }: ProfileWizardProps) {
  const profile = useQuery(api.profiles.getOrCreateProfile);
  const createProfile = useMutation(api.profiles.create);

  // Create profile if it doesn't exist
  useEffect(() => {
    if (profile === null) {
      createProfile();
    }
  }, [profile, createProfile]);

  const { saveField, saveFieldImmediate, isSaving, lastSaved } = useAutoSave(
    profile?._id ?? null
  );

  const currentIndex = STEPS.indexOf(currentStep);
  const isFirstStep = currentIndex === 0;
  const isLastStep = currentIndex === STEPS.length - 1;

  const goToNextStep = () => {
    if (!isLastStep) {
      onStepChange(STEPS[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    if (!isFirstStep) {
      onStepChange(STEPS[currentIndex - 1]);
    }
  };

  // Loading state
  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "basic":
        return (
          <BasicInfoStep
            profile={profile}
            saveField={saveField}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        );
      case "education":
        return (
          <EducationStep
            profile={profile}
            saveFieldImmediate={saveFieldImmediate}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        );
      case "work":
        return (
          <WorkHistoryStep
            profile={profile}
            saveFieldImmediate={saveFieldImmediate}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        );
      case "goals":
        return (
          <GoalsStep
            profile={profile}
            saveField={saveField}
            saveFieldImmediate={saveFieldImmediate}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        );
      case "skills":
        return (
          <SkillsStep
            profile={profile}
            saveFieldImmediate={saveFieldImmediate}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        );
      case "enrichment":
        return <EnrichmentStep profile={profile} fromExtraction={fromExtraction} chatFirst={chatFirst} />;
      case "privacy":
        return (
          <PrivacyStep
            profile={profile}
            saveFieldImmediate={saveFieldImmediate}
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:gap-8">
      {/* Progress indicator - rendered first, appears on top on mobile, side on desktop */}
      <WizardProgress currentStep={currentStep} onStepClick={onStepChange} />

      {/* Form content */}
      <div className="flex-1 md:min-w-0">
        <div className="bg-white dark:bg-card rounded-lg border p-4 sm:p-6">
          {renderCurrentStep()}

          {/* Hide navigation on privacy step - it has its own Complete button */}
          {!isLastStep && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={isFirstStep}
                className="min-h-11 w-full sm:w-auto order-2 sm:order-1"
              >
                <ChevronLeft className="size-4 mr-1" />
                Previous
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="ghost"
                  onClick={goToNextStep}
                  className="min-h-11"
                >
                  <SkipForward className="size-4 mr-1" />
                  Skip for now
                </Button>

                <Button
                  onClick={goToNextStep}
                  className="min-h-11"
                >
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
