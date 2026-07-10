/**
 * LandingPage — Page d'accueil DFM Checker
 * Mode clair/sombre + FR/EN + React Bits animations
 */

import { useRef } from 'react'
import NavbarBubble from './NavbarBubble'
import CursorGlow from './CursorGlow'
import Aurora from './Aurora'
import ScrollStack, { ScrollStackItem } from './ScrollStack'
import Footer from './Footer'
import FadeContent from './FadeContent'
import SplitText from './SplitText'
import ShinyText from './ShinyText'
import GradientText from './GradientText'
import GlareHover from './GlareHover'
import StarBorder from './StarBorder'
import SpotlightCard from './SpotlightCard'
import FeedbackButton from './FeedbackButton'
import ClickSpark from './ClickSpark'
import { useTranslation } from '../contexts/LanguageContext'
import { useTheme } from '../contexts/ThemeContext'

interface LandingPageProps {
  onStart: () => void
}

function VisualizerMockup() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const purpleColor = '#7c3aed'
  const lightPurple = '#a78bfa'

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/40 backdrop-blur-sm shadow-xl shadow-gray-200/50 dark:shadow-gray-950/50">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/60">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">Checker 3D — Analyse STL</span>
        </div>
      </div>

      <div className="p-4 flex gap-3 h-[calc(100%-44px)]">
        <div className="flex-1 rounded-xl bg-gradient-to-br from-gray-50 dark:from-gray-800/40 to-white dark:to-gray-900/40 border border-gray-100 dark:border-gray-800/30 flex items-center justify-center relative overflow-hidden">
          <div className="relative w-28 h-36">
            <svg viewBox="0 0 100 140" className="w-full h-full opacity-30" fill="none">
              <polygon points="50,5 90,35 90,75 50,105 10,75 10,35" stroke={purpleColor} strokeWidth="1.5"
                className="animate-pulse" style={{ animationDuration: '3s' }} />
              <polygon points="50,15 80,38 80,68 50,90 20,68 20,38" stroke={lightPurple} strokeWidth="1" opacity={0.6} />
              <polygon points="50,5 50,105 10,75 10,35" stroke={purpleColor} strokeWidth="1" strokeDasharray="4 2" opacity={0.5} />
              <polygon points="50,5 50,105 90,75 90,35" stroke={purpleColor} strokeWidth="1" strokeDasharray="4 2" opacity={0.5} />
              <polygon points="30,55 50,70 70,55 50,40" stroke="#ef4444" strokeWidth="2" fill="#ef4444" fillOpacity={0.12}
                className="animate-pulse" style={{ animationDuration: '2s' }} />
              <polygon points="25,30 35,25 35,50 25,55" stroke="#f97316" strokeWidth="2" fill="#f97316" fillOpacity={0.12}
                className="animate-pulse" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
            </svg>
          </div>
          <div className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(124, 58, 237, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(124, 58, 237, 0.4) 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }} />
        </div>

        <div className="w-28 flex flex-col gap-2">
          <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800/30 border border-gray-100 dark:border-gray-800/30 p-2 space-y-1.5">
            <div className="h-1.5 w-full rounded-full bg-tech-500/30 animate-pulse" />
            <div className="h-1.5 w-3/4 rounded-full bg-orange-300/40" />
            <div className="h-1.5 w-1/2 rounded-full bg-red-300/40" />
            <div className="h-1.5 w-2/3 rounded-full bg-gray-200 dark:bg-gray-700/30" />
            <div className="h-1.5 w-4/5 rounded-full bg-gray-200 dark:bg-gray-700/30" />
          </div>
          <div className="h-8 rounded-lg bg-tech-500/10 border border-tech-500/20 flex items-center justify-center">
            <span className="text-[9px] font-medium text-tech-700 dark:text-tech-300">Rapport</span>
          </div>
        </div>
      </div>

      <div className="absolute -top-20 -right-20 w-40 h-40 bg-tech-500/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
    </div>
  )
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const heroRef = useRef<HTMLDivElement>(null)

  const handleNavClick = (href: string) => {
    if (href === '#start') {
      onStart()
      return
    }
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const STACK_ITEMS = [
    { titleKey: 'features.import', descKey: 'features.import.desc' },
    { titleKey: 'features.walls', descKey: 'features.walls.desc' },
    { titleKey: 'features.overhangs', descKey: 'features.overhangs.desc' },
    { titleKey: 'features.ratio', descKey: 'features.ratio.desc' },
    { titleKey: 'features.sharp_corner', descKey: 'features.sharp_corner.desc', isNew: true },
    { titleKey: 'features.viewer', descKey: 'features.viewer.desc' },
    { titleKey: 'features.report', descKey: 'features.report.desc' },
  ]

  const isDark = theme === 'dark'
  const auroraColors = isDark
    ? ["#4c1d95", "#7c3aed", "#1a1a2e"]
    : ["#c4b5fd", "#ddd6fe", "#f5f3ff"]

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950">
      {/* Cursor glow léger — remplace l'ancien SplashCursor WebGL */}
      <CursorGlow />
      <NavbarBubble onStart={onStart} onNavClick={handleNavClick} />

      <section id="hero" ref={heroRef}
        className="relative min-h-screen flex items-center px-4 sm:px-6 lg:px-8 pt-20 pb-20 overflow-hidden"
      >
        <div className="absolute inset-0 z-0">
          <Aurora colorStops={auroraColors} amplitude={isDark ? 0.6 : 0.3} blend={0.25} speed={0.6} />
        </div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-r from-white/95 via-white/80 to-white/95 dark:from-gray-950/90 dark:via-gray-950/60 dark:to-gray-950/90" />

          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="space-y-8 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-tech-500/10 border border-tech-500/20"
                  style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-tech-600 dark:bg-tech-400 animate-pulse" />
                  <span className="text-xs font-medium text-tech-700 dark:text-tech-300 tracking-wide">{t('hero.badge')}</span>
                </div>

                <div style={{ animation: 'fadeInUp 0.6s ease-out 0.4s both' }}>
                  <SplitText text={t('hero.title')} tag="h1"
                    className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-tech-900 dark:text-white leading-[1.1]"
                    splitType="words, chars" from={{ opacity: 0, y: 60, rotateX: -20 }}
                    to={{ opacity: 1, y: 0, rotateX: 0 }} delay={30} duration={1.0} threshold={0.5} rootMargin="0px" />
                </div>

                <div className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 leading-relaxed"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.6s both' }}>
                  <ShinyText text={t('hero.subtitle')} speed={4} shineColor="#a78bfa" color={isDark ? '#9ca3af' : '#6b7280'}
                    spread={150} yoyo={true} className="text-lg" />
                </div>

                <p className="text-gray-500 dark:text-gray-400 leading-relaxed"
                  style={{ animation: 'fadeInUp 0.6s ease-out 0.8s both' }}>
                  {t('hero.desc')}
                </p>

                <div className="flex items-center gap-6 pt-2"
                  style={{ animation: 'fadeInUp 0.6s ease-out 1.0s both' }}>
                  <StarBorder color="#7c3aed" speed="4s" thickness={2}>
                    <button onClick={onStart}
                      className="group relative inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-tech-600 to-purple-500 text-white font-semibold text-base rounded-xl shadow-xl shadow-tech-600/20 hover:shadow-tech-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300">
                      <span>{t('hero.cta')}</span>
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </StarBorder>

                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                    <div className="flex -space-x-2">
                      {['🎨', '⚙️', '🔧', '📐'].map((icon, i) => (
                        <div key={i}
                          className="w-7 h-7 rounded-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none flex items-center justify-center text-[10px]">
                          {icon}
                        </div>
                      ))}
                    </div>
                    <span className="text-gray-400 dark:text-gray-500">{t('hero.free')}</span>
                  </div>
                </div>
              </div>

              <div className="w-full" style={{ animation: 'fadeInUp 0.8s ease-out 0.5s both' }}>
                <GlareHover
                  width="100%"
                  height="auto"
                  background="transparent"
                  borderRadius="16px"
                  borderColor="transparent"
                  glareColor="#7c3aed"
                  glareOpacity={0.12}
                  glareAngle={-45}
                  glareSize={300}
                  transitionDuration={800}
                >
                  <VisualizerMockup />
                </GlareHover>
              </div>
            </div>
          </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-[10px] text-gray-400 dark:text-gray-600 tracking-widest uppercase">{t('hero.scroll')}</span>
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      <section id="features" className="relative bg-white dark:bg-gray-950 py-20">
        <FadeContent threshold={0.2} duration={800}>
          <div className="max-w-4xl mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-tech-900 dark:text-white mb-3">{t('features.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{t('features.subtitle')}</p>
          </div>
        </FadeContent>

        <div className="max-w-4xl mx-auto px-4">
          <ScrollStack>
            {STACK_ITEMS.map((item: { titleKey: string; descKey: string; isNew?: boolean }, i) => (
              <ScrollStackItem key={i}>
                <div className="h-full w-full p-10 md:p-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex flex-col justify-center shadow-lg shadow-gray-200/50 dark:shadow-gray-950/30 relative overflow-hidden">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-[11px] font-semibold text-tech-600 dark:text-tech-400 tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-tech-500/20 to-transparent" />
                  </div>
                  <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-2xl md:text-3xl font-bold text-tech-900 dark:text-white">{t(item.titleKey)}</h3>
                    {item.isNew && (
                      <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider
                                     bg-gradient-to-r from-green-500 to-emerald-500 text-white
                                     rounded-full shadow-sm shadow-green-500/30 animate-pulse-slow">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">{t(item.descKey)}</p>
                </div>
              </ScrollStackItem>
            ))}
          </ScrollStack>
        </div>
      </section>

      {/* How It Works — section visuelle différenciée des Features */}
      <section id="how-it-works" className="relative py-20 bg-gray-50/50 dark:bg-gray-900/30 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${isDark ? '#a78bfa' : '#7c3aed'} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />

        <FadeContent threshold={0.2} duration={800}>
          <div className="max-w-4xl mx-auto px-4 text-center mb-16 relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-tech-900 dark:text-white mb-3">
              <GradientText colors={['#7c3aed', '#a78bfa', '#c4b5fd', '#a78bfa', '#7c3aed']} animationSpeed={6}>
                {t('how.title')}
              </GradientText>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">{t('how.subtitle')}</p>
          </div>
        </FadeContent>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: '📤', title: 'how.step1.title', desc: 'how.step1.desc', color: 'from-tech-500 to-purple-500' },
              { icon: '🎯', title: 'how.step2.title', desc: 'how.step2.desc', color: 'from-purple-500 to-pink-500' },
              { icon: '📊', title: 'how.step3.title', desc: 'how.step3.desc', color: 'from-pink-500 to-rose-500' },
            ].map((step, i) => (
              <div key={i}
                className="group relative"
                style={{ animation: `fadeInUp 0.6s ease-out ${i * 0.2}s both` }}
              >
                {/* Connector line */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-16 left-[60%] w-[80%] h-px bg-gradient-to-r from-tech-300/40 to-transparent" />
                )}

                <SpotlightCard spotlightColor={isDark ? 'rgba(124,58,237,0.15)' : 'rgba(124,58,237,0.08)'}>
                  <div className="relative">
                    {/* Step number */}
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl shadow-lg mb-5 transition-transform duration-300 group-hover:scale-110`}>
                      {step.icon}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t(step.title)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(step.desc)}</p>
                  </div>
                </SpotlightCard>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12 relative z-10"
          style={{ animation: 'fadeInUp 0.6s ease-out 0.9s both' }}>
          <StarBorder color="#7c3aed" speed="4s" thickness={2}>
            <button onClick={onStart}
              className="group relative px-8 py-3 bg-gradient-to-r from-tech-600 to-purple-500 hover:from-tech-500 hover:to-purple-400 text-white font-medium rounded-xl transition-all duration-200 shadow-lg shadow-tech-600/20 hover:shadow-tech-500/30 hover:scale-[1.02] active:scale-[0.98]">
              {t('features.cta')}
            </button>
          </StarBorder>
        </div>
      </section>

      <Footer />

      {/* Feedback Button flottant */}
      <FeedbackButton />
    </div>
  )
}
