import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

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
    <div className="min-h-screen flex items-center justify-center bg-surface-base px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface-raised border border-border-default rounded-2xl shadow-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-primary">Declaro</h1>
            <p className="text-sm text-muted">Hesabınıza giriş yapın</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
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
                className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
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
                className="w-full bg-surface-overlay border border-border-default focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-3.5 py-2.5 text-primary text-sm outline-none transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition-colors"
            >
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="text-accent hover:text-accent-hover font-medium transition-colors">
              Kayıt olun
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
