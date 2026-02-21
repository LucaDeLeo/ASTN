import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import { useExtraction } from '~/components/profile/upload/hooks/useExtraction'
import { useFileUpload } from '~/components/profile/upload/hooks/useFileUpload'

const LINKEDIN_URL_RE = /https?:\/\/(?:www\.)?linkedin\.com\/in\/[^\s]+/i

function looksLikeCV(text: string): boolean {
  return text.length > 300 && text.split('\n').length >= 5
}

type ExtractionSource = 'linkedin' | 'cv' | 'text'

interface UseSmartInputProps {
  profileId: Id<'profiles'>
  threadId: string
  onComplete?: () => void
}

export function useSmartInput({
  profileId,
  threadId,
  onComplete,
}: UseSmartInputProps) {
  const extraction = useExtraction()
  const fileUpload = useFileUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sourceRef = useRef<ExtractionSource>('text')
  const hasApplied = useRef(false)
  const [isApplying, setIsApplying] = useState(false)
  const [showCVConfirm, setShowCVConfirm] = useState(false)
  const [pendingCVText, setPendingCVText] = useState<string | null>(null)

  const applyMut = useMutation(api.agent.mutations.applyExtractionResults)
  const sendMut = useMutation(api.agent.threadOps.sendMessage)

  // Stable ref for onComplete callback
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  // Auto-upload when file is selected
  useEffect(() => {
    if (fileUpload.state.status === 'selected') {
      fileUpload.upload()
    }
  }, [fileUpload.state.status, fileUpload])

  // Start extraction when upload completes
  useEffect(() => {
    if (fileUpload.state.status === 'success') {
      sourceRef.current = 'cv'
      hasApplied.current = false
      extraction.extractFromDocument(fileUpload.state.documentId)
    }
  }, [fileUpload.state.status, fileUpload.state, extraction])

  // Apply results and notify agent when extraction succeeds
  useEffect(() => {
    if (extraction.state.status !== 'success' || hasApplied.current) return
    hasApplied.current = true

    const data = extraction.state.extractedData

    void (async () => {
      try {
        setIsApplying(true)
        const { summary } = await applyMut({
          profileId,
          threadId,
          extractedData: {
            name: data.name,
            location: data.location,
            education: data.education?.map((e) => ({
              institution: e.institution,
              degree: e.degree,
              field: e.field,
              startYear: e.startYear,
              endYear: e.endYear,
            })),
            workHistory: data.workHistory?.map((w) => ({
              organization: w.organization,
              title: w.title,
              startDate: w.startDate,
              endDate: w.endDate,
              description: w.description,
            })),
            skills: data.skills,
          },
          source: sourceRef.current,
        })

        // Send summary to agent thread — triggers agent to acknowledge
        await sendMut({ threadId, prompt: summary, profileId })

        extraction.reset()
        fileUpload.clearFile()
        onCompleteRef.current?.()
      } catch (err) {
        console.error('Failed to apply extraction results:', err)
      } finally {
        setIsApplying(false)
      }
    })()
  }, [
    extraction.state,
    profileId,
    threadId,
    applyMut,
    sendMut,
    extraction,
    fileUpload,
  ])

  /**
   * Detect LinkedIn URLs or CV-like text pastes and handle them.
   * Returns true if the input was handled (caller should not send as regular message).
   */
  const detectAndHandle = useCallback(
    (text: string): boolean => {
      // LinkedIn URL
      const match = text.match(LINKEDIN_URL_RE)
      if (match) {
        sourceRef.current = 'linkedin'
        hasApplied.current = false
        extraction.extractFromLinkedIn(match[0])
        return true
      }

      // Large text paste — likely a CV/resume
      if (looksLikeCV(text)) {
        setPendingCVText(text)
        setShowCVConfirm(true)
        return true
      }

      return false
    },
    [extraction],
  )

  const confirmCVPaste = useCallback(() => {
    if (!pendingCVText) return
    sourceRef.current = 'cv'
    hasApplied.current = false
    extraction.extractFromText(pendingCVText)
    setPendingCVText(null)
    setShowCVConfirm(false)
  }, [pendingCVText, extraction])

  const cancelCVPaste = useCallback(() => {
    setPendingCVText(null)
    setShowCVConfirm(false)
  }, [])

  const handleFileSelect = useCallback(
    (file: File) => {
      sourceRef.current = 'cv'
      hasApplied.current = false
      fileUpload.selectFile(file)
    },
    [fileUpload],
  )

  const isProcessing =
    extraction.state.status === 'extracting' ||
    fileUpload.state.status === 'uploading' ||
    isApplying

  const progressText = isApplying
    ? 'Applying to profile...'
    : fileUpload.state.status === 'uploading'
      ? `Uploading... ${Math.round(fileUpload.state.progress * 100)}%`
      : extraction.state.status === 'extracting'
        ? extraction.state.stage === 'reading'
          ? 'Reading document...'
          : extraction.state.stage === 'matching'
            ? 'Matching skills...'
            : 'Extracting profile data...'
        : null

  const error =
    extraction.state.status === 'error'
      ? extraction.state.error
      : fileUpload.state.status === 'error'
        ? fileUpload.state.error
        : null

  const dismissError = useCallback(() => {
    if (extraction.state.status === 'error') extraction.reset()
    if (fileUpload.state.status === 'error') fileUpload.clearFile()
  }, [extraction, fileUpload])

  return {
    detectAndHandle,
    handleFileSelect,
    fileInputRef,
    isProcessing,
    progressText,
    error,
    dismissError,
    showCVConfirm,
    confirmCVPaste,
    cancelCVPaste,
  }
}
