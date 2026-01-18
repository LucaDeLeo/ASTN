import { useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { WizardProgress } from "./WizardProgress";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { EducationStep } from "./steps/EducationStep";
import { WorkHistoryStep } from "./steps/WorkHistoryStep";
import { GoalsStep } from "./steps/GoalsStep";
import { SkillsStep } from "./steps/SkillsStep";
import { EnrichmentStep } from "./steps/EnrichmentStep";
import { PrivacyStep } from "./steps/PrivacyStep";
import { useAutoSave } from "./hooks/useAutoSave";

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
}

const STEPS: StepId[] = [
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

export function ProfileWizard({ currentStep, onStepChange }: ProfileWizardProps) {
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
        return <EnrichmentStep />;
      case "privacy":
        return <PrivacyStep />;
      default:
        return null;
    }
  };

  return (
    <div className="flex gap-8">
      <WizardProgress currentStep={currentStep} onStepClick={onStepChange} />

      <div className="flex-1 min-w-0">
        <div className="bg-white rounded-lg border p-6">
          {renderCurrentStep()}

          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={goToPreviousStep}
              disabled={isFirstStep}
            >
              <ChevronLeft className="size-4 mr-1" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {!isLastStep && (
                <Button variant="ghost" onClick={goToNextStep}>
                  <SkipForward className="size-4 mr-1" />
                  Skip for now
                </Button>
              )}

              {isLastStep ? (
                <Button onClick={() => window.location.href = "/profile"}>
                  Finish
                </Button>
              ) : (
                <Button onClick={goToNextStep}>
                  Next
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
