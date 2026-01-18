import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "convex/_generated/api";
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
} from "~/components/profile/upload";

export const Route = createFileRoute("/test-upload")({
  component: TestUploadPage,
});

/**
 * Test page for verifying upload and extraction flow.
 * TODO: Remove after Phase 8 verification complete.
 */
function TestUploadPage() {
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
  const [showTextPaste, setShowTextPaste] = useState(false);

  // Apply extracted data to profile
  const applyExtractedProfile = useMutation(api.profiles.applyExtractedProfile);
  const navigate = useNavigate();
  const [isApplying, setIsApplying] = useState(false);

  // Auto-trigger extraction when upload succeeds
  useEffect(() => {
    if (
      uploadState.status === "success" &&
      extractionState.status === "idle"
    ) {
      void extractFromDocument(uploadState.documentId);
    }
  }, [uploadState, extractionState.status, extractFromDocument]);

  const handleTextSubmit = async (text: string) => {
    setShowTextPaste(false);
    await extractFromText(text);
  };

  const handleStartOver = () => {
    clearFile();
    resetExtraction();
    setShowTextPaste(false);
  };

  const handlePasteTextFallback = () => {
    resetExtraction();
    clearFile();
    setShowTextPaste(true);
  };

  const handleManualEntry = () => {
    // In real app, would navigate to profile form
    alert("Would navigate to manual profile entry");
  };

  const handleApplyToProfile = async (data: AppliedData) => {
    setIsApplying(true);
    try {
      await applyExtractedProfile({ extractedData: data });
      // Reset state and navigate to enrichment with flag to auto-greet
      handleStartOver();
      void navigate({ to: "/profile/edit", search: { step: "enrichment", fromExtraction: "true" } });
    } catch (error) {
      console.error("Failed to apply extraction:", error);
      // Stay on page, user can retry
    } finally {
      setIsApplying(false);
    }
  };

  const handleSkipToManual = () => {
    handleStartOver();
    void navigate({ to: "/profile/edit" });
  };

  return (
    <div className="container mx-auto max-w-2xl p-8 space-y-8">
      <h1 className="text-2xl font-bold">Upload Test Page</h1>
      <p className="text-muted-foreground">
        Test the file upload and extraction flow.
      </p>

      {/* Debug state display */}
      <details className="rounded-lg bg-muted p-4">
        <summary className="font-semibold cursor-pointer">Debug State</summary>
        <div className="mt-2 space-y-2 text-sm">
          <p>
            <strong>Upload:</strong> {uploadState.status}
          </p>
          <p>
            <strong>Extraction:</strong>{" "}
            {extractionState.status === "success"
              ? "reviewing"
              : extractionState.status}
          </p>
        </div>
      </details>

      {/* All states in grid overlay for smooth transitions */}
      <div className="grid [&>*]:col-start-1 [&>*]:row-start-1">
        {/* Initial upload state */}
        <div
          className={`transition-all duration-500 ease-out ${
            uploadState.status === "idle" &&
            extractionState.status === "idle" &&
            !showTextPaste
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="space-y-4">
            <DocumentUpload onFileSelect={selectFile} />
            <div className="flex justify-center">
              <TextPasteZone onTextSubmit={handleTextSubmit} />
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
              onClick={() => setShowTextPaste(false)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Cancel and upload file instead
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
          {(uploadState.status === "selected" ||
            uploadState.status === "uploading") && (
            <div className="space-y-4">
              <FilePreview file={uploadState.file} onRemove={clearFile} />
              <button
                onClick={upload}
                className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
              >
                Upload and Extract
              </button>
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
              onFileSelect={selectFile}
              error={
                uploadState.status === "error" ? uploadState.error : undefined
              }
              onErrorDismiss={clearFile}
            />
            <div className="flex gap-2">
              <button
                onClick={retryUpload}
                className="rounded bg-primary px-4 py-2 text-primary-foreground"
              >
                Retry Upload
              </button>
              <button
                onClick={handlePasteTextFallback}
                className="rounded bg-muted px-4 py-2"
              >
                Paste text instead
              </button>
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

        {/* Extraction success - show review UI */}
        <div
          className={`transition-all duration-500 ease-out ${
            extractionState.status === "success"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {extractionState.status === "success" && (
            <div className="rounded-lg border bg-card p-6">
              <ResumeExtractionReview
                extractedData={extractionState.extractedData}
                onApply={handleApplyToProfile}
                onSkip={handleSkipToManual}
                isApplying={isApplying}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
