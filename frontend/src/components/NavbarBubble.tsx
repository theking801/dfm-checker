/**
 * NavbarBubble — Navbar inspirée d'Odysser
 * Mode clair/sombre + FR/EN + bulle au scroll
 */

import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useTranslation } from '../contexts/LanguageContext'

interface NavbarBubbleProps {
  onStart: () => void
  onNavClick?: (href: string) => void
}

const NAV_ITEMS = [
  { labelKey: 'nav.home', href: '#hero' },
  { labelKey: 'nav.features', href: '#features' },
  { labelKey: 'nav.how', href: '#features' },
]

export default function NavbarBubble({ onStart, onNavClick }: NavbarBubbleProps) {
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const { t, lang, toggleLang } = useTranslation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleClick = (href: string) => {
    if (onNavClick) {
      onNavClick(href)
      return
    }
    if (href === '#hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      const el = document.querySelector(href)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav
      className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        transition-all duration-500 ease-out
        ${scrolled
          ? 'w-[calc(100%-2rem)] max-w-5xl bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800/60 shadow-lg shadow-gray-200/60 dark:shadow-gray-950/50 rounded-2xl'
          : 'w-[calc(100%-2rem)] max-w-6xl bg-transparent rounded-2xl'
        }
      `}
    >
      <div className={`
        flex items-center justify-between
        transition-all duration-500 ease-out
        ${scrolled ? 'px-5 py-3' : 'px-6 py-3 md:px-8 md:py-4'}
      `}>
        {/* Logo */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-tech-600 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-tech-600/20 group-hover:shadow-tech-500/40 transition-shadow">
            DF
          </div>
          <span className={`
            font-bold tracking-tight transition-all duration-300
            ${scrolled ? 'text-tech-900 dark:text-white text-base' : 'text-tech-900 dark:text-white text-lg'}
          `}>
            DFM Checker
          </span>
        </button>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href + item.labelKey}
              onClick={() => handleClick(item.href)}
              className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-tech-700 dark:hover:text-tech-300 transition-all duration-300 relative
                         after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-tech-500
                         after:transition-all after:duration-300 hover:after:w-full"
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {/* Right section: toggles + CTA */}
        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className={`
              font-medium rounded-lg transition-all duration-200 flex items-center justify-center
              ${scrolled
                ? 'text-gray-500 dark:text-gray-400 hover:text-tech-700 dark:hover:text-tech-300 px-2 py-1.5 text-xs border border-gray-200 dark:border-gray-700 hover:border-tech-500/50 dark:hover:border-tech-500/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-tech-700 dark:hover:text-tech-300 px-2 py-1.5 text-xs border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm'
              }
            `}
            title={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
          >
            <span className="font-semibold">{lang === 'fr' ? 'FR' : 'EN'}</span>
          </button>

          {/* Theme toggle with spin animation */}
          <button
            onClick={toggleTheme}
            className={`
              rounded-lg transition-all duration-200 flex items-center justify-center group
              ${scrolled
                ? 'text-gray-500 dark:text-gray-400 hover:text-tech-700 dark:hover:text-tech-300 p-1.5 border border-gray-200 dark:border-gray-700 hover:border-tech-500/50 dark:hover:border-tech-500/50'
                : 'text-gray-500 dark:text-gray-400 hover:text-tech-700 dark:hover:text-tech-300 p-1.5 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm'
              }
            `}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            <span key={theme === 'light' ? 'moon' : 'sun'} className="inline-block theme-toggle-icon">
              {theme === 'light' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </span>
          </button>

          {/* CTA */}
          <button
            onClick={onStart}
            className={`
              font-medium rounded-xl transition-all duration-300
              flex items-center gap-2 group ml-1
              ${scrolled
                ? 'bg-gradient-to-r from-tech-600 to-purple-500 hover:from-tech-500 hover:to-purple-400 text-white px-4 py-2 text-sm shadow-md shadow-tech-600/20'
                : 'bg-tech-600/10 dark:bg-tech-500/10 hover:bg-tech-600/20 dark:hover:bg-tech-500/20 text-tech-700 dark:text-tech-300 px-5 py-2.5 text-sm backdrop-blur-sm border border-tech-600/20 dark:border-tech-500/20'
              }
            `}
          >
            <span>{t('nav.analyze')}</span>
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
