import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import { Lightbulb } from 'lucide-react'

export default function LoginPage() {
  const signIn = useAuthStore((s) => s.signIn)
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError('Email atau password salah.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
            <Lightbulb size={20} className="text-accent" />
          </div>
          <div>
            <p className="text-[11px] text-muted uppercase tracking-widest font-semibold">PT. Triputra Textile</p>
            <h1 className="text-base font-bold text-white leading-tight">Monitoring History Lampu</h1>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Masuk</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-muted font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
                className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-muted font-semibold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-s2 border border-border rounded-xl px-4 py-3 text-sm text-white placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>
            {error && (
              <p className="text-xs text-bad bg-bad/10 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-2 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-1"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-muted mt-4">
          Hubungi admin untuk mendapatkan akses.
        </p>
      </div>
    </div>
  )
}