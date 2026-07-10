/**
 * AnalysisScreen — Écran principal d'analyse STL
 */

import { useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react'
import FileUploader from './FileUploader'
import MaterialSelector from './MaterialSelector'
import ReportPanel from './ReportPanel'
import { analyzeStl, checkBackendHealth } from '../services/api'
import { useTranslation } from '../contexts/LanguageContext'
import type { Material, AnalysisResult, AnalysisState } from '../types'

// Lazy load Viewer3D (Three.js est lourd ~500KB)
const Viewer3D = lazy(() => import('./Viewer3D'))

function getProgressMessage(progress: number, t: (key: string) => string): string {
  const PROGRESS_MAP: [number, string][] = [
    [90, t('analysis.progress.final')],
    [70, t('analysis.progress.report')],
    [50, t('analysis.progress.walls')],
    [30, t('analysis.progress.send')],
    [10, t('analysis.progress.prep')],
  ]
  for (const [threshold, msg] of PROGRESS_MAP) {
    if (progress >= threshold) return msg
  }
  return t('analysis.progress.default')
}

function useBackendStatus() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    let mounted = true
    const check = () =>
      checkBackendHealth().then((ok) => {
        if (mounted) setStatus(ok ? 'online' : 'offline')
      })
    check()
    const timer = setInterval(check, 15_000)
    return () => {
      mounted = false
      clearInterval(timer)
    }
  }, [])

  return status
}

export default function AnalysisScreen({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation()
  const [material, setMaterial] = useState<Material>('PLA')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisState>({
    status: 'idle',
    result: null,
    error: null,
    progress: 0,
  })
  const [stlObjectUrl, setStlObjectUrl] = useState<string | null>(null)
  const [animateIn, setAnimateIn] = useState(false)
  const [resultsVisible, setResultsVisible] = useState(false)
  const backendStatus = useBackendStatus()

  // Ref pour empêcher les double-clics sur "Analyser"
  const isAnalyzingRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (analysis.status === 'complete') {
      const t = setTimeout(() => setResultsVisible(true), 100)
      return () => clearTimeout(t)
    } else {
      setResultsVisible(false)
    }
  }, [analysis.status])

  const handleFileSelected = useCallback(
    (file: File) => {
      setSelectedFile(file)
      if (stlObjectUrl) URL.revokeObjectURL(stlObjectUrl)
      setStlObjectUrl(URL.createObjectURL(file))
      setAnalysis({ status: 'idle', result: null, error: null, progress: 0 })
    },
    [stlObjectUrl]
  )

  const handleAnalyze = useCallback(async () => {
    if (!selectedFile || isAnalyzingRef.current) return
    isAnalyzingRef.current = true

    setAnalysis({ status: 'analyzing', result: null, error: null, progress: 0 })
    try {
      const result = await analyzeStl(selectedFile, material, (progress) => {
        setAnalysis((prev) => ({ ...prev, progress }))
      })
      setAnalysis({ status: 'complete', result, error: null, progress: 100 })
    } catch (error) {
      setAnalysis({
        status: 'error',
        result: null,
        error: error instanceof Error ? error.message : t('error.unknown'),
        progress: 0,
      })
    } finally {
      isAnalyzingRef.current = false
    }
  }, [selectedFile, material, t])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    if (stlObjectUrl) {
      URL.revokeObjectURL(stlObjectUrl)
      setStlObjectUrl(null)
    }
    setAnalysis({ status: 'idle', result: null, error: null, progress: 0 })
  }, [stlObjectUrl])

  const BackendDot = () => (
    <div className="flex items-center gap-1.5" title={`Backend ${backendStatus}`}>
      <span
        className={`w-2 h-2 rounded-full transition-all duration-700 ${
          backendStatus === 'online'
            ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]'
            : backendStatus === 'offline'
            ? 'bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]'
            : 'bg-yellow-500 animate-pulse'
        }`}
      />
      <span className="text-[10px] text-gray-400 hidden sm:inline">
        {backendStatus === 'online' ? 'API OK' : backendStatus === 'offline' ? t('backend.offline') : '…'}
      </span>
    </div>
  )

  return (
    <div
      className={`min-h-screen bg-white dark:bg-gray-950 transition-opacity duration-500 ${
        animateIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <header className="border-b border-gray-200/80 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">{t('nav.home')}</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-gradient">DFM Checker</span>
          </div>

          <div className="flex items-center gap-3">
            <BackendDot />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8 transition-all duration-500"
        style={{ transform: animateIn ? 'translateY(0)' : 'translateY(16px)' }}
      >
        {analysis.status !== 'complete' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-8 space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('analysis.title')}</h1>
              <p className="text-gray-500 dark:text-gray-400">{t('analysis.subtitle')}</p>
              {backendStatus === 'offline' && (
                <div className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 dark:text-red-300">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  {t('analysis.backend_offline')}
                </div>
              )}
            </div>

            <div className="transition-all duration-500"
              style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? 'translateY(0)' : 'translateY(12px)' }}
            >
              <FileUploader onFileSelected={handleFileSelected} disabled={analysis.status === 'analyzing'} />
            </div>

            <div className="max-w-xs mx-auto transition-all duration-500 delay-100"
              style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? 'translateY(0)' : 'translateY(12px)' }}
            >
              <MaterialSelector value={material} onChange={setMaterial} disabled={analysis.status === 'analyzing'} />
            </div>

            {selectedFile && analysis.status !== 'analyzing' && (
              <div className="flex justify-center transition-all duration-500 delay-200"
                style={{ opacity: animateIn ? 1 : 0, transform: animateIn ? 'translateY(0)' : 'translateY(12px)' }}
              >
                <button onClick={handleAnalyze} disabled={backendStatus === 'offline'}
                  className="group px-8 py-3 bg-tech-600 hover:bg-tech-700 disabled:bg-gray-300 disabled:text-gray-400 text-white font-medium rounded-xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-tech-600/20 hover:shadow-tech-500/30 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {t('analysis.analyze')}
                </button>
              </div>
            )}

            {analysis.status === 'analyzing' && (
              <div className="text-center space-y-5">
                <div className="flex items-center justify-center gap-3 text-tech-600">
                  <div className="w-5 h-5 border-2 border-tech-300/50 border-t-tech-600 rounded-full animate-spin" />
                  <span className="text-sm font-medium">{getProgressMessage(analysis.progress, t)}</span>
                </div>
                <div className="w-full max-w-xs mx-auto">
                  <div className="relative bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-tech-600 to-purple-500"
                      style={{ width: `${analysis.progress}%` }} />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"
                      style={{ width: `${analysis.progress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 font-mono">{analysis.progress}%</p>
                </div>
              </div>
            )}

            {analysis.status === 'error' && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center animate-[fadeInUp_0.4s_ease-out]">
                <div className="text-3xl mb-3">⚠️</div>
                <p className="text-red-500 dark:text-red-400 font-medium mb-1">{t('analysis.error.title')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md mx-auto">{analysis.error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setAnalysis({ status: 'idle', result: null, error: null, progress: 0 })}
                    className="px-4 py-2 bg-tech-600 hover:bg-tech-700 text-white text-sm font-medium rounded-lg transition-colors">
                    {t('analysis.error.retry')}
                  </button>
                  <button onClick={handleReset}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors border border-gray-300/50 dark:border-gray-600/50">
                    {t('analysis.error.change')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {analysis.status === 'complete' && analysis.result && stlObjectUrl && (
          <div className="animate-[fadeInUp_0.5s_ease-out] space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{t('analysis.results.title')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('analysis.results.desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-[500px] lg:h-[700px] transition-all duration-700 ease-out"
                style={{ opacity: resultsVisible ? 1 : 0, transform: resultsVisible ? 'translateY(0)' : 'translateY(20px)' }}
              >
                <Suspense fallback={
                  <div className="w-full h-full flex items-center justify-center bg-gray-50/80 dark:bg-gray-900/80 rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-2 border-tech-300/50 border-t-tech-600 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{t('viewer.loading')}</span>
                    </div>
                  </div>
                }>
                  <Viewer3D stlUrl={stlObjectUrl} problems={analysis.result.problems} stats={analysis.result.stats} />
                </Suspense>
              </div>
              <div className="max-h-[700px] overflow-y-auto pr-2 transition-all duration-700 ease-out delay-150"
                style={{ opacity: resultsVisible ? 1 : 0, transform: resultsVisible ? 'translateY(0)' : 'translateY(20px)' }}
              >
                <ReportPanel result={analysis.result} />
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-2">
              <button onClick={handleReset}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700 flex items-center gap-2 group"
              >
                <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                {t('analysis.results.again')}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
