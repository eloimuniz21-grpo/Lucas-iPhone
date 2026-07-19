import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Logo, LogoMark } from './Logo'

const NAV = [
  { to: '/', label: 'Visão geral', end: true },
  { to: '/estoque', label: 'Estoque' },
  { to: '/vendas', label: 'Vendas' },
  { to: '/conteudo', label: 'Conteúdo do site' },
]

export function Layout() {
  const { session, signOut } = useAuth()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-cream-soft lg:flex">
      {/* Sidebar desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <SidebarContent onNavigate={() => {}} email={session?.user.email} onSignOut={signOut} />
      </aside>

      {/* Topbar mobile */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
        <span className="inline-flex items-center gap-2">
          <LogoMark className="h-6 w-6" />
          <span className="text-sm font-semibold text-ink">Vero — Admin</span>
        </span>
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          className="rounded-md p-2 text-ink"
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {mobileNavOpen && (
        <div className="border-b border-border bg-card px-2 pb-3 lg:hidden">
          <SidebarContent
            onNavigate={() => setMobileNavOpen(false)}
            email={session?.user.email}
            onSignOut={signOut}
            compact
          />
        </div>
      )}

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}

function SidebarContent({
  onNavigate,
  email,
  onSignOut,
  compact,
}: {
  onNavigate: () => void
  email?: string
  onSignOut: () => void
  compact?: boolean
}) {
  return (
    <div className={compact ? 'py-2' : 'flex h-full flex-col p-5'}>
      {!compact && (
        <div className="mb-6">
          <Logo />
          <p className="mt-1 text-xs text-ink-muted">Painel de gestão</p>
        </div>
      )}

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-terracotta-light text-terracotta-dark'
                  : 'text-ink-muted hover:bg-cream-soft hover:text-ink'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className={compact ? 'mt-3 border-t border-border pt-3' : 'mt-auto border-t border-border pt-4'}>
        {email && <p className="truncate px-3 text-xs text-ink-muted">{email}</p>}
        <button
          type="button"
          onClick={onSignOut}
          className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-danger hover:bg-danger/10"
        >
          Sair
        </button>
      </div>
    </div>
  )
}
