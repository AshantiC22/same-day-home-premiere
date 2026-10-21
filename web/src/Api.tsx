export class ApiError extends Error {
  status: number
  detail: string

  constructor(status: number, detail: string) {
    super(detail)
    this.status = status
    this.detail = detail
  }
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, options)
  if (!res.ok) {
    let detail = 'REQUEST_FAILED'
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') {
        detail = body.detail
      }
    } catch {
      // the error body was not JSON, so keep the default text
    }
    throw new ApiError(res.status, detail)
  }
  return res.json()
}