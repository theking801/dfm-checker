import type { DFMProblem } from '../types'
import { SEVERITY_CONFIG, PROBLEM_LABELS } from '../types'
import { useTranslation } from '../contexts/LanguageContext'

interface ReportCardProps {
  problem: DFMProblem
  index: number
}

/**
 * Carte individuelle pour chaque problème détecté.
 * Affiche le type, la sévérité, la description et la suggestion de correction.
 */
export default function ReportCard({ problem, index }: ReportCardProps) {
  const { t } = useTranslation()
  const severityConfig = SEVERITY_CONFIG[problem.severity]
  const problemLabel = PROBLEM_LABELS[problem.type]

  return (
    <div
      className={`
        glass-card p-5 border transition-all duration-300
        hover:border-tech-500/30 hover:shadow-[0_0_20px_rgba(124,58,237,0.08)]
        ${severityConfig.bg}
      `}
      style={{
        animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* En-tête */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{problemLabel.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{problemLabel.title}</h3>
            <span className={`text-xs font-medium ${severityConfig.color}`}>
              {severityConfig.label}
            </span>
          </div>
        </div>
        {problem.details.measured_avg_thickness && (
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('report.measured')}</span>
            <p className="text-sm font-mono text-gray-600">
              {problem.details.measured_avg_thickness} mm
            </p>
          </div>
        )}
        {problem.details.measured_avg_angle && (
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('report.angle')}</span>
            <p className="text-sm font-mono text-gray-600">
              {problem.details.measured_avg_angle}°
            </p>
          </div>
        )}
        {problem.details.worst_section_ratio && (
          <div className="text-right">
            <span className="text-xs text-gray-500 dark:text-gray-400">{t('report.ratio_value')}</span>
            <p className="text-sm font-mono text-gray-600">
              {problem.details.worst_section_ratio}:1
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
        {problem.description}
      </p>

      {/* Suggestion */}
      <div className="bg-tech-500/5 border border-tech-500/10 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-tech-600 text-sm mt-0.5">💡</span>
          <div>
            <span className="text-xs font-medium text-tech-600 uppercase tracking-wider">
              {t('report.suggestion')}
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
              {problem.suggestion}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
