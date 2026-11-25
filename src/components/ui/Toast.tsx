import { createContext, useContext, useState, type ReactNode } from 'react'
import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react'

type Tone = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  tone: Tone
}

interface ToastContextValue {
  notify: (message: string, tone?: Tone) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const styles: Record<Tone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700',
  info: 'border-sky-200 bg-sky-50 text-sky-700',
}

const icons: Record<Tone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = (message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    if (tone !== 'error') {
      window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000)
    }
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed right-4 top-4 z-50 flex w-80 flex-col gap-2" role="status">
        {toasts.map((toast) => {
          const Icon = icons[toast.tone]
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm shadow-sm ${styles[toast.tone]}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
                className="rounded p-0.5 hover:bg-white/60 focus-visible:ring-2 focus-visible:ring-yellow-400"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
