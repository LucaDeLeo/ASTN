import { useCallback, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { uploadWithProgress } from '../utils/uploadWithProgress'
import type { Id } from '../../../../../convex/_generated/dataModel'

/**
 * Discriminated union type for upload state machine.
 * Each status has associated data appropriate to that state.
 */
export type UploadState =
  | { status: 'idle' }
  | { status: 'selected'; file: File }
  | { status: 'uploading'; file: File; progress: number }
  | {
      status: 'success'
      file: File
      storageId: string
      documentId: Id<'uploadedDocuments'>
    }
  | { status: 'error'; file: File; error: string }

/**
 * Hook return type with state and actions.
 */
export interface UseFileUploadReturn {
  state: UploadState
  selectFile: (file: File) => void
  clearFile: () => void
  upload: () => Promise<void>
  retry: () => void
}

/**
 * Custom hook for managing file upload lifecycle.
 *
 * Implements a state machine with these transitions:
 * - idle -> selected (selectFile)
 * - selected -> uploading -> success/error (upload)
 * - error -> selected (retry, preserves file reference)
 * - any -> idle (clearFile)
 *
 * Encapsulates the 3-step Convex upload flow:
 * 1. Generate upload URL via mutation
 * 2. Upload file with progress tracking via XHR
 * 3. Save document metadata via mutation
 */
export function useFileUpload(): UseFileUploadReturn {
  const [state, setState] = useState<UploadState>({ status: 'idle' })

  // Convex mutations
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl)
  const saveDocument = useMutation(api.upload.saveDocument)

  /**
   * Select a file for upload.
   * Valid from: idle, error states
   */
  const selectFile = useCallback((file: File) => {
    setState({ status: 'selected', file })
  }, [])

  /**
   * Clear the selected file and reset to idle.
   * Valid from: any state
   */
  const clearFile = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  /**
   * Execute the upload flow.
   * Valid from: selected state only
   *
   * Flow:
   * 1. Transition to uploading state
   * 2. Get upload URL from Convex
   * 3. Upload file with progress tracking
   * 4. Save document metadata
   * 5. Transition to success or error state
   */
  const upload = useCallback(async () => {
    // Only allow upload from selected state
    if (state.status !== 'selected') {
      return
    }

    const { file } = state

    // Start uploading
    setState({ status: 'uploading', file, progress: 0 })

    try {
      // Step 1: Get upload URL
      const uploadUrl = await generateUploadUrl()

      // Step 2: Upload file with progress
      const storageId = await uploadWithProgress(
        file,
        uploadUrl,
        (progress) => {
          setState({ status: 'uploading', file, progress })
        },
      )

      // Step 3: Save document metadata
      const documentId = await saveDocument({
        storageId: storageId as Id<'_storage'>,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
      })

      // Success!
      setState({
        status: 'success',
        file,
        storageId,
        documentId,
      })
    } catch (err) {
      // Keep file reference for retry capability
      setState({
        status: 'error',
        file,
        error: err instanceof Error ? err.message : 'Upload failed',
      })
    }
  }, [state, generateUploadUrl, saveDocument])

  /**
   * Retry a failed upload.
   * Valid from: error state only
   * Transitions back to selected state with same file.
   */
  const retry = useCallback(() => {
    if (state.status === 'error') {
      setState({ status: 'selected', file: state.file })
    }
  }, [state])

  return {
    state,
    selectFile,
    clearFile,
    upload,
    retry,
  }
}
