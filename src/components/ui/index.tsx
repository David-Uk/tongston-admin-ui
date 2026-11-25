import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Inbox,
  Loader2,
  type LucideIcon,
} from 'lucide-react'
import { useToast } from './Toast'

type ButtonVariant = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  accent: 'bg-yellow-400 text-slate-900 hover:bg-yellow-300',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: 'sm' | 'md'
  loading?: boolean
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 disabled:opacity-50 ${
        size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm'
      } ${buttonStyles[variant]} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  icon?: LucideIcon
  trailing?: ReactNode
}

function FieldIcon({
  icon: Icon,
  align = 'center',
}: {
  icon?: LucideIcon
  align?: 'center' | 'top'
}) {
  if (!Icon) return null
  return (
    <Icon
      size={16}
      strokeWidth={2}
      aria-hidden="true"
      className={`pointer-events-none absolute left-3 text-slate-400 ${
        align === 'top' ? 'top-3' : 'top-1/2 -translate-y-1/2'
      }`}
    />
  )
}

export function Input({
  label,
  hint,
  error,
  icon,
  trailing,
  id,
  name,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-xs font-medium text-slate-500">
        {label}
      </label>
      <div className="relative">
        <FieldIcon icon={icon} />
        <input
          {...props}
          id={fieldId}
          name={name}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`h-9 w-full rounded-md border bg-white text-sm text-slate-700 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400 ${
            icon ? 'pl-9' : 'pl-3'
          } ${trailing ? 'pr-10' : 'pr-3'} ${
            error ? 'border-rose-500' : 'border-slate-300'
          }`}
        />
        {trailing && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
        )}
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Select({
  label,
  hint,
  error,
  icon,
  options,
  id,
  name,
  ...props
}: InputHTMLAttributes<HTMLSelectElement> & FieldProps & { options: Array<{ value: string; label: string }> }) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-xs font-medium text-slate-500">
        {label}
      </label>
      <div className="relative">
        <FieldIcon icon={icon} />
        <ChevronDown
          size={16}
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <select
          {...props}
          id={fieldId}
          name={name}
          className={`h-9 w-full appearance-none rounded-md border bg-white text-sm text-slate-700 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400 ${
            icon ? 'pl-9 pr-8' : 'px-3'
          } ${error ? 'border-rose-500' : 'border-slate-300'}`}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

export function Textarea({
  label,
  hint,
  error,
  icon,
  id,
  name,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1">
      <label htmlFor={fieldId} className="block text-xs font-medium text-slate-500">
        {label}
      </label>
      <div className="relative">
        <FieldIcon icon={icon} align="top" />
        <textarea
          {...props}
          id={fieldId}
          name={name}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          className={`w-full rounded-md border bg-white py-2 text-sm text-slate-700 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-yellow-400 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } ${error ? 'border-rose-500' : 'border-slate-300'}`}
        />
      </div>
      {error ? (
        <p id={`${fieldId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${fieldId}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function Card({
  title,
  action,
  children,
  className = '',
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          {title && <h2 className="text-lg font-semibold text-slate-900">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className={`rounded-xl border border-slate-200 p-5 shadow-sm ${accent ? 'bg-yellow-50' : 'bg-white'}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const badgeStyles: Record<Tone, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-slate-100 text-slate-600',
}

// eslint-disable-next-line react-refresh/only-export-components
export function badgeTone(value: string): Tone {
  const map: Record<string, Tone> = {
    SUCCESS: 'success',
    EARN: 'success',
    PROMOTED: 'success',
    CONFIRMED: 'info',
    CONVERT: 'info',
    FALLBACK: 'warning',
    TIMEOUT: 'warning',
    PENDING: 'warning',
    TEMP: 'warning',
    FAILED: 'danger',
    WITHDRAW: 'neutral',
    WITHDRAWN: 'neutral',
  }
  return map[value] ?? 'neutral'
}

export function Badge({ children, tone }: { children: ReactNode; tone?: Tone }) {
  const resolved = tone ?? badgeTone(String(children))
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeStyles[resolved]}`}>
      {children}
    </span>
  )
}

export function Table({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="whitespace-nowrap px-4 py-3 text-left font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">{children}</tbody>
      </table>
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number
  totalPages: number
  onPage: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-4 py-3">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={14} /> Previous
      </Button>
      <span className="text-xs text-slate-500">
        Page {page} of {Math.max(totalPages, 1)}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Next <ChevronRight size={14} />
      </Button>
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    dialogRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus()
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={() => onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-white p-5 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close dialog">
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-5" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="h-9 animate-pulse rounded bg-slate-200" />
      ))}
    </div>
  )
}

export function EmptyState({
  title,
  help,
  action,
}: {
  title: string
  help: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
      <Inbox size={24} className="text-slate-400" />
      <p className="font-medium text-slate-900">{title}</p>
      <p className="text-sm text-slate-500">{help}</p>
      {action}
    </div>
  )
}

export function CopyableHash({ value }: { value: string }) {
  const { notify } = useToast()
  const short = value.length > 14 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value

  const copy = async () => {
    await navigator.clipboard.writeText(value)
    notify('Copied to clipboard')
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      title={value}
      className="inline-flex items-center gap-1 rounded font-mono text-xs text-slate-600 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-yellow-400"
    >
      {short} <Copy size={13} />
    </button>
  )
}
