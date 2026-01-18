import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  DocumentUpload,
  FilePreview,
  TextPasteZone,
  UploadProgress,
  useFileUpload,
} from "~/components/profile/upload";

export const Route = createFileRoute("/test-upload")({
  component: TestUploadPage,
});

/**
 * Temporary test page for verifying upload components.
 * TODO: Remove after Phase 7 verification complete.
 */
function TestUploadPage() {
  const { state, selectFile, clearFile, upload, retry } = useFileUpload();
  const [pastedText, setPastedText] = useState<string | null>(null);

  const handleTextSubmit = (text: string) => {
    setPastedText(text);
    console.log("Text submitted:", text.substring(0, 100) + "...");
  };

  return (
    <div className="container mx-auto max-w-2xl p-8 space-y-8">
      <h1 className="text-2xl font-bold">Upload Test Page</h1>
      <p className="text-muted-foreground">
        Test the file upload and text paste components.
      </p>

      {/* Upload state display */}
      <div className="rounded-lg bg-muted p-4">
        <h2 className="font-semibold mb-2">Current State</h2>
        <pre className="text-sm">{JSON.stringify(state, null, 2)}</pre>
      </div>

      {/* Drag-drop zone */}
      {(state.status === "idle" || state.status === "error") && (
        <div className="space-y-4">
          <DocumentUpload
            onFileSelect={selectFile}
            error={state.status === "error" ? state.error : null}
            onErrorDismiss={clearFile}
          />

          {/* Text paste fallback */}
          <div className="flex justify-center">
            <TextPasteZone onTextSubmit={handleTextSubmit} />
          </div>
        </div>
      )}

      {/* File preview after selection */}
      {state.status === "selected" && (
        <div className="space-y-4">
          <FilePreview
            file={state.file}
            onRemove={clearFile}
            onReplace={() => {
              clearFile();
            }}
          />
          <button
            onClick={upload}
            className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Upload File
          </button>
        </div>
      )}

      {/* Progress during upload */}
      {state.status === "uploading" && (
        <div className="space-y-4">
          <FilePreview file={state.file} onRemove={() => {}} disabled />
          <UploadProgress
            progress={state.progress}
            status="uploading"
            fileName={state.file.name}
          />
        </div>
      )}

      {/* Success state */}
      {state.status === "success" && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4 space-y-2">
          <h2 className="font-semibold text-green-700">Upload Complete!</h2>
          <p className="text-sm text-green-600">
            File: {state.file.name}
          </p>
          <p className="text-sm text-green-600">
            Storage ID: {state.storageId}
          </p>
          <p className="text-sm text-green-600">
            Document ID: {state.documentId}
          </p>
          <button
            onClick={clearFile}
            className="mt-4 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Upload Another
          </button>
        </div>
      )}

      {/* Error state with retry */}
      {state.status === "error" && (
        <div className="flex gap-2">
          <button
            onClick={retry}
            className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Retry Upload
          </button>
          <button
            onClick={clearFile}
            className="rounded bg-muted px-4 py-2 hover:bg-muted/80"
          >
            Choose Different File
          </button>
        </div>
      )}

      {/* Pasted text display */}
      {pastedText && (
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <h2 className="font-semibold">Pasted Text Preview</h2>
          <p className="text-sm text-muted-foreground">
            {pastedText.length.toLocaleString()} characters
          </p>
          <pre className="max-h-40 overflow-auto text-xs whitespace-pre-wrap">
            {pastedText.substring(0, 500)}
            {pastedText.length > 500 && "..."}
          </pre>
          <button
            onClick={() => setPastedText(null)}
            className="text-sm text-primary hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
