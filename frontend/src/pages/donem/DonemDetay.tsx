import { useNavigate, useParams } from 'react-router-dom'
import { useCalismalar, useCreateCalisma } from '@/api/calisma'

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="bg-red-950 border border-red-800 text-red-300 rounded-lg px-4 py-3 text-sm">
      {message}
    </div>
  )
}

export default function DonemDetay() {
  const { donemId } = useParams<{ donemId: string }>()
  const navigate = useNavigate()
  const id = donemId ? parseInt(donemId, 10) : undefined

  const { data: calismalar, isLoading: calismalarLoading, error: calismalarError } = useCalismalar(id)
  const createCalisma = useCreateCalisma(id)

  // We need to find which donem this is to get mukellef info.
  // We'll derive mukellef_id from the first calisma's donem_id by fetching
  // donemler for the mukellef — but we don't know mukellef_id yet.
  // Instead: we fetch all donemler would require mukellef_id.
  // Simple approach: show donem info from calismalar list, or
  // get donem info via the calismalar response (donem_id is known).
  // We use a separate approach: store donem info from navigated state,
  // or we request the donem via a broader query.
  // The API doesn't have GET /donem/{id}, so we'll use a workaround:
  // we can store the donem object in location state or we need to fetch
  // all mükellef dönemler. Since we don't have a direct /donem/{id} endpoint,
  // let's just display available info and link back properly.

  // We'll use the calismalar's donem_id to link back, and show minimal info.
  // For the breadcrumb we need mukellef context. Let's use the navigation state
  // passed via navigate('/donem/{id}', { state: { donem, mukellef } }).
  // But since we can't guarantee state, let's work with what we have.

  const handleCreateCalisma = () => {
    createCalisma.mutate(undefined, {
      onSuccess: (calisma) => {
        navigate(`/calisma/${calisma.id}/wizard/faz0`)
      },
    })
  }

  const isLoading = calismalarLoading

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-300 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/mukellef')}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Mükellefler
          </button>
          <span className="text-slate-700">/</span>
          <button
            onClick={() => navigate(-1)}
            className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
          >
            Mükellef
          </button>
          <span className="text-slate-700">/</span>
          <span className="text-slate-200 text-sm font-medium">
            Dönem #{id}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {calismalarError && <ErrorBox message="Çalışmalar yüklenirken hata oluştu." />}
        {isLoading && <Spinner />}

        {!isLoading && (
          <>
            {/* Dönem info card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-white">Dönem #{id}</h1>
                  <p className="text-slate-400 text-sm">
                    Bu döneme ait tüm çalışma dosyaları aşağıda listelenmektedir.
                  </p>
                </div>
              </div>
            </div>

            {/* Çalışmalar section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Çalışmalar</h2>
                <button
                  onClick={handleCreateCalisma}
                  disabled={createCalisma.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors duration-150"
                >
                  {createCalisma.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                      Yeni Çalışma Başlat
                    </>
                  )}
                </button>
              </div>

              {createCalisma.isError && (
                <ErrorBox message="Çalışma oluşturulurken hata oluştu." />
              )}

              {calismalar && calismalar.length > 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Çalışma #</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Wizard Fazı</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Durum</th>
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Oluşturulma</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {calismalar.map((c, idx) => (
                        <tr
                          key={c.id}
                          onClick={() => navigate(`/calisma/${c.id}/wizard/faz${c.wizard_faz}`)}
                          className={`cursor-pointer hover:bg-slate-800/60 transition-colors duration-100 ${idx < calismalar.length - 1 ? 'border-b border-slate-800/60' : ''}`}
                        >
                          <td className="px-5 py-4 font-mono font-medium text-white">
                            #{c.id}
                          </td>
                          <td className="px-5 py-4 text-slate-300">
                            Faz {c.wizard_faz}
                          </td>
                          <td className="px-5 py-4">
                            {c.tamamlandi ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-900">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Tamamlandı
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-950 text-amber-300 border border-amber-900">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                Devam Ediyor
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-500 text-xs hidden lg:table-cell">
                            {new Date(c.created_at).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <svg className="w-4 h-4 text-slate-600 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-slate-600 bg-slate-900 border border-slate-800 rounded-xl">
                  <svg className="w-8 h-8 mx-auto mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Bu döneme ait çalışma bulunmuyor.</p>
                  <button
                    onClick={handleCreateCalisma}
                    disabled={createCalisma.isPending}
                    className="mt-3 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    İlk çalışmayı başlatın
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
