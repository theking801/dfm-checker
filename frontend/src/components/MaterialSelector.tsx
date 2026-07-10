import { Material, MATERIAL_NAMES } from '../types'
import { useTranslation } from '../contexts/LanguageContext'

interface MaterialSelectorProps {
  value: Material
  onChange: (material: Material) => void
  disabled?: boolean
}

const MATERIAL_THICKNESS = {
  PLA: '0.8 mm',
  ABS: '1.0 mm',
  PETG: '1.0 mm',
}

export default function MaterialSelector({
  value,
  onChange,
  disabled = false,
}: MaterialSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {t('material.label')}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as Material)}
          disabled={disabled}
          className="w-full appearance-none bg-white dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700/50 rounded-xl px-4 py-3 
                     text-gray-800 dark:text-gray-100 font-medium cursor-pointer transition-all duration-200
                     hover:border-tech-500/50 focus:outline-none focus:ring-2 focus:ring-tech-500/30 focus:border-tech-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(Object.keys(MATERIAL_NAMES) as Material[]).map((mat) => (
            <option key={mat} value={mat}>
              {MATERIAL_NAMES[mat]}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {t('material.thickness')} : <span className="text-tech-600 font-mono">{MATERIAL_THICKNESS[value]}</span>
      </p>
    </div>
  )
}
