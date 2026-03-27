import { randomUUID } from 'node:crypto'
import { NodeServices } from '@effect/platform-node'
import { error as svelteKitError } from '@sveltejs/kit'
import { Cause, Data, Effect, Exit, Layer, ManagedRuntime } from 'effect'
import { ClerkError, ClerkService } from '$lib/services/clerk'
import { ConvexError, ConvexPrivateService } from '$lib/services/convex'

const appLayer = Layer.mergeAll(
  NodeServices.layer,
  ConvexPrivateService.layer,
  ClerkService.layer,
)

export const runtime = ManagedRuntime.make(appLayer)

export class GenericError extends Data.TaggedError('GenericError')<{
  readonly message: string
  readonly status: number
  readonly kind: string
  readonly timestamp: number
  readonly traceId: string
  readonly cause?: unknown
}> {}

export const createGenericError = ({
  message,
  status,
  kind,
  cause,
}: {
  message: string
  status: number
  kind: string
  cause?: unknown
}) =>
  new GenericError({
    message,
    status,
    kind,
    timestamp: Date.now(),
    traceId: randomUUID(),
    cause,
  })

const serializeUnknown = (value: unknown): unknown => {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: value.cause === undefined ? undefined : serializeUnknown(value.cause),
    }
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
  ) {
    return value
  }

  try {
    return JSON.parse(JSON.stringify(value))
  } catch {
    return String(value)
  }
}

const toPublicError = (
  errorValue: Pick<
    GenericError | ConvexError | ClerkError,
    'message' | 'kind' | 'timestamp' | 'traceId'
  >,
) => ({
  message: errorValue.message,
  kind: errorValue.kind,
  timestamp: errorValue.timestamp,
  traceId: errorValue.traceId,
})

const logTaggedError = (errorValue: GenericError | ConvexError | ClerkError) => {
  if (errorValue instanceof ConvexError) {
    console.error('Convex error', {
      traceId: errorValue.traceId,
      kind: errorValue.kind,
      timestamp: errorValue.timestamp,
      operation: errorValue.operation,
      functionName: errorValue.functionName,
      componentPath: errorValue.componentPath,
      message: errorValue.message,
      cause: serializeUnknown(errorValue.cause),
    })

    return
  }

  if (errorValue instanceof ClerkError) {
    console.error('Clerk error', {
      traceId: errorValue.traceId,
      kind: errorValue.kind,
      timestamp: errorValue.timestamp,
      message: errorValue.message,
      cause: serializeUnknown(errorValue.cause),
    })

    return
  }

  console.error('Application error', {
    traceId: errorValue.traceId,
    kind: errorValue.kind,
    timestamp: errorValue.timestamp,
    status: errorValue.status,
    message: errorValue.message,
    cause: serializeUnknown(errorValue.cause),
  })
}

export const effectRunner = async <T>(
  effect: Effect.Effect<
    T,
    GenericError | ConvexError | ClerkError,
    NodeServices.NodeServices | ConvexPrivateService | ClerkService
  >,
) => {
  const exit = await runtime.runPromiseExit(effect)

  if (Exit.isFailure(exit)) {
    const cause = exit.cause

    for (const reason of cause.reasons) {
      if (Cause.isFailReason(reason)) {
        if (
          reason.error instanceof GenericError ||
          reason.error instanceof ConvexError ||
          reason.error instanceof ClerkError
        ) {
          logTaggedError(reason.error)
        } else {
          console.error('Unhandled effect error', {
            error: serializeUnknown(reason.error),
          })
        }
      } else if (Cause.isDieReason(reason)) {
        console.error('Effect defect', {
          defect: serializeUnknown(reason.defect),
        })
      } else if (Cause.isInterruptReason(reason)) {
        console.error('Effect interrupted', {
          fiberId: reason.fiberId,
        })
      }
    }

    const firstError = Cause.findErrorOption(cause)
    if (firstError._tag === 'Some') {
      if (firstError.value instanceof ConvexError) {
        throw svelteKitError(500, toPublicError(firstError.value))
      }

      if (firstError.value instanceof ClerkError) {
        throw svelteKitError(401, toPublicError(firstError.value))
      }

      if (firstError.value instanceof GenericError) {
        throw svelteKitError(
          firstError.value.status,
          toPublicError(firstError.value),
        )
      }
    }

    const unknownError = createGenericError({
      message: 'An unknown error occurred',
      status: 500,
      kind: 'unknown_error',
      cause,
    })

    logTaggedError(unknownError)
    throw svelteKitError(unknownError.status, toPublicError(unknownError))
  }

  return exit.value
}
