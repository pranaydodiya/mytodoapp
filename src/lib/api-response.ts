import { NextResponse } from 'next/server'
import { z } from 'zod'

/** Shared error JSON for all API routes. */
export type ApiErrorBody = {
  error: string
  code?: string
  issues?: Record<string, string[] | undefined>
}

export function jsonError(
  message: string,
  status: number,
  extras?: { code?: string; issues?: Record<string, string[] | undefined> },
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: message }
  if (extras?.code) body.code = extras.code
  if (extras?.issues && Object.keys(extras.issues).length > 0) {
    body.issues = extras.issues
  }
  return NextResponse.json(body, { status })
}

export function searchParamsToRecord(searchParams: URLSearchParams): Record<string, string> {
  const record: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    if (value !== '') record[key] = value
  })
  return record
}

export function parseQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T,
):
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<ApiErrorBody> } {
  const raw = searchParamsToRecord(searchParams)
  const result = schema.safeParse(raw)
  if (!result.success) {
    const flat = result.error.flatten()
    const first =
      result.error.errors[0]?.message ??
      (flat.formErrors[0] as string | undefined) ??
      'Validation failed'
    return {
      ok: false,
      response: jsonError(first, 400, {
        code: 'VALIDATION_ERROR',
        issues: flat.fieldErrors,
      }),
    }
  }
  return { ok: true, data: result.data }
}

export async function parseJsonBody<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
): Promise<
  | { ok: true; data: z.infer<T> }
  | { ok: false; response: NextResponse<ApiErrorBody> }
> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return {
      ok: false,
      response: jsonError('Invalid JSON body', 400, { code: 'INVALID_JSON' }),
    }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    const flat = result.error.flatten()
    const first =
      result.error.errors[0]?.message ??
      (flat.formErrors[0] as string | undefined) ??
      'Validation failed'
    return {
      ok: false,
      response: jsonError(first, 400, {
        code: 'VALIDATION_ERROR',
        issues: flat.fieldErrors,
      }),
    }
  }
  return { ok: true, data: result.data }
}
