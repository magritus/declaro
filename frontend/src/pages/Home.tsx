import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-semibold tracking-tight text-slate-100">
            Declaro
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            Kurumlar Vergisi Yardımcısı
          </span>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-8 py-24">
        <div className="max-w-2xl text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
              Declaro
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Kurumlar Vergisi beyanname süreçlerinizi adım adım yönetin.
              Mükellef kaydı, dönem tanımlama ve çalışma dosyası oluşturma
              tek platformda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/mukellef')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition-colors duration-150 shadow-lg shadow-indigo-900/40"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Mükellefler
            </button>
          </div>

          {/* Feature grid */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                ),
                title: 'Mükellef Yönetimi',
                desc: 'VKN ve vergi dairesi bilgileriyle mükellef kartı oluşturun.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Dönem Takibi',
                desc: 'Q1-GV, Q2-GV, Q3-GV ve Yıllık dönemleri ayrı ayrı yönetin.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Çalışma Dosyası',
                desc: 'Adım adım sihirbazla KKEG ve istisnalarınızı hesaplayın.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2 hover:border-slate-700 transition-colors duration-150"
              >
                <div className="flex items-center gap-2">
                  {f.icon}
                  <span className="text-sm font-semibold text-slate-200">{f.title}</span>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
