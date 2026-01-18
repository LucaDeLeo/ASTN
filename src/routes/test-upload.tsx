import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
            <strong>Extraction:</strong> {extractionState.status}
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

        {/* Extraction success - show preview */}
        <div
          className={`transition-all duration-500 ease-out ${
            extractionState.status === "success"
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          {extractionState.status === "success" && (
            <div className="rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/20 p-6 space-y-4">
              <h2 className="font-semibold text-green-700 dark:text-green-400">
                Extraction Complete!
              </h2>
              <div className="space-y-3 text-sm">
                {extractionState.extractedData.name && (
                  <p>
                    <strong>Name:</strong> {extractionState.extractedData.name}
                  </p>
                )}
                {extractionState.extractedData.email && (
                  <p>
                    <strong>Email:</strong>{" "}
                    {extractionState.extractedData.email}
                  </p>
                )}
                {extractionState.extractedData.location && (
                  <p>
                    <strong>Location:</strong>{" "}
                    {extractionState.extractedData.location}
                  </p>
                )}
                {extractionState.extractedData.education &&
                  extractionState.extractedData.education.length > 0 && (
                    <div>
                      <strong>Education:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {extractionState.extractedData.education.map(
                          (edu, i) => (
                            <li key={i}>
                              {edu.degree} at {edu.institution}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {extractionState.extractedData.workHistory &&
                  extractionState.extractedData.workHistory.length > 0 && (
                    <div>
                      <strong>Work History:</strong>
                      <ul className="list-disc list-inside ml-2">
                        {extractionState.extractedData.workHistory.map(
                          (job, i) => (
                            <li key={i}>
                              {job.title} at {job.organization}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                {extractionState.extractedData.skills &&
                  extractionState.extractedData.skills.length > 0 && (
                    <div>
                      <strong>Matched Skills:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {extractionState.extractedData.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <button
                onClick={handleStartOver}
                className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
