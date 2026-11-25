import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Coins, FileText, Image as ImageIcon, LogOut, Menu, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { Badge } from './ui'

const links = [
  { to: '/content', label: 'Content', icon: FileText },
  { to: '/ai-runs', label: 'AI runs', icon: Sparkles },
  { to: '/tokens', label: 'Tokens', icon: Coins },
  { to: '/media', label: 'Media', icon: ImageIcon },
  { to: '/admin', label: 'Admin', icon: Users, admin: true },
]

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const nav = (
    <nav className="flex-1 space-y-1 px-3">
      {links
        .filter((link) => !link.admin || user?.role === 'admin')
        .map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md border-l-[3px] px-3 py-2 text-sm transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-yellow-400 ${
                isActive
                  ? 'border-yellow-400 bg-slate-800 text-white'
                  : 'border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
    </nav>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col bg-slate-900 py-5 md:flex">
        <div className="px-6 pb-6 text-lg font-semibold text-white">T-World</div>
        {nav}
        <div className="px-3">
          <button
            type="button"
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      </aside>

      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex md:hidden" onClick={() => setDrawerOpen(false)}>
          <div className="flex w-60 flex-col bg-slate-900 py-5" onClick={(event) => event.stopPropagation()}>
            <div className="px-6 pb-6 text-lg font-semibold text-white">T-World</div>
            {nav}
          </div>
          <div className="flex-1 bg-slate-900/50" />
        </div>
      )}

      <div className="md:pl-60">
        <header className="flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400 px-2.5 py-0.5 text-xs font-medium text-slate-900">
                <Coins size={13} /> {user.tokenBalance.toLocaleString()} tokens
              </span>
              <span className="hidden text-sm text-slate-600 sm:inline">{user.email}</span>
              <Badge tone={user.role === 'admin' ? 'info' : 'neutral'}>{user.role}</Badge>
            </div>
          )}
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
