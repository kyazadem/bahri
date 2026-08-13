import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmail, sendMagicLink } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Mail, Lock, ArrowLeft, Loader2, Sparkles } from 'lucide-react'

export function StaffLoginPage() {
  const navigate = useNavigate()
  const { profile, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'magic'>('login')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)

  if (!authLoading && profile?.role && profile.role !== 'diner') {
    navigate('/kitchen', { replace: true })
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error: signInError } = await signInWithEmail(email, password)
    
    if (signInError) {
      setError(signInError.message)
      setIsLoading(false)
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const { error: sendError } = await sendMagicLink(email)
    
    if (sendError) {
      setError(sendError.message)
    } else {
      setMagicSent(true)
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </button>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Staff Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Kitchen & Management Dashboard</p>
        </div>

        {magicSent ? (
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <Mail className="w-10 h-10 text-brand-400 mx-auto mb-3" />
            <h2 className="text-white font-semibold mb-2">Check your email</h2>
            <p className="text-gray-400 text-sm">We sent a magic link to {email}</p>
            <button onClick={() => { setMagicSent(false); setEmail('') }}
              className="mt-4 text-brand-400 text-sm hover:text-brand-300">
              Use different email
            </button>
          </div>
        ) : (
          <form onSubmit={mode === 'login' ? handleLogin : handleMagicLink} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" required value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="staff@restaurant.com"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input type="password" required value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Please wait...
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Send Magic Link'}
            </button>

            <button type="button" onClick={() => setMode(mode === 'login' ? 'magic' : 'login')}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors">
              {mode === 'login' ? 'Use magic link instead' : 'Use password instead'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
      }
