import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { AppliedData } from "~/components/profile/extraction";
import { ResumeExtractionReview } from "~/components/profile/extraction";
import {
  DocumentUpload,
  ExtractionError,
  ExtractionProgress,
  FilePreview,
  TextPasteZone,
  UploadProgress,
  useExtraction,
  useFileUpload,
  type ExtractedData,
} from "~/components/profile/upload";
import { Button } from "~/components/ui/button";
import { EntryPointSelector } from "./EntryPointSelector";
import { PostApplySummary } from "./PostApplySummary";
import { WizardStepIndicator } from "./WizardStepIndicator";
import { EnrichmentStep } from "./steps/EnrichmentStep";

type EntryPoint = "upload" | "paste" | "manual" | "chat";

/**
 * Discriminated union type for wizard state machine.
 * Each step has associated data appropriate to that state.
 */
type WizardState =
  | { step: "input"; entryPoint?: undefined }
  | { step: "uploading"; entryPoint: "upload"; file: File }
  | { step: "extracting"; entryPoint: "upload" | "paste" }
  | { step: "review"; entryPoint: "upload" | "paste"; extractedData: ExtractedData }
  | { step: "summary" }
  | { step: "enrich"; fromExtraction: boolean }
  | { step: "manual" };

interface ProfileCreationWizardProps {
  onComplete: () => void;
  onManualEntry?: () => void;
  onEnrich?: (fromExtraction: boolean) => void;
  initialStep?: "input" | "manual" | "chat";
}

/**
 * Main wizard container that orchestrates the full profile creation flow.
 *
 * Flow options:
 * 1. Upload PDF -> Extract -> Review -> Apply -> Summary -> Enrich
 * 2. Paste text -> Extract -> Review -> Apply -> Summary -> Enrich
 * 3. Manual entry (signals parent to show ProfileWizard)
 * 4. Chat-first (goes directly to enrichment)
 */
export function ProfileCreationWizard({
  onComplete,
  onManualEntry,
  onEnrich,
  initialStep = "input",
}: ProfileCreationWizardProps) {
  // Initialize state based on initial step
  const [wizardState, setWizardState] = useState<WizardState>(() => {
    if (initialStep === "manual") return { step: "manual" };
    if (initialStep === "chat") return { step: "enrich", fromExtraction: false };
    return { step: "input" };
  });

  // Preserved extracted data for back navigation
  // Note: This allows returning to input step while keeping data available
  const [, setPreservedExtractedData] = useState<ExtractedData | null>(null);

  // Upload and extraction hooks (lifted state)
  const {
    state: uploadState,
    selectFile,
    clearFile,
    upload,
    retry: retryUpload,
  } = useFileUpload();
  const {
    state: extractionState,
    extractFromDocument,
    extractFromText,
    retry: retryExtraction,
    reset: resetExtraction,
  } = useExtraction();

  // Profile query for enrichment step
  const profile = useQuery(api.profiles.getOrCreateProfile);

  // Apply extracted data mutation
  const applyExtractedProfile = useMutation(api.profiles.applyExtractedProfile);
  const [isApplying, setIsApplying] = useState(false);

  // Text paste visibility state
  const [showTextPaste, setShowTextPaste] = useState(false);

  // Auto-trigger extraction when upload succeeds
  useEffect(() => {
    if (
      uploadState.status === "success" &&
      extractionState.status === "idle" &&
      wizardState.step === "uploading"
    ) {
      setWizardState({ step: "extracting", entryPoint: "upload" });
      void extractFromDocument(uploadState.documentId);
    }
  }, [uploadState, extractionState.status, extractFromDocument, wizardState.step]);

  // Transition to review when extraction succeeds
  useEffect(() => {
    if (
      extractionState.status === "success" &&
      (wizardState.step === "extracting" || wizardState.step === "uploading")
    ) {
      const entryPoint = wizardState.step === "extracting" ? wizardState.entryPoint : "upload";
      setPreservedExtractedData(extractionState.extractedData);
      setWizardState({
        step: "review",
        entryPoint,
        extractedData: extractionState.extractedData,
      });
    }
  }, [extractionState, wizardState.step]);

  // Handle entry point selection
  const handleEntrySelect = (entryPoint: EntryPoint) => {
    if (entryPoint === "upload") {
      // Just prepare for file selection, actual flow starts on file select
      resetExtraction();
      clearFile();
      setShowTextPaste(false);
    } else if (entryPoint === "paste") {
      resetExtraction();
      clearFile();
      setShowTextPaste(true);
    } else if (entryPoint === "manual") {
      setWizardState({ step: "manual" });
    } else if (entryPoint === "chat") {
      setWizardState({ step: "enrich", fromExtraction: false });
    }
  };

  // Handle file selection
  const handleFileSelect = (file: File) => {
    selectFile(file);
    setWizardState({ step: "uploading", entryPoint: "upload", file });
    // Upload will be triggered manually
  };

  // Handle upload trigger
  const handleUpload = async () => {
    await upload();
  };

  // Handle text paste submit
  const handleTextSubmit = async (text: string) => {
    setShowTextPaste(false);
    setWizardState({ step: "extracting", entryPoint: "paste" });
    await extractFromText(text);
  };

  // Handle back from review
  const handleBackFromReview = () => {
    // Preserve extracted data and return to input
    if (wizardState.step === "review") {
      setPreservedExtractedData(wizardState.extractedData);
    }
    resetExtraction();
    clearFile();
    setShowTextPaste(false);
    setWizardState({ step: "input" });
  };

  // Handle apply extracted data to profile
  const handleApplyToProfile = async (data: AppliedData) => {
    setIsApplying(true);
    try {
      await applyExtractedProfile({ extractedData: data });
      setWizardState({ step: "summary" });
    } catch (error) {
      console.error("Failed to apply extraction:", error);
      // Stay on review page, user can retry
    } finally {
      setIsApplying(false);
    }
  };

  // Handle skip to manual from review
  const handleSkipToManual = () => {
    setWizardState({ step: "manual" });
  };

  // Handle paste text fallback from error
  const handlePasteTextFallback = () => {
    resetExtraction();
    clearFile();
    setShowTextPaste(true);
    setWizardState({ step: "input" });
  };

  // Handle manual entry from error
  const handleManualEntry = () => {
    setWizardState({ step: "manual" });
  };

  // Handle start over
  const handleStartOver = () => {
    clearFile();
    resetExtraction();
    setShowTextPaste(false);
    setPreservedExtractedData(null);
    setWizardState({ step: "input" });
  };

  // Summary actions
  const handleContinueToEnrichment = () => {
    setWizardState({ step: "enrich", fromExtraction: true });
  };

  const handleSkipEnrichment = () => {
    onComplete();
  };

  const handleBackToManualFromSummary = () => {
    setWizardState({ step: "manual" });
  };

  // Determine current wizard step for indicator
  const getIndicatorStep = (): "input" | "review" | "enrich" => {
    switch (wizardState.step) {
      case "input":
      case "uploading":
      case "extracting":
        return "input";
      case "review":
        return "review";
      case "summary":
      case "enrich":
        return "enrich";
      case "manual":
        return "input";
      default:
        return "input";
    }
  };

  // Should show review step in indicator (hidden for manual/chat-first)
  const showReviewStep = wizardState.step !== "manual" &&
    !(wizardState.step === "enrich" && !wizardState.fromExtraction);

  // Render manual step - signal to parent
  if (wizardState.step === "manual") {
    // Signal parent to show ProfileWizard with step="basic"
    if (onManualEntry) {
      // Immediately call callback - parent handles navigation
      onManualEntry();
      return null;
    }
    // Fallback if no callback provided
    return (
      <div className="space-y-6">
        <WizardStepIndicator currentStep="input" showReviewStep={false} />
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Redirecting to manual profile entry...
          </p>
          <Button onClick={onComplete}>Go to Profile Editor</Button>
        </div>
      </div>
    );
  }

  // Render enrichment step
  if (wizardState.step === "enrich") {
    // Signal parent to handle enrichment via route if callback provided
    if (onEnrich) {
      onEnrich(wizardState.fromExtraction);
      return null;
    }
    // Fallback if no callback provided - render inline
    return (
      <div className="space-y-6">
        <WizardStepIndicator
          currentStep="enrich"
          showReviewStep={wizardState.fromExtraction}
        />
        <EnrichmentStep
          profile={profile ?? null}
          fromExtraction={wizardState.fromExtraction}
        />
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onComplete}>
            Done with enrichment
          </Button>
        </div>
      </div>
    );
  }

  // Render summary step
  if (wizardState.step === "summary") {
    return (
      <div className="space-y-6">
        <WizardStepIndicator currentStep="enrich" showReviewStep={true} />
        <PostApplySummary
          onContinueToEnrichment={handleContinueToEnrichment}
          onSkip={handleSkipEnrichment}
          onBackToManual={handleBackToManualFromSummary}
        />
      </div>
    );
  }

  // Render review step
  if (wizardState.step === "review") {
    return (
      <div className="space-y-6">
        <WizardStepIndicator currentStep="review" showReviewStep={true} />
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBackFromReview}>
            <ArrowLeft className="size-4 mr-1" />
            Back
          </Button>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <ResumeExtractionReview
            extractedData={wizardState.extractedData}
            onApply={handleApplyToProfile}
            onSkip={handleSkipToManual}
            isApplying={isApplying}
          />
        </div>
      </div>
    );
  }

  // All input states use grid overlay pattern for smooth transitions
  return (
    <div className="space-y-6">
      <WizardStepIndicator currentStep={getIndicatorStep()} showReviewStep={showReviewStep} />

      {/* All states in grid overlay for smooth transitions */}
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        {/* Initial entry point selection */}
        <div
          className={`transition-all duration-500 ease-out ${
            wizardState.step === "input" &&
            uploadState.status === "idle" &&
            extractionState.status === "idle" &&
            !showTextPaste
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="space-y-4">
            <EntryPointSelector onSelect={handleEntrySelect} />
            {/* Document upload zone below entry selection */}
            <div className="mt-6">
              <DocumentUpload onFileSelect={handleFileSelect} />
            </div>
          </div>
        </div>

        {/* Text paste expanded */}
        <div
          className={`transition-all duration-500 ease-out ${
            showTextPaste && extractionState.status === "idle"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="space-y-4">
            <TextPasteZone onTextSubmit={handleTextSubmit} defaultExpanded />
            <button
              onClick={() => {
                setShowTextPaste(false);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel and choose different option
            </button>
          </div>
        </div>

        {/* File selected, ready to upload */}
        <div
          className={`transition-all duration-500 ease-out ${
            uploadState.status === "selected"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {uploadState.status === "selected" && (
            <div className="space-y-4">
              <FilePreview file={uploadState.file} onRemove={handleStartOver} />
              <Button onClick={handleUpload} className="w-full">
                Upload and Extract
              </Button>
            </div>
          )}
        </div>

        {/* Uploading */}
        <div
          className={`transition-all duration-500 ease-out ${
            uploadState.status === "uploading"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {uploadState.status === "uploading" && (
            <div className="space-y-4">
              <FilePreview
                file={uploadState.file}
                onRemove={() => {}}
                disabled
              />
              <UploadProgress
                progress={uploadState.progress}
                status="uploading"
                fileName={uploadState.file.name}
              />
            </div>
          )}
        </div>

        {/* Upload error */}
        <div
          className={`transition-all duration-500 ease-out ${
            uploadState.status === "error" && extractionState.status === "idle"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="space-y-4">
            <DocumentUpload
              onFileSelect={handleFileSelect}
              error={
                uploadState.status === "error" ? uploadState.error : undefined
              }
              onErrorDismiss={handleStartOver}
            />
            <div className="flex gap-2">
              <Button onClick={retryUpload} variant="default">
                Retry Upload
              </Button>
              <Button onClick={handlePasteTextFallback} variant="outline">
                Paste text instead
              </Button>
            </div>
          </div>
        </div>

        {/* Extraction in progress */}
        <div
          className={`transition-all duration-500 ease-out ${
            extractionState.status === "extracting"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <ExtractionProgress
            stage={
              extractionState.status === "extracting"
                ? extractionState.stage
                : "reading"
            }
            fileName={
              uploadState.status === "success"
                ? uploadState.file.name
                : undefined
            }
          />
        </div>

        {/* Extraction error */}
        <div
          className={`transition-all duration-500 ease-out ${
            extractionState.status === "error"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {extractionState.status === "error" && (
            <ExtractionError
              error={extractionState.error}
              onRetry={retryExtraction}
              onPasteText={handlePasteTextFallback}
              onManualEntry={handleManualEntry}
              canRetry={extractionState.canRetry}
            />
          )}
        </div>
      </div>
    </div>
  );
}
