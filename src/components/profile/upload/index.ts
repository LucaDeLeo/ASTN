// Components
export { default as DocumentUpload } from './DocumentUpload.svelte'
export { default as ExtractionError } from './ExtractionError.svelte'
export { default as ExtractionProgress } from './ExtractionProgress.svelte'
export { default as FilePreview } from './FilePreview.svelte'
export { default as LinkedInImport } from './LinkedInImport.svelte'
export { default as TextPasteZone } from './TextPasteZone.svelte'
export { default as UploadProgress } from './UploadProgress.svelte'

// Svelte stores
export {
  ProfileExtractionStore,
  createProfileExtractionStore,
} from '~/lib/stores/profile-extraction.svelte'
export {
  ProfileUploadStore,
  createProfileUploadStore,
} from '~/lib/stores/profile-upload.svelte'

// Utilities
export { uploadWithProgress } from './utils/uploadWithProgress'

// Types
export type {
  ExtractedData,
} from '~/components/profile/extraction/types'
export type {
  ExtractionStage as ExtractionStoreStage,
  ExtractionState as ExtractionStoreState,
} from '~/lib/stores/profile-extraction.svelte'
export type { UploadState as UploadStoreState } from '~/lib/stores/profile-upload.svelte'
