import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import type { Id } from '../../../convex/_generated/dataModel'
import type { ExtractedData } from '~/components/profile/upload/hooks/useExtraction'
import { useExtraction } from '~/components/profile/upload/hooks/useExtraction'
import { useFileUpload } from '~/components/profile/upload/hooks/useFileUpload'

const LINKEDIN_URL_RE =
  /(?:https?:\/\/)?(?:[\w-]+\.)?linkedin\.com\/in\/[^\s]+/i

function looksLikeCV(text: string): boolean {
  return text.length > 300 && text.split('\n').length >= 5
}

type ExtractionSource = 'linkedin' | 'cv' | 'text'

interface UseSmartInputProps {
  profileId: Id<'profiles'>
  threadId: string
  onComplete?: () => void
}

/**
 * Build a preview summary of extracted LinkedIn data for the agent thread.
 */
function buildLinkedInPreview(data: ExtractedData): string {
  const lines: Array<string> = [
    '[LinkedIn profile extracted — awaiting confirmation]',
  ]
  if (data.name) lines.push(`Name: ${data.name}`)

  // Find current role from work history
  const currentJob = data.workHistory?.find(
    (w) => !w.endDate || w.endDate.toLowerCase() === 'present',
  )
  if (currentJob) {
    lines.push(
      `Current role: ${currentJob.title} at ${currentJob.organization}`,
    )
  }

  if (data.education && data.education.length > 0) {
    const institutions = data.education.map((e) => e.institution).join(', ')
    lines.push(
      `Education: ${data.education.length} ${data.education.length === 1 ? 'entry' : 'entries'} (${institutions})`,
    )
  }

  if (data.workHistory && data.workHistory.length > 0) {
    lines.push(`Work history: ${data.workHistory.length} positions`)
  }

  if (data.skills && data.skills.length > 0) {
    lines.push(
      `Skills: ${data.skills.length} matched (${data.skills.slice(0, 5).join(', ')}${data.skills.length > 5 ? ', ...' : ''})`,
    )
  }

  return lines.join('\n')
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

  // Two-phase LinkedIn confirmation state
  const [pendingLinkedInData, setPendingLinkedInData] =
    useState<ExtractedData | null>(null)
  const [showLinkedInConfirm, setShowLinkedInConfirm] = useState(false)

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
  const extractFromDocumentRef = useRef(extraction.extractFromDocument)
  extractFromDocumentRef.current = extraction.extractFromDocument
  useEffect(() => {
    if (fileUpload.state.status === 'success') {
      sourceRef.current = 'cv'
      hasApplied.current = false
      extractFromDocumentRef.current(fileUpload.state.documentId)
    }
  }, [fileUpload.state.status])

  // Apply results and notify agent when extraction succeeds
  useEffect(() => {
    if (extraction.state.status !== 'success' || hasApplied.current) return
    hasApplied.current = true

    const data = extraction.state.extractedData

    // LinkedIn: hold data for confirmation instead of applying immediately
    if (sourceRef.current === 'linkedin') {
      setPendingLinkedInData(data)
      setShowLinkedInConfirm(true)

      // Send preview to agent thread so it can discuss with user
      const preview = buildLinkedInPreview(data)
      void sendMut({ threadId, prompt: preview, profileId })

      extraction.reset()
      return
    }

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

  // Confirm LinkedIn import — apply the pending data
  const confirmLinkedInImport = useCallback(async () => {
    if (!pendingLinkedInData) return

    try {
      setIsApplying(true)
      const data = pendingLinkedInData
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
        source: 'linkedin',
      })

      await sendMut({ threadId, prompt: summary, profileId })

      setPendingLinkedInData(null)
      setShowLinkedInConfirm(false)
      fileUpload.clearFile()
      onCompleteRef.current?.()
    } catch (err) {
      console.error('Failed to apply LinkedIn import:', err)
    } finally {
      setIsApplying(false)
    }
  }, [pendingLinkedInData, applyMut, sendMut, profileId, threadId, fileUpload])

  // Cancel LinkedIn import — discard pending data and notify agent
  const cancelLinkedInImport = useCallback(() => {
    setPendingLinkedInData(null)
    setShowLinkedInConfirm(false)
    extraction.reset()

    // Notify agent that user rejected the import
    void sendMut({
      threadId,
      prompt:
        '[LinkedIn import cancelled — user indicated this is not their profile]',
      profileId,
    })
  }, [extraction, sendMut, threadId, profileId])

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
      ? `Uploading... ${Math.round(fileUpload.state.progress)}%`
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
    // LinkedIn two-phase confirmation
    showLinkedInConfirm,
    pendingLinkedInData,
    confirmLinkedInImport,
    cancelLinkedInImport,
  }
}
