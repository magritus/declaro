import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminApi, type AdminUser } from '@/api/admin'
import Spinner from '@/components/ui/Spinner'
import ErrorBox from '@/components/ui/ErrorBox'
import SirketYetkiModal from '@/components/admin/SirketYetkiModal'

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [activeFilter, setActiveFilter] = useState<string>('')
  const [sirketModalUser, setSirketModalUser] = useState<AdminUser | null>(null)

  const statsQuery = useQuery({
    queryKey: ['admin-stats'],
    queryFn: adminApi.getStats,
    staleTime: 30_000,
  })

  const usersQuery = useQuery({
    queryKey: ['admin-users', page, roleFilter, activeFilter],
    queryFn: () =>
      adminApi.listUsers({
        page,
        page_size: PAGE_SIZE,
        ...(roleFilter ? { role: roleFilter } : {}),
        ...(activeFilter !== '' ? { is_active: activeFilter === 'true' } : {}),
      }),
    staleTime: 15_000,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role?: string; is_active?: boolean } }) =>
      adminApi.updateUser(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
  })

  const handleDelete = (user: AdminUser) => {
    if (window.confirm(`"${user.email}" kullanıcısını silmek istediğinizden emin misiniz?`)) {
      deleteMutation.mutate(user.id)
    }
  }

  const handleToggleActive = (user: AdminUser) => {
    updateMutation.mutate({ id: user.id, data: { is_active: !user.is_active } })
  }

  const handleToggleRole = (user: AdminUser) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    updateMutation.mutate({ id: user.id, data: { role: newRole } })
  }

  const stats = statsQuery.data
  const users = usersQuery.data

  const totalPages = users ? Math.ceil(users.total / PAGE_SIZE) : 1

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div className="min-h-screen">
      <main className="max-w-6xl mx-auto px-8 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-primary">Kullanıcı Yönetimi</h1>

        {/* Stats cards */}
        {statsQuery.error && <ErrorBox message="İstatistikler yüklenirken hata oluştu." />}
        {statsQuery.isLoading && <Spinner size="sm" />}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Toplam Kullanıcı" value={stats.total_users} />
            <StatCard label="Aktif Kullanıcı" value={stats.active_users} />
            <StatCard label="Admin Sayısı" value={stats.admin_count} />
            <StatCard label="Toplam Mükellef" value={stats.total_mukellefler} />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-xs text-muted mr-1.5">Rol:</label>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
              className="text-sm rounded-lg border border-border-default bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Tümü</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted mr-1.5">Durum:</label>
            <select
              value={activeFilter}
              onChange={e => { setActiveFilter(e.target.value); setPage(1) }}
              className="text-sm rounded-lg border border-border-default bg-surface px-2.5 py-1.5 text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {usersQuery.error && <ErrorBox message="Kullanıcılar yüklenirken hata oluştu." />}
        {usersQuery.isLoading && <Spinner />}

        {users && (
          <div className="bg-surface-raised border border-border-default rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default bg-surface-overlay">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Email</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Rol</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Durum</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Mükellef</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Kayıt Tarihi</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {users.items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">
                        Kullanıcı bulunamadı.
                      </td>
                    </tr>
                  )}
                  {users.items.map(user => (
                    <tr key={user.id} className="hover:bg-surface-overlay transition-colors">
                      <td className="px-4 py-3 text-primary font-medium">{user.email}</td>
                      <td className="px-4 py-3">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {user.is_active ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Aktif</span>
                        ) : (
                          <span className="text-xs font-semibold text-red-500 dark:text-red-400">Pasif</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-secondary">{user.mukellef_count}</td>
                      <td className="px-4 py-3 text-secondary">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSirketModalUser(user)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                          >
                            Sirketler
                          </button>
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={updateMutation.isPending}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border border-border-default text-secondary hover:bg-surface-overlay transition disabled:opacity-50"
                            title={user.is_active ? 'Pasif yap' : 'Aktif yap'}
                          >
                            {user.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                          </button>
                          <button
                            onClick={() => handleToggleRole(user)}
                            disabled={updateMutation.isPending}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border border-border-default text-secondary hover:bg-surface-overlay transition disabled:opacity-50"
                            title={user.role === 'admin' ? 'User yap' : 'Admin yap'}
                          >
                            {user.role === 'admin' ? '→ User' : '→ Admin'}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={deleteMutation.isPending}
                            className="px-2.5 py-1 rounded-md text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition disabled:opacity-50"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-border-subtle flex items-center justify-between">
                <p className="text-xs text-muted">
                  Toplam {users.total} kullanıcı — Sayfa {page}/{totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-border-default text-secondary hover:bg-surface-overlay transition disabled:opacity-40"
                  >
                    ← Önceki
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-border-default text-secondary hover:bg-surface-overlay transition disabled:opacity-40"
                  >
                    Sonraki →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {sirketModalUser && (
        <SirketYetkiModal
          userId={sirketModalUser.id}
          userEmail={sirketModalUser.email}
          isOpen={!!sirketModalUser}
          onClose={() => setSirketModalUser(null)}
        />
      )}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="bg-surface-raised border border-border-default rounded-xl px-5 py-4">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-2xl font-bold text-primary">{value.toLocaleString('tr-TR')}</p>
    </div>
  )
}
