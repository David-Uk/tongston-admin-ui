import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Skeleton } from './ui'

export function ProtectedRoute({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, ready } = useAuth()

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <Skeleton rows={6} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (admin && user.role !== 'admin') return <Navigate to="/content" replace />
  return <>{children}</>
}
