import { api } from '$convex/_generated/api'
import type { Id } from '$convex/_generated/dataModel'
import { uploadWithProgress } from '~/components/profile/upload/utils/uploadWithProgress'

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

interface ConvexMutationClient {
  mutation<Output>(mutation: unknown, args: object): Promise<Output>
}

export class ProfileUploadStore {
  state = $state<UploadState>({ status: 'idle' })

  selectFile(file: File) {
    this.state = { status: 'selected', file }
  }

  clearFile() {
    this.state = { status: 'idle' }
  }

  async upload(convex: ConvexMutationClient) {
    if (this.state.status !== 'selected') {
      return
    }

    const { file } = this.state
    this.state = { status: 'uploading', file, progress: 0 }

    try {
      const uploadUrl = await convex.mutation<string>(
        api.upload.generateUploadUrl,
        {},
      )

      const storageId = await uploadWithProgress(file, uploadUrl, (progress) => {
        this.state = { status: 'uploading', file, progress }
      })

      const documentId = await convex.mutation<Id<'uploadedDocuments'>>(
        api.upload.saveDocument,
        {
          storageId: storageId as Id<'_storage'>,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        },
      )

      this.state = {
        status: 'success',
        file,
        storageId,
        documentId,
      }
    } catch (error) {
      this.state = {
        status: 'error',
        file,
        error: error instanceof Error ? error.message : 'Upload failed',
      }
    }
  }

  retry() {
    if (this.state.status === 'error') {
      this.state = { status: 'selected', file: this.state.file }
    }
  }
}

export function createProfileUploadStore() {
  return new ProfileUploadStore()
}
