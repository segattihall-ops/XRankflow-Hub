'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setEmail(localStorage.getItem('saved_email') || '')
    setRememberMe(localStorage.getItem('remember_me') === 'true')
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        if (rememberMe) {
          localStorage.setItem('saved_email', email)
          localStorage.setItem('remember_me', 'true')
        } else {
          localStorage.removeItem('saved_email')
          localStorage.removeItem('remember_me')
        }
        await new Promise(resolve => setTimeout(resolve, 500))
        router.refresh()
        router.push('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
              XR
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            XRANKFLOW Hub
          </h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Command Center para a holding. Entre com suas credenciais.
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@xrankflow.com"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-2 focus:ring-blue-600"
              />
              <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-700">
                Lembrar-se de mim
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-2 rounded-lg transition-all"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Help Text */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Use suas credenciais do Supabase para acessar o Command Center
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-8">
          XRankFlow Media Group LLC © 2026
        </p>
      </div>
    </div>
  )
}
