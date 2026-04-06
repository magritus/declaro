import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useCalismalar, useCreateCalisma, useDeleteCalisma } from '@/api/calisma'
import { useDonem } from '@/api/donem'

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
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

  const [silinecek, setSilinecek] = useState<number | null>(null)
  const { data: donem } = useDonem(donemId)
  const { data: calismalar, isLoading: calismalarLoading, error: calismalarError } = useCalismalar(id)
  const createCalisma = useCreateCalisma(id)
  const deleteCalisma = useDeleteCalisma(id)

  const handleCreateCalisma = () => {
    createCalisma.mutate(undefined, {
      onSuccess: (calisma) => {
        navigate(`/calisma/${calisma.id}/wizard/faz0`)
      },
    })
  }

  const isLoading = calismalarLoading

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {calismalarError && <ErrorBox message="Çalışmalar yüklenirken hata oluştu." />}
        {isLoading && <Spinner />}

        {!isLoading && (
          <>
            {/* Dönem info card */}
            <div className="bg-surface-raised border border-border-default rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-primary">{donem ? `${donem.yil} — ${donem.ceyrek}` : `Dönem #${id}`}</h1>
                  <p className="text-secondary text-sm">
                    Bu döneme ait tüm çalışma dosyaları aşağıda listelenmektedir.
                  </p>
                </div>
              </div>
            </div>

            {/* Çalışmalar section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Çalışmalar</h2>
                <button
                  onClick={handleCreateCalisma}
                  disabled={createCalisma.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors duration-150"
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

              {/* Silme onay modali */}
              {silinecek !== null && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-surface-raised border border-border-default rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-primary">Çalışmayı Sil</h3>
                    <p className="text-sm text-secondary">
                      Çalışma <span className="font-mono font-medium">#{silinecek}</span> ve tüm kalem verileri kalıcı olarak silinecek. Bu işlem geri alınamaz.
                    </p>
                    <div className="flex gap-3 pt-1">
                      <button
                        onClick={() => setSilinecek(null)}
                        className="flex-1 py-2.5 border border-border-default hover:border-border-subtle text-secondary font-semibold text-sm rounded-lg transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => {
                          deleteCalisma.mutate(silinecek, { onSuccess: () => setSilinecek(null) })
                        }}
                        disabled={deleteCalisma.isPending}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
                      >
                        {deleteCalisma.isPending ? 'Siliniyor…' : 'Evet, Sil'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {calismalar && calismalar.length > 0 ? (
                <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-default">
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Çalışma #</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Wizard Fazı</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Durum</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Oluşturulma</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {calismalar.map((c, idx) => {
                        const hedef = c.wizard_faz >= 3
                          ? `/calisma/${c.id}/istek-listesi`
                          : `/calisma/${c.id}/wizard/faz${c.wizard_faz}`
                        const duzenleme = c.wizard_faz >= 1
                          ? `/calisma/${c.id}/wizard/faz1`
                          : `/calisma/${c.id}/wizard/faz0`
                        return (
                        <tr
                          key={c.id}
                          className={`${idx < calismalar.length - 1 ? 'border-b border-border-subtle' : ''}`}
                        >
                          <td className="px-5 py-4 font-mono font-medium text-primary">
                            #{c.id}
                          </td>
                          <td className="px-5 py-4 text-secondary">
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
                          <td className="px-5 py-4 text-muted text-xs hidden lg:table-cell">
                            {new Date(c.created_at).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => navigate(hedef)}
                                className="text-xs font-medium px-3 py-1.5 rounded-md border border-border-default hover:border-accent hover:text-accent text-secondary transition-colors"
                              >
                                Görüntüle
                              </button>
                              <button
                                onClick={() => navigate(duzenleme)}
                                className="text-xs font-medium px-3 py-1.5 rounded-md border border-border-default hover:border-blue-400 hover:text-blue-400 text-secondary transition-colors"
                              >
                                Düzenle
                              </button>
                              <button
                                onClick={() => setSilinecek(c.id)}
                                className="text-xs font-medium px-3 py-1.5 rounded-md border border-border-default hover:border-red-500 hover:text-red-500 text-secondary transition-colors"
                              >
                                Sil
                              </button>
                            </div>
                          </td>
                        </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-muted bg-surface-raised border border-border-default rounded-xl">
                  <svg className="w-8 h-8 mx-auto mb-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">Bu döneme ait çalışma bulunmuyor.</p>
                  <button
                    onClick={handleCreateCalisma}
                    disabled={createCalisma.isPending}
                    className="mt-3 text-accent hover:text-accent-hover text-sm font-medium transition-colors disabled:opacity-50"
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
