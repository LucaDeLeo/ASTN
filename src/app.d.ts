declare global {
  namespace App {
    interface Error {
      message: string
      kind: string
      timestamp: number
      traceId: string
    }
  }
}

export {}
