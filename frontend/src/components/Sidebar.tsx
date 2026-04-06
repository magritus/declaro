import { useLocation, useNavigate, NavLink } from 'react-router-dom'
import { useCalisma } from '@/api/calisma'
import { useDonem } from '@/api/donem'
import { useMukellef } from '@/api/mukellef'
import { useAuth } from '@/hooks/useAuth'
import ThemeToggle from '@/components/ThemeToggle'
import declaroLogo from '@/assets/declero_logo.png'

function useCalismaId() {
  const { pathname } = useLocation()
  const match = pathname.match(/\/calisma\/(\d+)/)
  return match?.[1]
}

const CEYREK_SHORT: Record<string, string> = {
  'Q1-GV': 'Q1 Geçici',
  'Q2-GV': 'Q2 Geçici',
  'Q3-GV': 'Q3 Geçici',
  'Q4-GV': 'Q4 Geçici',
  'YILLIK': 'Yıllık KV',
}

interface NavItemProps {
  to: string
  icon: React.ReactNode
  label: string
  active: boolean
}

function NavItem({ to, icon, label, active }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 text-left ${
          isActive || active
            ? 'bg-accent/10 text-accent dark:bg-accent/15'
            : 'text-secondary hover:bg-surface-overlay hover:text-primary'
        }`
      }
    >
      <span className={`flex-shrink-0 ${active ? 'text-accent' : 'text-muted'}`}>{icon}</span>
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

interface WizardStepProps {
  to: string
  label: string
  active: boolean
  done: boolean
  accessible: boolean
}

function WizardStep({ to, label, active, done, accessible }: WizardStepProps) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => accessible && navigate(to)}
      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-xs transition-colors duration-150 text-left ${
        active
          ? 'text-accent font-semibold bg-accent/5'
          : done
          ? 'text-secondary hover:text-primary hover:bg-surface-overlay cursor-pointer'
          : accessible
          ? 'text-muted hover:bg-surface-overlay cursor-pointer'
          : 'text-muted/60 cursor-default'
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px] font-bold transition-colors ${
          active
            ? 'bg-accent text-white shadow-sm'
            : done
            ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-surface-overlay border border-border-default text-muted'
        }`}
      >
        {done && !active ? '✓' : active ? '●' : ''}
      </span>
      <span className="truncate">{label}</span>
    </button>
  )
}

export default function Sidebar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const calismaId = useCalismaId()
  const calismaIdNum = calismaId ? Number(calismaId) : undefined

  const { data: calisma } = useCalisma(calismaIdNum)
  const { data: donem } = useDonem(calisma?.donem_id?.toString())
  const { data: mukellef } = useMukellef(donem?.mukellef_id)

  const wizardFaz = calisma?.wizard_faz ?? 0

  const isActivePath = (prefix: string) =>
    pathname === prefix || pathname.startsWith(prefix + '/')

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-surface-raised border-r border-border-default flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-border-subtle flex-shrink-0">
        <button onClick={() => navigate('/')} className="block focus:outline-none">
          <img src={declaroLogo} alt="Declaro" className="h-7 w-auto" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {/* Global nav */}
        <NavItem
          to="/"
          label="Ana Sayfa"
          active={pathname === '/'}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }
        />
        <NavItem
          to="/mukellef"
          label="Mükellefler"
          active={isActivePath('/mukellef') || isActivePath('/donem')}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />

        {/* Çalışma context */}
        {calismaId && (
          <>
            {/* Divider + section label */}
            <div className="pt-4 pb-1.5 px-3">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Bağlam</p>
            </div>

            {/* Context info cards */}
            <div className="mx-1 mb-1 rounded-lg bg-surface-overlay border border-border-subtle px-3 py-2.5 space-y-2">
              {mukellef && (
                <div className="flex items-start gap-2 min-w-0">
                  <svg className="w-3 h-3 text-muted flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className="text-xs text-secondary font-medium leading-tight truncate">{mukellef.unvan}</span>
                </div>
              )}
              {donem && (
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-muted truncate">{donem.yil} · {CEYREK_SHORT[donem.ceyrek] ?? donem.ceyrek}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs text-muted">Çalışma #{calismaId}</span>
                {calisma?.tamamlandi && (
                  <span className="ml-auto text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50 px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </div>
            </div>

            {/* Çalışma section */}
            <div className="pt-3 pb-1.5 px-3">
              <p className="text-[10px] font-semibold text-muted uppercase tracking-widest">Çalışma</p>
            </div>

            {/* Wizard subsection */}
            <div className="mx-1 rounded-lg border border-border-subtle px-2 py-1.5 space-y-0.5">
              <div className="flex items-center gap-2 px-1 pb-1 border-b border-border-subtle mb-1">
                <svg className="w-3.5 h-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="text-[11px] font-semibold text-secondary">Wizard</span>
              </div>
              <WizardStep
                to={`/calisma/${calismaId}/wizard/faz0`}
                label="Faz 0 — Dönem Açılışı"
                active={pathname === `/calisma/${calismaId}/wizard/faz0`}
                done={wizardFaz > 0}
                accessible={true}
              />
              <WizardStep
                to={`/calisma/${calismaId}/wizard/faz1`}
                label="Faz 1 — Ana Kategori"
                active={pathname === `/calisma/${calismaId}/wizard/faz1`}
                done={wizardFaz > 1}
                accessible={wizardFaz >= 1}
              />
              <WizardStep
                to={`/calisma/${calismaId}/wizard/faz2`}
                label="Faz 2 — Alt Kategori"
                active={pathname === `/calisma/${calismaId}/wizard/faz2`}
                done={wizardFaz > 2}
                accessible={wizardFaz >= 2}
              />
            </div>

            <NavItem
              to={`/calisma/${calismaId}/istek-listesi`}
              label="İstek Listesi"
              active={
                isActivePath(`/calisma/${calismaId}/istek-listesi`) ||
                isActivePath(`/calisma/${calismaId}/kalem`)
              }
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              }
            />
            <NavItem
              to={`/calisma/${calismaId}/ozet`}
              label="Mali Kâr Özeti"
              active={pathname === `/calisma/${calismaId}/ozet`}
              icon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </>
        )}
      </nav>

      {/* Bottom: user section */}
      <div className="border-t border-border-subtle px-3 py-3 space-y-1 flex-shrink-0">
        {/* User avatar + info */}
        <div className="flex items-center gap-2 px-1 py-1.5 mb-1">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-primary truncate font-medium">{user?.email}</p>
            {user?.role === 'admin' && (
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-medium">Admin</span>
            )}
          </div>
        </div>

        {/* Profile link */}
        <NavLink
          to="/profile"
          className={({ isActive }: { isActive: boolean }) =>
            `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-accent/10 text-accent dark:bg-accent/15'
                : 'text-secondary hover:bg-surface-overlay hover:text-primary'
            }`
          }
        >
          <svg className="w-4 h-4 flex-shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Profil
        </NavLink>

        {/* Admin users link — only for admins */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin/users"
            className={({ isActive }: { isActive: boolean }) =>
              `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-accent/10 text-accent dark:bg-accent/15'
                  : 'text-secondary hover:bg-surface-overlay hover:text-primary'
              }`
            }
          >
            <svg className="w-4 h-4 flex-shrink-0 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Kullanıcı Yönetimi
          </NavLink>
        )}

        {/* Theme toggle + logout row */}
        <div className="flex items-center justify-between px-1 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted font-medium">Görünüm</span>
            <ThemeToggle />
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors duration-150"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Çıkış
          </button>
        </div>
      </div>
    </aside>
  )
}
