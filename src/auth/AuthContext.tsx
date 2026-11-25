import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearToken, getToken, setToken } from '../api/client'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | null
  ready: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      return
    }
    try {
      setUser(await api.me())
    } catch {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshUser().finally(() => setReady(true))
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password)
    setToken(result.token)
    setUser(result.user)
  }

  const register = async (email: string, password: string) => {
    const result = await api.register(email, password)
    setToken(result.token)
    setUser(result.user)
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
