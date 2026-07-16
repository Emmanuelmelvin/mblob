export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const badRequest = (message: string, details?: Record<string, unknown>) => new ApiError(400, message, details)
export const unauthorized = (message: string, details?: Record<string, unknown>) => new ApiError(401, message, details)
export const notFound = (message: string, details?: Record<string, unknown>) => new ApiError(404, message, details)

export function errorContext(error: unknown) {
  if (error instanceof Error) return { err: error, errorName: error.name, errorMessage: error.message, errorStack: error.stack }
  return { errorMessage: String(error), errorValue: error }
}
