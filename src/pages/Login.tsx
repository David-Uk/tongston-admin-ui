import { useState, type FormEvent } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Button, Card, Input } from '../components/ui'

export function LoginPage() {
  const { login, register, user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [requestId, setRequestId] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to="/content" replace />

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    setRequestId(undefined)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password)
      navigate('/content', { replace: true })
    } catch (cause) {
      const failure = cause instanceof ApiError ? cause : new Error('Unable to sign in')
      setError(failure.message)
      setRequestId(failure instanceof ApiError ? failure.requestId : undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">T-World</h1>
          <p className="mt-1 text-sm text-slate-500">Content, AI summaries and token rewards</p>
        </div>
        <Card>
          <form onSubmit={(event) => void submit(event)} className="space-y-4">
            <Input
              label="Email"
              icon={Mail}
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="user@example.com"
            />
            <Input
              label="Password"
              icon={Lock}
              type={showPassword ? 'text' : 'password'}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  className="rounded p-1 text-slate-400 transition-colors duration-150 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-yellow-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              hint="At least 8 characters"
            />
            {error && (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                <p>{error}</p>
                {requestId && <p className="mt-1 font-mono text-xs">requestId: {requestId}</p>}
              </div>
            )}
            <Button type="submit" variant="accent" className="w-full" loading={busy}>
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            {mode === 'login' ? 'No account yet?' : 'Already have an account?'}{' '}
            <button
              type="button"
              className="font-medium text-slate-900 underline underline-offset-2"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError('')
              }}
            >
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </Card>
        <p className="mt-4 text-center text-xs text-slate-500">
          Demo user: user1@example.com / User@12345
        </p>
      </div>
    </div>
  )
}
