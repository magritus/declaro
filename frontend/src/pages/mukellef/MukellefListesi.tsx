import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMukellefler, useCreateMukellef, useDeleteMukellef } from '@/api/mukellef'

const mukellefSchema = z.object({
  unvan: z.string().min(1, 'Ünvan zorunludur'),
  vkn: z.string().length(10, 'VKN tam 10 haneli olmalıdır').regex(/^\d+$/, 'VKN yalnızca rakam içermelidir'),
  vergi_dairesi: z.string().optional(),
})

type MukellefFormData = z.infer<typeof mukellefSchema>

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

export default function MukellefListesi() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const { data: mukellefler, isLoading, error } = useMukellefler()
  const createMutation = useCreateMukellef()
  const deleteMutation = useDeleteMukellef()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MukellefFormData>({
    resolver: zodResolver(mukellefSchema),
  })

  const onSubmit = (data: MukellefFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        reset()
        setShowForm(false)
      },
    })
  }

  const handleDelete = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleteConfirm === id) {
      deleteMutation.mutate(id, {
        onSuccess: () => setDeleteConfirm(null),
      })
    } else {
      setDeleteConfirm(id)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-slate-300 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-slate-500">/</span>
          <span className="text-slate-200 font-medium">Mükellefler</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-10 space-y-6">
        {/* Page title + action */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mükellefler</h1>
            <p className="text-slate-500 text-sm mt-1">
              Kayıtlı tüm mükellef kartları
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Mükellef
          </button>
        </div>

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Yeni Mükellef</h2>
                <button
                  onClick={() => { setShowForm(false); reset() }}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Ünvan <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('unvan')}
                    placeholder="Şirket ünvanı"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                  />
                  {errors.unvan && (
                    <p className="mt-1 text-xs text-red-400">{errors.unvan.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    VKN <span className="text-red-400">*</span>
                  </label>
                  <input
                    {...register('vkn')}
                    placeholder="10 haneli vergi kimlik numarası"
                    maxLength={10}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors font-mono"
                  />
                  {errors.vkn && (
                    <p className="mt-1 text-xs text-red-400">{errors.vkn.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    Vergi Dairesi
                  </label>
                  <input
                    {...register('vergi_dairesi')}
                    placeholder="Vergi dairesi adı (isteğe bağlı)"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2.5 text-white text-sm placeholder-slate-500 outline-none transition-colors"
                  />
                </div>

                {createMutation.isError && (
                  <ErrorBox message="Mükellef oluşturulurken hata oluştu." />
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); reset() }}
                    className="flex-1 py-2.5 border border-slate-700 hover:border-slate-600 text-slate-300 font-semibold text-sm rounded-lg transition-colors duration-150"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors duration-150"
                  >
                    {createMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && <ErrorBox message="Mükellefler yüklenirken hata oluştu." />}

        {/* Loading state */}
        {isLoading && <Spinner />}

        {/* Table */}
        {!isLoading && !error && (
          mukellefler && mukellefler.length > 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">Ünvan</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5">VKN</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5 hidden md:table-cell">Vergi Dairesi</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3.5 hidden lg:table-cell">Oluşturulma</th>
                    <th className="px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {mukellefler.map((m, idx) => (
                    <tr
                      key={m.id}
                      onClick={() => navigate(`/mukellef/${m.id}`)}
                      className={`cursor-pointer hover:bg-slate-800/60 transition-colors duration-100 ${idx < mukellefler.length - 1 ? 'border-b border-slate-800/60' : ''}`}
                    >
                      <td className="px-5 py-4 font-medium text-white">{m.unvan}</td>
                      <td className="px-5 py-4 font-mono text-slate-300">{m.vkn}</td>
                      <td className="px-5 py-4 text-slate-400 hidden md:table-cell">{m.vergi_dairesi || '—'}</td>
                      <td className="px-5 py-4 text-slate-500 text-xs hidden lg:table-cell">
                        {new Date(m.created_at).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => handleDelete(m.id, e)}
                          className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors duration-150 ${
                            deleteConfirm === m.id
                              ? 'bg-red-600 text-white hover:bg-red-500'
                              : 'text-slate-500 hover:text-red-400 hover:bg-red-950'
                          }`}
                        >
                          {deleteConfirm === m.id ? 'Emin misiniz?' : 'Sil'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-600">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p className="text-sm">Henüz mükellef eklenmemiş.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors"
              >
                İlk mükellefinizi ekleyin
              </button>
            </div>
          )
        )}
      </main>
    </div>
  )
}
