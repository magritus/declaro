import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMukellef } from '@/api/mukellef'
import { useDonemler, useCreateDonem } from '@/api/donem'
import type { Donem } from '@/types'

const CEYREK_OPTIONS: Donem['ceyrek'][] = ['Q1-GV', 'Q2-GV', 'Q3-GV', 'Q4-GV', 'YILLIK']
const CEYREK_LABELS: Record<Donem['ceyrek'], string> = {
  'Q1-GV': '1. Geçici Vergi (Q1 — Oca-Mar)',
  'Q2-GV': '2. Geçici Vergi (Q2 — Oca-Haz)',
  'Q3-GV': '3. Geçici Vergi (Q3 — Oca-Eyl)',
  'Q4-GV': '4. Geçici Vergi (Q4 — Oca-Ara)',
  'YILLIK': 'Yıllık Kurumlar Vergisi Beyannamesi',
}

const donemSchema = z.object({
  yil: z.number().int().min(2000).max(2100),
  ceyrek: z.enum(['Q1-GV', 'Q2-GV', 'Q3-GV', 'Q4-GV', 'YILLIK']),
})

type DonemFormData = z.infer<typeof donemSchema>

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

export default function MukellefDetay() {
  const { mukellefId } = useParams<{ mukellefId: string }>()
  const navigate = useNavigate()
  const id = mukellefId ? parseInt(mukellefId, 10) : undefined

  const [showDonemForm, setShowDonemForm] = useState(false)

  const { data: mukellef, isLoading: mukellefLoading, error: mukellefError } = useMukellef(id)
  const { data: donemler, isLoading: donemlerLoading, error: donemlerError } = useDonemler(id)
  const createDonem = useCreateDonem(id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DonemFormData>({
    resolver: zodResolver(donemSchema),
    defaultValues: {
      yil: new Date().getFullYear(),
      ceyrek: 'YILLIK',
    },
  })

  const onSubmit = (data: DonemFormData) => {
    createDonem.mutate(data, {
      onSuccess: () => {
        reset({ yil: new Date().getFullYear(), ceyrek: 'YILLIK' })
        setShowDonemForm(false)
      },
    })
  }

  const isLoading = mukellefLoading || donemlerLoading

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-8 py-10 space-y-8">
        {mukellefError && <ErrorBox message="Mükellef bilgileri yüklenirken hata oluştu." />}
        {donemlerError && <ErrorBox message="Dönemler yüklenirken hata oluştu." />}
        {isLoading && <Spinner />}

        {mukellef && !isLoading && (
          <>
            {/* Mükellef info card */}
            <div className="bg-surface-raised border border-border-default rounded-xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-2xl font-bold text-primary">{mukellef.unvan}</h1>
                  <div className="flex items-center gap-4 text-sm text-secondary">
                    <span className="font-mono">VKN: {mukellef.vkn}</span>
                    {mukellef.vergi_dairesi && (
                      <span>{mukellef.vergi_dairesi} Vergi Dairesi</span>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted">
                  {new Date(mukellef.created_at).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>

            {/* Dönemler section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Dönemler</h2>
                <button
                  onClick={() => setShowDonemForm(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors duration-150"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Yeni Dönem
                </button>
              </div>

              {/* Dönem form modal */}
              {showDonemForm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-surface-raised border border-border-default rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-primary">Yeni Dönem</h3>
                      <button
                        onClick={() => { setShowDonemForm(false); reset() }}
                        className="text-muted hover:text-secondary transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1.5">
                          Yıl <span className="text-red-400">*</span>
                        </label>
                        <input
                          {...register('yil', { valueAsNumber: true })}
                          type="number"
                          min={2000}
                          max={2100}
                          className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                        />
                        {errors.yil && (
                          <p className="mt-1 text-xs text-red-400">{errors.yil.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-secondary mb-1.5">
                          Dönem Türü <span className="text-red-400">*</span>
                        </label>
                        <select
                          {...register('ceyrek')}
                          className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                        >
                          {CEYREK_OPTIONS.map((c) => (
                            <option key={c} value={c}>{CEYREK_LABELS[c]}</option>
                          ))}
                        </select>
                        {errors.ceyrek && (
                          <p className="mt-1 text-xs text-red-400">{errors.ceyrek.message}</p>
                        )}
                      </div>

                      {createDonem.isError && (
                        <ErrorBox message="Dönem oluşturulurken hata oluştu." />
                      )}

                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => { setShowDonemForm(false); reset() }}
                          className="flex-1 py-2.5 border border-border-default hover:border-border-subtle text-secondary font-semibold text-sm rounded-lg transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          type="submit"
                          disabled={createDonem.isPending}
                          className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
                        >
                          {createDonem.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Dönem list */}
              {donemler && donemler.length > 0 ? (
                <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border-default">
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Yıl</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Dönem Türü</th>
                        <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Oluşturulma</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {donemler.map((d, idx) => (
                        <tr
                          key={d.id}
                          onClick={() => navigate(`/donem/${d.id}`)}
                          className={`cursor-pointer hover:bg-surface-overlay transition-colors duration-100 ${idx < donemler.length - 1 ? 'border-b border-border-subtle' : ''}`}
                        >
                          <td className="px-5 py-4 font-semibold text-primary">{d.yil}</td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-950 text-indigo-300 border border-indigo-900">
                              {CEYREK_LABELS[d.ceyrek]}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-muted text-xs hidden lg:table-cell">
                            {new Date(d.created_at).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <svg className="w-4 h-4 text-muted ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16 text-muted bg-surface-raised border border-border-default rounded-xl">
                  <svg className="w-8 h-8 mx-auto mb-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">Bu mükelleffe ait dönem bulunmuyor.</p>
                  <button
                    onClick={() => setShowDonemForm(true)}
                    className="mt-3 text-accent hover:text-accent-hover text-sm font-medium transition-colors"
                  >
                    İlk dönemi ekleyin
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
