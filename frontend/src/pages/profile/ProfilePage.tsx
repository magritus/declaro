import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { userApi } from '@/api/user'
import Spinner from '@/components/ui/Spinner'
import ErrorBox from '@/components/ui/ErrorBox'

export default function ProfilePage() {
  // Profile edit state
  const [editEmail, setEditEmail] = useState('')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Password change state
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwMsg, setPwMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.getProfile,
    staleTime: 60_000,
  })

  // Initialize editEmail when profile loads
  const resolvedEmail = editEmail || profile?.email || ''

  const updateProfileMutation = useMutation({
    mutationFn: (data: { email?: string }) => userApi.updateProfile(data),
    onSuccess: () => {
      setProfileMsg({ type: 'success', text: 'Email güncellendi.' })
      void refetch()
    },
    onError: () => {
      setProfileMsg({ type: 'error', text: 'Güncelleme başarısız.' })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      userApi.changePassword(data),
    onSuccess: () => {
      setPwMsg({ type: 'success', text: 'Şifre başarıyla değiştirildi.' })
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    },
    onError: () => {
      setPwMsg({ type: 'error', text: 'Şifre değiştirme başarısız. Mevcut şifrenizi kontrol edin.' })
    },
  })

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMsg(null)
    updateProfileMutation.mutate({ email: resolvedEmail })
  }

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg(null)
    if (pwForm.new_password.length < 8) {
      setPwMsg({ type: 'error', text: 'Yeni şifre en az 8 karakter olmalıdır.' })
      return
    }
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwMsg({ type: 'error', text: 'Yeni şifreler eşleşmiyor.' })
      return
    }
    changePasswordMutation.mutate({
      current_password: pwForm.current_password,
      new_password: pwForm.new_password,
    })
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen">
      <main className="max-w-2xl mx-auto px-8 py-10 space-y-8">
        <h1 className="text-2xl font-bold text-primary">Profil</h1>

        {error && <ErrorBox message="Profil bilgileri yüklenirken hata oluştu." onRetry={() => void refetch()} />}
        {isLoading && <Spinner />}

        {profile && (
          <>
            {/* Hesap Bilgileri */}
            <div className="bg-surface-raised border border-border-default rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-primary">Hesap Bilgileri</h2>

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted text-xs mb-0.5">Rol</p>
                  {profile.role === 'admin' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Kullanıcı
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Üyelik Tarihi</p>
                  <p className="text-secondary font-medium">{formatDate(profile.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Mükellef Sayısı</p>
                  <p className="text-secondary font-medium">{profile.mukellef_count}</p>
                </div>
                <div>
                  <p className="text-muted text-xs mb-0.5">Hesap Durumu</p>
                  <p className={`font-medium text-sm ${profile.is_active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {profile.is_active ? 'Aktif' : 'Pasif'}
                  </p>
                </div>
              </div>

              <hr className="border-border-subtle" />

              {/* Email edit form */}
              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5" htmlFor="profile-email">
                    Email Adresi
                  </label>
                  <input
                    id="profile-email"
                    type="email"
                    value={editEmail || profile.email}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                    required
                  />
                </div>

                {profileMsg && (
                  <p className={`text-xs font-medium ${profileMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {profileMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition disabled:opacity-60"
                >
                  {updateProfileMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
              </form>
            </div>

            {/* Şifre Değiştirme */}
            <div className="bg-surface-raised border border-border-default rounded-xl p-6 space-y-5">
              <h2 className="text-base font-semibold text-primary">Şifre Değiştir</h2>

              <form onSubmit={handlePasswordSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5" htmlFor="current-password">
                    Mevcut Şifre
                  </label>
                  <input
                    id="current-password"
                    type="password"
                    value={pwForm.current_password}
                    onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))}
                    className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5" htmlFor="new-password">
                    Yeni Şifre <span className="text-muted font-normal">(en az 8 karakter)</span>
                  </label>
                  <input
                    id="new-password"
                    type="password"
                    value={pwForm.new_password}
                    onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                    className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-secondary mb-1.5" htmlFor="confirm-password">
                    Yeni Şifre Tekrar
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    value={pwForm.confirm_password}
                    onChange={e => setPwForm(f => ({ ...f, confirm_password: e.target.value }))}
                    className="w-full rounded-lg border border-border-default bg-surface px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
                    required
                  />
                </div>

                {pwMsg && (
                  <p className={`text-xs font-medium ${pwMsg.type === 'success' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {pwMsg.text}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition disabled:opacity-60"
                >
                  {changePasswordMutation.isPending ? 'Kaydediliyor…' : 'Şifreyi Değiştir'}
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
