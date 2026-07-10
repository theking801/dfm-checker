/**
 * App.tsx — Point d'entrée principal DFM Checker
 */

import { useState, useCallback, useEffect } from 'react'
import SplashCursor from './components/SplashCursor'
import LandingPage from './components/LandingPage'
import ClickSpark from './components/ClickSpark'
import AnalysisScreen from './components/AnalysisScreen'
import AdminPage from './components/AdminPage'
import AdminLogin from './components/AdminLogin'
import { ThemeProvider } from './contexts/ThemeContext'
import { LanguageProvider } from './contexts/LanguageContext'

function AppContent() {
  const [screen, setScreen] = useState<'landing' | 'analysis' | 'admin'>('landing')
  const [showLogin, setShowLogin] = useState(false)
  const [fadeOut, setFadeOut] = useState(false)

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
      <SplashCursor DYE_RESOLUTION={480} SPLAT_FORCE={3000} CURL={1.5} DENSITY_DISSIPATION={5} />
      <div className="relative">
        {fadeOut && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 animate-[fadeIn_0.4s_ease-out]" />
        )}
        <div className="transition-opacity duration-400" style={{ opacity: fadeOut ? 0 : 1 }}>
          {screen === 'landing' && <LandingPage onStart={handleStart} />}
          {screen === 'analysis' && <AnalysisScreen onBack={handleBack} />}
          {screen === 'admin' && <AdminPage onBack={handleBack} />}
        </div>

        {/* Login modal — overlay au-dessus de tout */}
        {showLogin && <AdminLogin onSuccess={handleLoginSuccess} onCancel={handleLoginCancel} />}
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
