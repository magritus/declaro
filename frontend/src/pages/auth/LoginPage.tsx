import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import logo from '@/assets/declero_logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, token } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch {
      setError('E-posta veya şifre hatalı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-sky-500/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-surface-raised border border-border-default rounded-2xl shadow-2xl shadow-black/5 dark:shadow-black/30 p-8 space-y-6">
          {/* Logo + header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-accent/8 blur-lg scale-110" />
                <img src={logo} alt="Declaro" className="relative h-20 mx-auto" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-semibold text-primary">Hoş geldiniz</h1>
              <p className="text-sm text-muted mt-0.5">Hesabınıza giriş yapın</p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 rounded-xl px-4 py-3 text-sm">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-xl px-3.5 py-2.5 text-primary text-sm outline-none transition-all placeholder:text-muted/50"
                placeholder="ornek@sirket.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-1.5">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-2 focus:ring-accent/20 rounded-xl px-3.5 py-2.5 text-primary text-sm outline-none transition-all placeholder:text-muted/50"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0 mt-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Giriş yapılıyor…
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-semibold transition-colors">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
