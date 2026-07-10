import { useRef } from 'react'
import type { AnalysisResult } from '../types'
import { SEVERITY_CONFIG, PROBLEM_LABELS } from '../types'
import ReportCard from './ReportCard'
import { useTranslation } from '../contexts/LanguageContext'
import { exportToPdf } from '../utils/pdfExport'

interface ReportPanelProps {
  result: AnalysisResult
}

/**
 * Panneau d'affichage du rapport d'analyse complet.
 * Inclut le résumé, la liste des problèmes, et le bouton d'export PDF.
 */
export default function ReportPanel({ result }: ReportPanelProps) {
  const { t } = useTranslation()
  const reportRef = useRef<HTMLDivElement>(null)
  const { problems, summary, stats, material } = result

  const handleExportPdf = async () => {
    if (reportRef.current) {
      try {
        await exportToPdf(reportRef.current, `dfm-report-${material}`)
      } catch (error) {
        console.error('Erreur PDF:', error)
        alert("Impossible de générer le PDF. Vérifie la console pour plus de détails.")
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Contenu du rapport */}
      <div ref={reportRef} className="space-y-6" style={{ backgroundColor: '#f8f9fa', padding: '1px' }}>
        {/* En-tête du rapport */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-tech-900 dark:text-white">{t('report.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('report.material')} : <span className="text-tech-600 font-medium">{material}</span>
              </p>
            </div>
            <div className={`
              text-right px-4 py-2 rounded-xl
              ${summary.total_problems === 0
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-amber-500/10 border border-amber-500/30'
              }
            `}>
              <p className="text-2xl font-bold font-mono">
                {summary.total_problems}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{summary.total_problems} {t('report.problems')}</p>
            </div>
          </div>

          {/* Barre de sévérité */}
          <div className="flex gap-3">
            {(['high', 'medium', 'low'] as const).map((sev) => {
              const count = summary[`${sev}_severity` as keyof typeof summary] as number
              if (count === 0) return null
              const config = SEVERITY_CONFIG[sev]
              return (
                <div key={sev} className="flex items-center gap-2 text-sm">
                  <span className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                  <span className="text-gray-500 dark:text-gray-400">
                    {count} {config.label.toLowerCase()}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="glass-card p-3">
            <p className="text-xs text-gray-500">Faces</p>
            <p className="text-lg font-mono font-semibold text-gray-800 dark:text-gray-200">
              {stats.num_faces.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-gray-500">Sommets</p>
            <p className="text-lg font-mono font-semibold text-gray-800 dark:text-gray-200">
              {stats.num_vertices.toLocaleString()}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-gray-500">Volume</p>
            <p className="text-lg font-mono font-semibold text-gray-800 dark:text-gray-200">
              {stats.volume_mm3 ? `${(stats.volume_mm3 / 1000).toFixed(1)} cm³` : 'N/A'}
            </p>
          </div>
          <div className="glass-card p-3">
            <p className="text-xs text-gray-500">Watertight</p>
            <p className="text-lg font-mono font-semibold text-gray-800 dark:text-gray-200">
              {stats.is_watertight ? '✅ Oui' : '⚠️ Non'}
            </p>
          </div>
        </div>

        {/* Liste des problèmes */}
        {problems.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1">
              {t('report.problems_list')}
            </h3>
            {problems.map((problem, index) => (
              <ReportCard key={`${problem.type}-${index}`} problem={problem} index={index} />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-12 text-center">
            <div className="text-4xl mb-4">✅</div>              <h3 className="text-xl font-semibold text-green-600 mb-2">
              {t('report.no_issues')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t('report.no_issues.desc')} {material}.
            </p>
          </div>
        )}
      </div>

      {/* Boutons d'action */}
      <div className="flex flex-wrap gap-3 justify-center">
        {problems.length > 0 && (
          <button
            onClick={handleExportPdf}
            className="px-6 py-3 bg-tech-600 hover:bg-tech-700 text-white font-medium rounded-xl
                       transition-all duration-200 flex items-center gap-2 shadow-lg shadow-tech-600/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('report.export')}
          </button>
        )}
      </div>
    </div>
  )
}
