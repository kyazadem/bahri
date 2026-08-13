import { Link } from 'react-router-dom'
import { signInWithGoogle, signInWithApple } from '@/lib/supabase'
import { Chrome, Apple, ArrowLeft, Utensils } from 'lucide-react'

export function DinerLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link to="/"
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Menu
        </Link>

        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-7 h-7 text-brand-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to save favorites and view order history</p>
        </div>

        <div className="space-y-3">
          <button onClick={() => signInWithGoogle()}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all">
            <Chrome className="w-5 h-5 text-red-500" />
            Continue with Google
          </button>

          <button onClick={() => signInWithApple()}
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 active:scale-[0.98] transition-all">
            <Apple className="w-5 h-5" />
            Continue with Apple
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
