import type {
  AiRun,
  AuthResult,
  Balance,
  Conversion,
  ConvertResult,
  ContentItem,
  LedgerRow,
  MediaAsset,
  Page,
  PromotedMedia,
  SummarizeResult,
  User,
  WithdrawResult,
} from './types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:4000').replace(/\/$/, '')

// The JWT is stored in a cookie (never localStorage/sessionStorage).
const TOKEN_COOKIE = 'tw_token'
const TOKEN_MAX_AGE = 3600 // matches the API's default JWT_EXPIRES_IN=1h

const cookieAttributes = (maxAge: number): string =>
  `Path=/; Max-Age=${maxAge}; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`

function readCookie(name: string): string | null {
  const entry = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : null
}

export const getToken = (): string | null => readCookie(TOKEN_COOKIE)
export const setToken = (token: string): void => {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; ${cookieAttributes(TOKEN_MAX_AGE)}`
}
export const clearToken = (): void => {
  document.cookie = `${TOKEN_COOKIE}=; ${cookieAttributes(0)}`
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly requestId?: string

  constructor(message: string, status: number, code: string, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }
}

interface RequestOptions {
  method?: string
  body?: unknown
  idempotencyKey?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {}
  const token = getToken()
  const isForm = options.body instanceof FormData
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey

  const response = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body:
      options.body === undefined
        ? undefined
        : isForm
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as {
      error?: { message?: string; code?: string; requestId?: string }
    }
    throw new ApiError(
      payload.error?.message ?? `Request failed (${response.status})`,
      response.status,
      payload.error?.code ?? 'UNKNOWN',
      payload.error?.requestId,
    )
  }

  return (await response.json()) as T
}

const pageQuery = (page: number, limit = 20): string => `page=${page}&limit=${limit}`

export const api = {
  login: (email: string, password: string) =>
    request<AuthResult>('/auth/login', { method: 'POST', body: { email, password } }),

  register: (email: string, password: string) =>
    request<AuthResult>('/auth/register', { method: 'POST', body: { email, password } }),

  me: () => request<User>('/auth/me'),

  content: (params: { q?: string; tag?: string; page: number; limit?: number }) => {
    const search = new URLSearchParams({ page: String(params.page), limit: String(params.limit ?? 20) })
    if (params.q) search.set('q', params.q)
    if (params.tag) search.set('tag', params.tag)
    return request<Page<ContentItem>>(`/content?${search.toString()}`)
  },

  createContent: (input: { title: string; body: string; tags: string[] }) =>
    request<ContentItem>('/content', { method: 'POST', body: input }),

  summarize: (id: string, tone: string, length: string) =>
    request<SummarizeResult>(`/content/${id}/ai/summarize`, {
      method: 'POST',
      body: { tone, length },
    }),

  aiRuns: (page: number, limit = 20) =>
    request<Page<AiRun>>(`/ai-runs?${pageQuery(page, limit)}`),

  balance: () => request<Balance>('/tokens/balance'),

  history: (params: { type?: string; page: number; limit?: number }) => {
    const search = new URLSearchParams({
      page: String(params.page),
      limit: String(params.limit ?? 20),
    })
    if (params.type) search.set('type', params.type)
    return request<Page<LedgerRow>>(`/tokens/history?${search.toString()}`)
  },

  convert: (toAsset: string, amount: number, idempotencyKey: string) =>
    request<ConvertResult>('/tokens/convert', {
      method: 'POST',
      body: { toAsset, amount },
      idempotencyKey,
    }),

  conversions: () => request<Conversion[]>('/tokens/conversions'),

  withdraw: (conversionId: string, idempotencyKey: string) =>
    request<WithdrawResult>('/tokens/withdraw', {
      method: 'POST',
      body: { conversionId },
      idempotencyKey,
    }),

  adminUsers: (page: number) => request<Page<User>>(`/admin/users?${pageQuery(page)}`),

  adminUserHistory: (userId: string) =>
    request<Page<LedgerRow>>(`/admin/users/${userId}/token-history`),

  uploadMedia: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<MediaAsset>('/media/upload', { method: 'POST', body: form })
  },

  promoteMedia: (id: string) =>
    request<PromotedMedia>(`/media/${id}/promote`, { method: 'POST' }),
}
