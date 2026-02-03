/**
 * Upload a file to a Convex storage URL with progress tracking.
 *
 * Uses XMLHttpRequest (not fetch) because fetch lacks upload progress events.
 * The file is sent as a raw body (not FormData) per Convex requirements.
 *
 * @param file - The File to upload
 * @param uploadUrl - The Convex-generated upload URL
 * @param onProgress - Callback with upload progress percentage (0-100)
 * @returns Promise resolving to the storageId
 */
export async function uploadWithProgress(
  file: File,
  uploadUrl: string,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    // Track upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    // Handle successful completion
    xhr.addEventListener('load', () => {
      // Report 100% explicitly before resolving
      onProgress(100)

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText) as { storageId: string }
          resolve(response.storageId)
        } catch {
          reject(new Error('Invalid response from upload server'))
        }
      } else {
        reject(
          new Error(
            `Upload failed with status ${xhr.status}: ${xhr.statusText}`,
          ),
        )
      }
    })

    // Handle network errors
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'))
    })

    // Handle upload abortion
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was cancelled'))
    })

    // Configure and send the request
    xhr.open('POST', uploadUrl)
    xhr.setRequestHeader('Content-Type', file.type)
    xhr.send(file)
  })
}
