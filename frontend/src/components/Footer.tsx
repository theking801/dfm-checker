/**
 * Footer — Pied de page professionnel et propre
 */

import { useTranslation } from '../contexts/LanguageContext'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="relative border-t border-gray-200 dark:border-gray-800/50 bg-white dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-tech-600 to-purple-500 flex items-center justify-center text-white shadow-sm">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-bold text-sm text-gray-800 dark:text-white">Checker 3D</span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed max-w-xs">
              {t('footer.text')}
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Navigation
            </h4>
            <ul className="space-y-2">
              <li><a href="#hero" className="text-xs text-gray-400 dark:text-gray-500 hover:text-tech-600 dark:hover:text-tech-400 transition-colors">{t('nav.home')}</a></li>
              <li><a href="#features" className="text-xs text-gray-400 dark:text-gray-500 hover:text-tech-600 dark:hover:text-tech-400 transition-colors">{t('nav.features')}</a></li>
            </ul>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('report.material')}
            </h4>
            <ul className="space-y-2">
              <li className="text-xs text-gray-400 dark:text-gray-500">PLA — {t('material.thickness')} 0.8 mm</li>
              <li className="text-xs text-gray-400 dark:text-gray-500">ABS — {t('material.thickness')} 1.0 mm</li>
              <li className="text-xs text-gray-400 dark:text-gray-500">PETG — {t('material.thickness')} 1.0 mm</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-gray-400 dark:text-gray-600">
            &copy; {new Date().getFullYear()} Checker 3D
          </p>
          <p className="text-[11px] text-gray-300 dark:text-gray-600">
            {t('footer.text')}
          </p>
        </div>
      </div>
    </footer>
  )
}
