/**
 * AdminLogin — Modal de connexion pour le panel admin
 *
 * Ctrl+Shift+A → affiche ce modal → identifiants valides → admin
 * Authentification via Supabase Auth (production) ou fallback local (développement).
 */

import { useState, useEffect, useRef } from 'react'
import { signInAdmin } from '../services/api'

// Credentials de fallback pour le développement local (quand Supabase n'est pas configuré)
const ADMIN_EMAIL = 'admin@checker3d.com'
const ADMIN_PASSWORD = 'dfmchecker2024'

interface AdminLoginProps {
  onSuccess: () => void
  onCancel: () => void
}

export default function AdminLogin({ onSuccess, onCancel }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const emailRef = useRef<HTMLInputElement>(null)

  // @ts-expect-error - import.meta.env est défini par Vite
  const supabaseConfigured = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)

  // Focus automatique + fermeture Escape
  useEffect(() => {
    emailRef.current?.focus()
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onCancel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs')
      return
    }

    setLoading(true)

    try {
      if (supabaseConfigured) {
        // Production : authentification via Supabase Auth
        const result = await signInAdmin(email.trim(), password)
        if (result.success) {
          onSuccess()
        } else {
          setError(result.error)
          setPassword('')
        }
      } else {
        // Développement local : fallback credentials hardcodés
        if (email.trim() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
          onSuccess()
        } else {
          setError('Identifiants incorrects')
          setPassword('')
        }
      }
    } catch {
      setError('Erreur de connexion')
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl
                     border border-gray-200 dark:border-gray-800 p-8 pointer-events-auto
                     animate-[fadeInUp_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-tech-600 to-purple-500
                            flex items-center justify-center shadow-lg shadow-tech-600/30">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-1">
            Accès administrateur
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Identifie-toi pour accéder au panel
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20
                              text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@checker3d.com"
                autoComplete="email"
                spellCheck={false}
                disabled={loading}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200
                           dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100
                           placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-500/30
                           focus:border-tech-500 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-4 py-3 pr-11 bg-gray-50 dark:bg-gray-800/50 border border-gray-200
                             dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100
                             placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-500/30
                             focus:border-tech-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                             hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-3 text-sm font-medium text-gray-600 dark:text-gray-400
                           bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200
                           dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || !email.trim() || !password.trim()}
                className="flex-1 py-3 text-sm font-medium text-white
                           bg-gradient-to-r from-tech-600 to-purple-500
                           hover:from-tech-500 hover:to-purple-400
                           rounded-xl transition-all duration-200
                           shadow-lg shadow-tech-600/20 hover:shadow-tech-500/30
                           active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Connexion...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </button>
            </div>
          </form>

          <p className="text-[10px] text-gray-400 dark:text-gray-600 text-center mt-6">
            {supabaseConfigured ? 'Authentification Supabase' : 'Panel réservé aux administrateurs'}
          </p>
        </div>
      </div>
    </>
  )
}
