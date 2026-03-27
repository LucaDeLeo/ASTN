import { api } from '$convex/_generated/api'
import type { Id } from '$convex/_generated/dataModel'
import type { ExtractedData } from '~/components/profile/extraction/types'

export type ExtractionStage = 'reading' | 'extracting' | 'matching'

export type ExtractionState =
  | { status: 'idle' }
  | {
      status: 'extracting'
      stage: ExtractionStage
      documentId: Id<'uploadedDocuments'>
    }
  | { status: 'success'; extractedData: ExtractedData }
  | { status: 'error'; error: string; canRetry: boolean }

interface ConvexExecutionClient {
  mutation<Output>(mutation: unknown, args: object): Promise<Output>
  action<Output>(action: unknown, args: object): Promise<Output>
}

interface DocumentExtractionStatus {
  status: string
  extractedData?: unknown
  errorMessage?: string
}

export class ProfileExtractionStore {
  state = $state<ExtractionState>({ status: 'idle' })

  private extracting = false
  private lastDocumentId = $state<Id<'uploadedDocuments'> | null>(null)
  private lastText = $state<string | null>(null)
  private lastLinkedInUrl = $state<string | null>(null)
  private stageTimers: Array<ReturnType<typeof setTimeout>> = []

  private clearStageTimers() {
    for (const timer of this.stageTimers) {
      clearTimeout(timer)
    }
    this.stageTimers = []
  }

  private scheduleStageProgress(documentId: Id<'uploadedDocuments'>) {
    this.clearStageTimers()

    this.stageTimers.push(
      setTimeout(() => {
        if (
          this.state.status === 'extracting' &&
          this.state.documentId === documentId
        ) {
          this.state = { ...this.state, stage: 'extracting' }
        }
      }, 500),
    )

    this.stageTimers.push(
      setTimeout(() => {
        if (
          this.state.status === 'extracting' &&
          this.state.documentId === documentId
        ) {
          this.state = { ...this.state, stage: 'matching' }
        }
      }, 2000),
    )
  }

  syncDocumentStatus(documentStatus: DocumentExtractionStatus | null | undefined) {
    if (this.state.status !== 'extracting' || !documentStatus) {
      return
    }

    if (documentStatus.status === 'extracted' && documentStatus.extractedData) {
      this.clearStageTimers()
      this.state = {
        status: 'success',
        extractedData: documentStatus.extractedData as ExtractedData,
      }
      return
    }

    if (documentStatus.status === 'failed') {
      this.clearStageTimers()
      this.state = {
        status: 'error',
        error: documentStatus.errorMessage || 'Extraction failed',
        canRetry: true,
      }
    }
  }

  async extractFromDocument(
    documentId: Id<'uploadedDocuments'>,
    convex: ConvexExecutionClient,
  ) {
    if (this.extracting) {
      return
    }

    this.extracting = true
    this.lastDocumentId = documentId
    this.lastText = null
    this.lastLinkedInUrl = null
    this.state = { status: 'extracting', stage: 'reading', documentId }
    this.scheduleStageProgress(documentId)

    try {
      await convex.mutation(api.extraction.mutations.requestExtraction, {
        documentId,
      })
    } catch (error) {
      this.clearStageTimers()
      this.state = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Extraction failed',
        canRetry: true,
      }
    } finally {
      this.extracting = false
    }
  }

  async extractFromText(text: string, convex: ConvexExecutionClient) {
    this.clearStageTimers()
    this.lastText = text
    this.lastDocumentId = null
    this.lastLinkedInUrl = null
    this.state = {
      status: 'extracting',
      stage: 'extracting',
      documentId: '' as Id<'uploadedDocuments'>,
    }

    try {
      const result = await convex.action<{ extractedData: ExtractedData }>(
        api.extraction.text.extractFromText,
        { text },
      )
      this.state = {
        status: 'success',
        extractedData: result.extractedData,
      }
    } catch (error) {
      this.state = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Extraction failed',
        canRetry: true,
      }
    }
  }

  async extractFromLinkedIn(url: string, convex: ConvexExecutionClient) {
    this.clearStageTimers()
    this.lastLinkedInUrl = url
    this.lastDocumentId = null
    this.lastText = null
    this.state = {
      status: 'extracting',
      stage: 'extracting',
      documentId: '' as Id<'uploadedDocuments'>,
    }

    try {
      const result = await convex.action<{ extractedData: ExtractedData }>(
        api.extraction.linkedin.extractFromLinkedIn,
        { linkedinUrl: url },
      )
      this.state = {
        status: 'success',
        extractedData: result.extractedData,
      }
    } catch (error) {
      this.state = {
        status: 'error',
        error:
          error instanceof Error ? error.message : 'LinkedIn import failed',
        canRetry: true,
      }
    }
  }

  async retry(convex: ConvexExecutionClient) {
    if (this.lastDocumentId) {
      await this.extractFromDocument(this.lastDocumentId, convex)
      return
    }

    if (this.lastLinkedInUrl !== null) {
      await this.extractFromLinkedIn(this.lastLinkedInUrl, convex)
      return
    }

    if (this.lastText !== null) {
      await this.extractFromText(this.lastText, convex)
    }
  }

  reset() {
    this.clearStageTimers()
    this.state = { status: 'idle' }
    this.lastDocumentId = null
    this.lastText = null
    this.lastLinkedInUrl = null
  }
}

export function createProfileExtractionStore() {
  return new ProfileExtractionStore()
}
