import { useState, useRef, useCallback } from 'react'
import { useTranslation } from '../contexts/LanguageContext'

interface FileUploaderProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

export default function FileUploader({ onFileSelected, disabled = false }: FileUploaderProps) {
  const { t } = useTranslation()
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const validateAndSetFile = useCallback((file: File) => {
    setError(null)
    if (!file.name.toLowerCase().endsWith('.stl')) {
      setError(t('error.stl_only'))
      return
    }
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      setError(t('error.file_too_large'))
      return
    }
    setSelectedFile(file)
    onFileSelected(file)
  }, [onFileSelected, t])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) validateAndSetFile(files[0])
  }, [disabled, validateAndSetFile])

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const files = e.target.files
    if (files && files.length > 0) validateAndSetFile(files[0])
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="w-full">
      <input ref={fileInputRef} type="file" accept=".stl" onChange={handleFileInput} className="hidden" />

      {/* Error message */}
      {error && (
        <div className="mb-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-500 dark:text-red-400 flex items-center gap-2 animate-[fadeInUp_0.3s_ease-out]">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick() }}
        className={`
          relative w-full border-2 border-dashed rounded-2xl p-8 md:p-12
          transition-all duration-300 cursor-pointer
          ${isDragging
            ? 'border-tech-500 bg-tech-500/5 scale-[1.02]'
            : selectedFile
              ? 'border-green-400/50 bg-green-50/80 dark:border-green-500/30 dark:bg-green-500/5'
              : 'border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-100/50 dark:hover:bg-gray-900/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          {/* Icône */}
          <div className={`
            w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
            ${isDragging
              ? 'bg-tech-500/10 scale-110'
              : selectedFile
                ? 'bg-green-100'
                : 'bg-gray-100 dark:bg-gray-800/50'
            }
          `}>
            {selectedFile ? (
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
          </div>

          {/* Texte */}
          {selectedFile ? (
            <div>
              <p className="text-green-700 font-medium text-lg">{selectedFile.name}</p>
              <p className="text-gray-500 text-sm mt-1">{formatFileSize(selectedFile.size)}</p>
              <p className="text-gray-400 text-xs mt-2">{t('upload.change')}</p>
            </div>
          ) : (
            <div>
              <p className="text-gray-700 dark:text-gray-200 font-medium text-lg">
                {isDragging ? t('upload.drop') : t('upload.drop')}
              </p>
              <p className="text-gray-500 text-sm mt-1">{t('upload.click')}</p>
              <p className="text-gray-400 text-xs mt-3">
                {t('upload.hint')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
