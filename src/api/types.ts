export type Role = 'user' | 'admin'

export interface User {
  id: string
  email: string
  role: Role
  tokenBalance: number
}

export interface AuthResult {
  token: string
  user: User
}

export interface ContentItem {
  id: string
  title: string
  body: string
  tags: string[]
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Page<T> {
  data: T[]
  meta: { page: number; limit: number; total: number; totalPages: number }
}

export type RunStatus = 'SUCCESS' | 'FALLBACK' | 'TIMEOUT' | 'FAILED'

export interface AiRun {
  id: string
  contentId: string
  userId: string
  promptVersion: string
  status: RunStatus
  output: string
  latencyMs: number
  tokensAwarded: number
  reason?: string
  createdAt: string
}

export type LedgerType = 'EARN' | 'CONVERT' | 'WITHDRAW'

export interface LedgerRow {
  id: string
  type: LedgerType
  source: string
  amount: number
  balanceAfter: number
  referenceId?: string
  createdAt: string
}

export interface Conversion {
  id: string
  toAsset: 'MOCK_USDT' | 'MOCK_ETH'
  amount: number
  convertedAmount: string
  status: 'PENDING' | 'CONFIRMED' | 'WITHDRAWN' | 'FAILED'
  txHashMock: string
  createdAt: string
}

export interface Balance {
  userId: string
  tokenBalance: number
}

export interface SummarizeResult {
  output: string
  latencyMs: number
  tokensAwarded: number
  totalTokenBalance: number
  status?: string
  reason?: string
}

export interface ConvertResult {
  conversionId: string
  txHashMock: string
  convertedAmount: string
  status: string
  totalTokenBalance: number
}

export interface WithdrawResult {
  status: string
  network: string
  txHashMock: string
}

export interface MediaAsset {
  id: string
  status: 'TEMP' | 'PROMOTED' | 'FAILED'
  provider: 'cloudinary' | 's3'
  url: string
  mimeType: string
  size: number
  s3Key?: string
}

export interface PromotedMedia {
  id: string
  status: 'PROMOTED'
  provider: 's3'
  s3Key: string
  url: string
}
