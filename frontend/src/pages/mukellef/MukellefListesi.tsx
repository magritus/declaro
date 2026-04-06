import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMukellefler, useCreateMukellef, useUpdateMukellef, useDeleteMukellef } from '@/api/mukellef'
import type { Mukellef } from '@/types'
import ThemeToggle from '@/components/ThemeToggle'

const KV_ORANLARI = [
  { value: 0.25, label: '%25 — Standart KV oranı (KVK Md. 32)' },
  { value: 0.30, label: '%30 — Finans kuruluşları (banka, sigorta, finansal kiralama vb.)' },
]

const mukellefSchema = z.object({
  unvan: z.string().min(1, 'Ünvan zorunludur'),
  vkn: z.string().length(10, 'VKN tam 10 haneli olmalıdır').regex(/^\d+$/, 'VKN yalnızca rakam içermelidir'),
  vergi_dairesi: z.string().optional(),
  kv_orani: z.number().min(0.01).max(1),
})

const editSchema = z.object({
  unvan: z.string().min(1, 'Ünvan zorunludur'),
  vergi_dairesi: z.string().optional(),
  kv_orani: z.number().min(0.01).max(1),
})

type MukellefFormData = z.infer<typeof mukellefSchema>
type EditFormData = z.infer<typeof editSchema>

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

function KvOraniSelect({ register, name, errors }: { register: ReturnType<typeof useForm>['register']; name: string; errors: Record<string, { message?: string } | undefined> }) {
  return (
    <div>
      <label className="block text-sm font-medium text-secondary mb-1.5">
        KV Oranı <span className="text-red-400">*</span>
      </label>
      <select
        {...register(name, { valueAsNumber: true })}
        className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
      >
        {KV_ORANLARI.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {errors[name] && (
        <p className="mt-1 text-xs text-red-400">{errors[name]?.message as string}</p>
      )}
    </div>
  )
}

export default function MukellefListesi() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<Mukellef | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data: mukellefler, isLoading, error } = useMukellefler()
  const createMutation = useCreateMukellef()
  const updateMutation = useUpdateMukellef()
  const deleteMutation = useDeleteMukellef()

  const createForm = useForm<MukellefFormData>({
    resolver: zodResolver(mukellefSchema),
    defaultValues: { kv_orani: 0.25 },
  })

  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  })

  const onCreateSubmit = (data: MukellefFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        createForm.reset({ kv_orani: 0.25 })
        setShowForm(false)
      },
    })
  }

  const openEdit = (m: Mukellef, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTarget(m)
    editForm.reset({ unvan: m.unvan, vergi_dairesi: m.vergi_dairesi ?? '', kv_orani: m.kv_orani })
  }

  const onEditSubmit = (data: EditFormData) => {
    if (!editTarget) return
    updateMutation.mutate({ id: editTarget.id, ...data }, {
      onSuccess: () => setEditTarget(null),
    })
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleteConfirm === id) {
      deleteMutation.mutate(id, { onSuccess: () => setDeleteConfirm(null) })
    } else {
      setDeleteConfirm(id)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-primary">
      <header className="border-b border-border-default px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-muted hover:text-secondary transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-muted">/</span>
          <span className="text-primary font-medium">Mükellefler</span>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary">Mükellefler</h1>
            <p className="text-muted text-sm mt-1">Kayıtlı tüm mükellef kartları</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Mükellef
          </button>
        </div>

        {/* Yeni Mükellef Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-raised border border-border-default rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Yeni Mükellef</h2>
                <button onClick={() => { setShowForm(false); createForm.reset({ kv_orani: 0.25 }) }} className="text-muted hover:text-secondary transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Ünvan <span className="text-red-400">*</span></label>
                  <input
                    {...createForm.register('unvan')}
                    placeholder="Şirket ünvanı"
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm placeholder-muted outline-none transition-colors"
                  />
                  {createForm.formState.errors.unvan && <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.unvan.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">VKN <span className="text-red-400">*</span></label>
                  <input
                    {...createForm.register('vkn')}
                    placeholder="10 haneli vergi kimlik numarası"
                    maxLength={10}
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm placeholder-muted outline-none transition-colors font-mono"
                  />
                  {createForm.formState.errors.vkn && <p className="mt-1 text-xs text-red-400">{createForm.formState.errors.vkn.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Vergi Dairesi</label>
                  <input
                    {...createForm.register('vergi_dairesi')}
                    placeholder="Vergi dairesi adı (isteğe bağlı)"
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm placeholder-muted outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">KV Oranı <span className="text-red-400">*</span></label>
                  <select
                    {...createForm.register('kv_orani', { valueAsNumber: true })}
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                  >
                    {KV_ORANLARI.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {createMutation.isError && <ErrorBox message="Mükellef oluşturulurken hata oluştu." />}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); createForm.reset({ kv_orani: 0.25 }) }} className="flex-1 py-2.5 border border-border-default hover:border-border-subtle text-secondary font-semibold text-sm rounded-lg transition-colors">İptal</button>
                  <button type="submit" disabled={createMutation.isPending} className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
                    {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Düzenle Modal */}
        {editTarget && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-surface-raised border border-border-default rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Mükellef Düzenle</h2>
                <button onClick={() => setEditTarget(null)} className="text-muted hover:text-secondary transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-muted font-mono">VKN: {editTarget.vkn}</p>

              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Ünvan <span className="text-red-400">*</span></label>
                  <input
                    {...editForm.register('unvan')}
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                  />
                  {editForm.formState.errors.unvan && <p className="mt-1 text-xs text-red-400">{editForm.formState.errors.unvan.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Vergi Dairesi</label>
                  <input
                    {...editForm.register('vergi_dairesi')}
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">KV Oranı <span className="text-red-400">*</span></label>
                  <select
                    {...editForm.register('kv_orani', { valueAsNumber: true })}
                    className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                  >
                    {KV_ORANLARI.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {updateMutation.isError && <ErrorBox message="Mükellef güncellenirken hata oluştu." />}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setEditTarget(null)} className="flex-1 py-2.5 border border-border-default hover:border-border-subtle text-secondary font-semibold text-sm rounded-lg transition-colors">İptal</button>
                  <button type="submit" disabled={updateMutation.isPending} className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors">
                    {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {error && <ErrorBox message="Mükellefler yüklenirken hata oluştu." />}
        {isLoading && <Spinner />}

        {!isLoading && !error && (
          mukellefler && mukellefler.length > 0 ? (
            <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default">
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">Ünvan</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5">VKN</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Vergi Dairesi</th>
                    <th className="text-left text-xs font-semibold text-muted uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">KV Oranı</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {mukellefler.map((m, idx) => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/mukellef/${m.id}`)}
                      className={`cursor-pointer hover:bg-surface-overlay transition-colors duration-100 ${idx < mukellefler.length - 1 ? 'border-b border-border-subtle' : ''}`}
                    >
                      <td className="px-5 py-4 font-medium text-primary">{m.unvan}</td>
                      <td className="px-5 py-4 font-mono text-secondary">{m.vkn}</td>
                      <td className="px-5 py-4 text-muted hidden md:table-cell">{m.vergi_dairesi || '—'}</td>
                      <td className="px-5 py-4 hidden lg:table-cell">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          m.kv_orani >= 0.30
                            ? 'bg-amber-950 text-amber-300 border border-amber-900'
                            : 'bg-surface-overlay text-secondary border border-border-default'
                        }`}>
                          %{(m.kv_orani * 100).toFixed(0)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => openEdit(m, e)}
                            className="text-xs font-medium px-3 py-1.5 rounded-md border border-border-default hover:border-accent hover:text-accent text-secondary transition-colors"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={(e) => handleDelete(m.id, e)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-150 ${
                              deleteConfirm === m.id
                                ? 'bg-red-600 text-white hover:bg-red-500'
                                : 'border border-border-default hover:border-red-500 hover:text-red-500 text-secondary'
                            }`}
                          >
                            {deleteConfirm === m.id ? 'Emin misiniz?' : 'Sil'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-muted">
              <svg className="w-10 h-10 mx-auto mb-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm">Henüz mükellef eklenmemiş.</p>
              <button onClick={() => setShowForm(true)} className="mt-4 text-accent hover:text-accent-hover text-sm font-medium transition-colors">
                İlk mükellefinizi ekleyin
              </button>
            </div>
          )
        )}
      </main>
    </div>
  )
}
