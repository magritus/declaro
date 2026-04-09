import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type MukellefKisa } from '@/api/admin'
import Spinner from '@/components/ui/Spinner'

interface SirketYetkiModalProps {
  userId: number
  userEmail: string
  isOpen: boolean
  onClose: () => void
}

export default function SirketYetkiModal({ userId, userEmail, isOpen, onClose }: SirketYetkiModalProps) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['user-sirketler', userId],
    queryFn: () => adminApi.getUserSirketler(userId),
    enabled: isOpen,
  })

  const addMutation = useMutation({
    mutationFn: (mukellefId: number) => adminApi.addUserSirket(userId, mukellefId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-sirketler', userId] })
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: (mukellefId: number) => adminApi.removeUserSirket(userId, mukellefId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['user-sirketler', userId] })
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  if (!isOpen) return null

  const yetkiliIds = new Set(data?.yetkili_sirketler.map(s => s.id) ?? [])

  const filteredSirketler = (data?.tum_sirketler ?? []).filter(s =>
    s.unvan.toLowerCase().includes(search.toLowerCase()) ||
    s.vkn.includes(search)
  )

  const handleToggle = (sirket: MukellefKisa) => {
    if (yetkiliIds.has(sirket.id)) {
      removeMutation.mutate(sirket.id)
    } else {
      addMutation.mutate(sirket.id)
    }
  }

  const isPending = addMutation.isPending || removeMutation.isPending

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-raised border border-border-default rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-subtle">
          <h2 className="text-lg font-bold text-primary">Sirket Yetkileri</h2>
          <p className="text-sm text-muted mt-0.5">{userEmail}</p>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border-subtle">
          <input
            type="text"
            placeholder="Sirket ara (unvan veya VKN)..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {!isLoading && filteredSirketler.length === 0 && (
            <p className="text-center text-muted text-sm py-8">
              {search ? 'Aramayla eslesen sirket bulunamadi.' : 'Sistemde sirket yok.'}
            </p>
          )}

          {!isLoading && filteredSirketler.map(sirket => {
            const isYetkili = yetkiliIds.has(sirket.id)
            const isOwner = sirket.is_owner

            return (
              <div
                key={sirket.id}
                className="flex items-center justify-between py-2.5 border-b border-border-subtle last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary truncate">{sirket.unvan}</p>
                  <p className="text-xs text-muted">{sirket.vkn}</p>
                </div>
                <div className="ml-3 flex items-center gap-2">
                  {isOwner && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      Sahip
                    </span>
                  )}
                  <button
                    onClick={() => handleToggle(sirket)}
                    disabled={isPending || isOwner}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                      isYetkili
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40'
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40'
                    }`}
                    title={isOwner ? 'Sahip yetkisi kaldirilamaz' : isYetkili ? 'Yetkiyi kaldir' : 'Yetki ver'}
                  >
                    {isYetkili ? 'Kaldir' : 'Ekle'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border-subtle flex justify-between items-center">
          <p className="text-xs text-muted">
            {data ? `${data.yetkili_sirketler.length} / ${data.tum_sirketler.length} sirket yetkili` : ''}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border-default text-primary hover:bg-surface-overlay transition"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
