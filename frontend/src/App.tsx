/**
 * App.tsx — Point d'entrée principal DFM Checker
 */

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import LandingPage from './components/LandingPage'
import ClickSpark from './components/ClickSpark'
import AdminLogin from './components/AdminLogin'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { logActivity } from './services/api'
import { supabase } from './lib/supabase'

// Lazy load — ces composants ne sont pas nécessaires au premier chargement
const AnalysisScreen = lazy(() => import('./components/AnalysisScreen'))
const AdminPage = lazy(() => import('./components/AdminPage'))

function AppContent() {
  const [screen, setScreen] = useState<'landing' | 'analysis' | 'admin'>('landing')
  const [showLogin, setShowLogin] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  // ── Auto-login: just check session exists, don't redirect ──
  useEffect(() => {
    if (!supabase) { setCheckingAuth(false); return }
    supabase.auth.getSession()
      .catch(() => {})
      .finally(() => setCheckingAuth(false))
  }, [])

  // ── Activity tracking: log page views ──
  useEffect(() => {
    logActivity({ event_type: 'page_view', page: screen })
    // Track session on first load
    if (screen !== 'admin') {
      import('./services/api').then(({ trackSessionEvent }) => trackSessionEvent({}))
    }
  }, [screen])

  // ── Activity tracking: catch global errors ──
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      logActivity({
        event_type: 'error',
        page: screen,
        message: event.message || 'Unknown error',
        details: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : '',
      })
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      logActivity({
        event_type: 'error',
        page: screen,
        message: String(event.reason || 'Unhandled promise rejection'),
      })
    }
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [screen])

  // Keyboard shortcut: Ctrl+Shift+A → login modal → admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault()
        if (screen === 'admin') {
          setFadeOut(true)
          setTimeout(() => { setScreen('landing'); setFadeOut(false) }, 400)
        } else {
          setShowLogin(true)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [screen])

  const handleLoginSuccess = useCallback(() => {
    setShowLogin(false)
    setFadeOut(true)
    setTimeout(() => { setScreen('admin'); setFadeOut(false) }, 400)
  }, [])

  const handleLoginCancel = useCallback(() => {
    setShowLogin(false)
  }, [])

  const handleStart = useCallback(() => {
    setFadeOut(true)
    setTimeout(() => { setScreen('analysis'); setFadeOut(false) }, 400)
  }, [])

  const handleBack = useCallback(() => {
    setFadeOut(true)
    setTimeout(() => { setScreen('landing'); setFadeOut(false) }, 400)
  }, [])

  return (
    <ClickSpark sparkColor="#7c3aed" sparkCount={12} sparkRadius={25} sparkSize={8}>
      <div className="relative">
        {checkingAuth ? (
          <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-tech-300/50 border-t-tech-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {fadeOut && (
              <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 animate-[fadeIn_0.4s_ease-out]" />
            )}
            <div className="transition-opacity duration-400" style={{ opacity: fadeOut ? 0 : 1 }}>
              {screen === 'landing' && <LandingPage onStart={handleStart} />}
              {screen === 'analysis' && (
                <Suspense fallback={
                  <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-tech-300/50 border-t-tech-600 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Chargement…</span>
                    </div>
                  </div>
                }>
                  <AnalysisScreen onBack={handleBack} />
                </Suspense>
              )}
              {screen === 'admin' && (
                <Suspense fallback={
                  <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-tech-300/50 border-t-tech-600 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Chargement…</span>
                    </div>
                  </div>
                }>
                  <AdminPage onBack={handleBack} />
                </Suspense>
              )}
            </div>

            {/* Login modal — overlay au-dessus de tout */}
            {showLogin && <AdminLogin onSuccess={handleLoginSuccess} onCancel={handleLoginCancel} />}
          </>
        )}
      </div>
    </ClickSpark>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  )
}
