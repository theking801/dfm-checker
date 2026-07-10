/**
 * FeedbackButton — Bouton flottant de feedback avec modal
 *
 * Affiche un bouton flottant en bas à droite.
 * Au clic, ouvre une modal avec un formulaire simple.
 * Les retours sont envoyés par mailto (pas de backend nécessaire).
 */

import { useState, useCallback, useEffect } from 'react'
import { useTranslation } from '../contexts/LanguageContext'
import { submitFeedback } from '../services/api'

export default function FeedbackButton() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Fermer avec Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setError('')
    try {
      await submitFeedback(message.trim(), email.trim())
      setSent(true)
      setTimeout(() => {
        setIsOpen(false)
        setSent(false)
        setMessage('')
        setEmail('')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }, [message, email])

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 px-4 py-3 
                   bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 
                   rounded-full shadow-lg shadow-gray-200/50 dark:shadow-gray-950/50 
                   hover:shadow-tech-500/20 hover:border-tech-500/30 
                   transition-all duration-300 hover:scale-105 active:scale-95"
        aria-label={t('feedback.button')}
        title={t('feedback.title')}
      >
        <span className="text-lg">💬</span>
        <span className="hidden sm:inline text-sm font-medium text-gray-600 dark:text-gray-300">
          {t('feedback.button')}
        </span>
        {/* Petit point vert pour attirer l'attention */}
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      </button>
    )
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl 
                     border border-gray-200 dark:border-gray-800 p-6 pointer-events-auto
                     animate-[fadeInUp_0.3s_ease-out]"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('feedback.title')}
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center
                         text-gray-400 hover:text-gray-600 dark:hover:text-gray-200
                         hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {sent ? (
            <div className="text-center py-8 space-y-3">
              <div className="text-4xl">✅</div>
              <p className="text-green-600 dark:text-green-400 font-medium">
                {t('feedback.thanks')}
              </p>
              <p className="text-sm text-gray-500">
                {t('feedback.thanks_desc')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('feedback.message_label')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('feedback.message_placeholder')}
                  rows={4}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 
                             dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100
                             placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-500/30 
                             focus:border-tech-500 transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  {t('feedback.email_label')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('feedback.email_placeholder')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 
                             dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100
                             placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-tech-500/30 
                             focus:border-tech-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!message.trim()}
                className="w-full py-3 bg-gradient-to-r from-tech-600 to-purple-500 
                           hover:from-tech-500 hover:to-purple-400 disabled:from-gray-300 disabled:to-gray-300
                           text-white font-medium rounded-xl transition-all duration-200
                           shadow-lg shadow-tech-600/20 hover:shadow-tech-500/30
                           disabled:shadow-none disabled:cursor-not-allowed"
              >
                {t('feedback.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
