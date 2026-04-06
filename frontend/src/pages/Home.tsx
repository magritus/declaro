import { useNavigate } from 'react-router-dom'
import declaroLogo from '@/assets/declero_logo.png'

const features = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-950/40',
    ring: 'ring-violet-200/60 dark:ring-violet-800/40',
    title: 'Mükellef Yönetimi',
    desc: 'VKN ve vergi dairesi bilgileriyle mükellef kartı oluşturun, tüm mükelleflerinizi tek ekranda görün.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    color: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-50 dark:bg-sky-950/40',
    ring: 'ring-sky-200/60 dark:ring-sky-800/40',
    title: 'Dönem Takibi',
    desc: 'Q1-GV, Q2-GV, Q3-GV ve Yıllık dönemleri ayrı ayrı tanımlayın, yönetin ve izleyin.',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'ring-emerald-200/60 dark:ring-emerald-800/40',
    title: 'Çalışma Dosyası',
    desc: 'Adım adım sihirbazla KKEG ve istisnalarınızı hesaplayın, mali kâr özetinize ulaşın.',
  },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Gradient orb top-right */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-accent/8 blur-3xl" />
        {/* Gradient orb bottom-left */}
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-sky-500/6 blur-3xl" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(var(--color-border-default) 1px, transparent 1px), linear-gradient(90deg, var(--color-border-default) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <main className="relative flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full text-center space-y-10">

          {/* Logo + tagline */}
          <div className="space-y-5">
            <div className="flex justify-center">
              <div className="relative inline-flex">
                {/* Glow ring behind logo */}
                <div className="absolute inset-0 rounded-2xl bg-accent/10 blur-xl scale-110" />
                <img src={declaroLogo} alt="Declaro" className="relative h-36 w-auto drop-shadow-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-lg text-secondary leading-relaxed max-w-lg mx-auto">
                Kurumlar Vergisi beyanname süreçlerinizi adım adım yönetin.
              </p>
              <p className="text-sm text-muted">
                Mükellef kaydı · Dönem tanımlama · KKEG & İstisna hesaplama
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center">
            <button
              onClick={() => navigate('/mukellef')}
              className="group inline-flex items-center gap-2.5 px-7 py-3.5 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-accent/30 hover:shadow-accent/50 hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Mükellefler
              <svg className="w-4 h-4 opacity-60 group-hover:translate-x-0.5 transition-transform duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-left">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-surface-raised/80 backdrop-blur-sm border border-border-default hover:border-border-default/80 rounded-2xl p-5 space-y-3.5 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
              >
                <div className={`inline-flex p-2.5 rounded-xl ${f.bg} ring-1 ${f.ring} ${f.color}`}>
                  {f.icon}
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-primary">{f.title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Divider + version hint */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <div className="h-px flex-1 bg-border-subtle" />
            <span className="text-xs text-muted/60 font-medium tracking-wide px-2">KV Beyanname Çalışma Aracı</span>
            <div className="h-px flex-1 bg-border-subtle" />
          </div>
        </div>
      </main>
    </div>
  )
}
