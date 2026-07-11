/**
 * Utilitaire d'export PDF du rapport d'analyse DFM.
 *
 * Génère un PDF écrit avec du texte structuré (pas un screenshot).
 */

import jsPDF from 'jspdf'
import type { AnalysisResult } from '../types'
import { SEVERITY_CONFIG, PROBLEM_LABELS } from '../types'

/**
 * Exporte le rapport d'analyse en PDF écrit.
 */
export function exportToPdf(result: AnalysisResult, lang: 'fr' | 'en' = 'fr'): void {
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const t = (key: string): string => {
    const translations: Record<string, Record<string, string>> = {
      fr: {
        title: "Rapport d'analyse DFM",
        material: 'Matériau',
        date: 'Date',
        problems: 'problème(s) détecté(s)',
        no_issues: 'Aucun problème détecté',
        no_issues_desc: 'Votre modèle semble prêt pour l\'impression.',
        stats: 'Statistiques du mesh',
        faces: 'Faces',
        vertices: 'Sommets',
        volume: 'Volume',
        watertight: 'Watertight',
        yes: 'Oui',
        no: 'Non',
        detected_problems: 'Problèmes détectés',
        severity: 'Sévérité',
        description: 'Description',
        suggestion: 'Suggestion',
        details: 'Détails',
        measured: 'Mesuré',
        threshold: 'Seuil',
        angle: 'Angle',
        ratio: 'Ratio',
        critical: 'Critique',
        moderate: 'Modéré',
        low: 'Faible',
        page: 'Page',
        footer: 'DFM Checker — Rapport généré automatiquement',
      },
      en: {
        title: 'DFM Analysis Report',
        material: 'Material',
        date: 'Date',
        problems: 'problem(s) detected',
        no_issues: 'No issues detected',
        no_issues_desc: 'Your model seems ready for printing.',
        stats: 'Mesh Statistics',
        faces: 'Faces',
        vertices: 'Vertices',
        volume: 'Volume',
        watertight: 'Watertight',
        yes: 'Yes',
        no: 'No',
        detected_problems: 'Detected Problems',
        severity: 'Severity',
        description: 'Description',
        suggestion: 'Suggestion',
        details: 'Details',
        measured: 'Measured',
        threshold: 'Threshold',
        angle: 'Angle',
        ratio: 'Ratio',
        critical: 'Critical',
        moderate: 'Moderate',
        low: 'Low',
        page: 'Page',
        footer: 'DFM Checker — Auto-generated report',
      },
    }
    return translations[lang]?.[key] || key
  }

  // ── Helper: ajouter du texte ──
  const addText = (text: string, fontSize: number, isBold = false, color: [number, number, number] = [0, 0, 0]) => {
    pdf.setFontSize(fontSize)
    pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
    pdf.setTextColor(...color)
    const lines = pdf.splitTextToSize(text, contentWidth)
    lines.forEach((line: string) => {
      if (y > 270) {
        pdf.addPage()
        y = margin
      }
      pdf.text(line, margin, y)
      y += fontSize * 0.5
    })
  }

  const addLine = () => {
    y += 2
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.3)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 5
  }

  const addSpacing = (h = 5) => {
    y += h
    if (y > 270) {
      pdf.addPage()
      y = margin
    }
  }

  // ── EN-TÊTE ──
  addText(t('title'), 22, true, [124, 58, 237])
  addSpacing(3)
  addLine()

  // Matériau + Date
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(80, 80, 80)
  pdf.text(`${t('material')}:`, margin, y)
  pdf.setFont('helvetica', 'normal')
  pdf.text(result.material, margin + 35, y)
  y += 6

  const now = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${t('date')}:`, margin, y)
  pdf.setFont('helvetica', 'normal')
  pdf.text(now, margin + 35, y)
  y += 8

  // ── RÉSUMÉ ──
  const { summary, stats } = result
  const totalProblems = summary.total_problems

  if (totalProblems === 0) {
    addSpacing(5)
    addText(`✅ ${t('no_issues')}`, 14, true, [34, 197, 94])
    addText(t('no_issues_desc'), 11, false, [100, 100, 100])
  } else {
    addSpacing(3)
    addText(`${totalProblems} ${t('problems')}`, 14, true, [234, 88, 12])

    // Sévérité
    const sevY = y
    let sevX = margin
    const sevItems = [
      { label: t('critical'), count: summary.high_severity, color: [220, 38, 38] as [number, number, number] },
      { label: t('moderate'), count: summary.medium_severity, color: [249, 115, 22] as [number, number, number] },
      { label: t('low'), count: summary.low_severity, color: [234, 179, 8] as [number, number, number] },
    ].filter(s => s.count > 0)

    sevItems.forEach((sev) => {
      pdf.setFillColor(...sev.color)
      pdf.circle(sevX + 2, sevY - 1.5, 1.5, 'F')
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(80, 80, 80)
      pdf.text(`${sev.count} ${sev.label}`, sevX + 5, sevY)
      sevX += 40
    })
    y += 8
  }

  // ── STATISTIQUES ──
  addLine()
  addText(t('stats'), 13, true, [50, 50, 50])
  addSpacing(3)

  const statItems = [
    { label: t('faces'), value: stats.num_faces.toLocaleString() },
    { label: t('vertices'), value: stats.num_vertices.toLocaleString() },
    { label: t('volume'), value: stats.volume_mm3 ? `${(stats.volume_mm3 / 1000).toFixed(1)} cm³` : 'N/A' },
    { label: t('watertight'), value: stats.is_watertight ? `✅ ${t('yes')}` : `⚠️ ${t('no')}` },
  ]

  statItems.forEach((item) => {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80, 80, 80)
    pdf.text(`${item.label}:`, margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(40, 40, 40)
    pdf.text(item.value, margin + 45, y)
    y += 6
  })

  // ── PROBLÈMES ──
  if (result.problems.length > 0) {
    addSpacing(5)
    addLine()
    addText(t('detected_problems'), 13, true, [50, 50, 50])
    addSpacing(3)

    result.problems.forEach((problem, index) => {
      if (y > 240) {
        pdf.addPage()
        y = margin
      }

      const problemIcon = PROBLEM_LABELS[problem.type].icon
      const problemTitle = t(`problem.${problem.type}`)
      const sevConfig = SEVERITY_CONFIG[problem.severity]

      // Numéro + titre du problème
      addText(`${index + 1}. ${problemIcon} ${problemTitle}`, 12, true, [30, 30, 30])
      addSpacing(2)

      // Sévérité
      const sevLabel = t(`severity.${problem.severity}`)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(120, 120, 120)
      pdf.text(`${t('severity')}: ${sevLabel}`, margin + 5, y)
      y += 5

      // Description
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(80, 80, 80)
      pdf.text(`${t('description')}:`, margin + 5, y)
      y += 5
      addText(problem.description, 10, false, [60, 60, 60])
      addSpacing(2)

      // Détails techniques
      const details: string[] = []
      if (problem.details.measured_avg_thickness) {
        details.push(`${t('measured')}: ${problem.details.measured_avg_thickness} mm`)
      }
      if (problem.details.threshold) {
        details.push(`${t('threshold')}: ${problem.details.threshold} mm`)
      }
      if (problem.details.measured_avg_angle) {
        details.push(`${t('angle')}: ${problem.details.measured_avg_angle}°`)
      }
      if (problem.details.critical_angle) {
        details.push(`${t('threshold')}: ${problem.details.critical_angle}°`)
      }
      if (problem.details.worst_section_ratio) {
        details.push(`${t('ratio')}: ${problem.details.worst_section_ratio}:1`)
      }

      if (details.length > 0) {
        pdf.setFontSize(9)
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(100, 100, 100)
        details.forEach((d) => {
          pdf.text(`  • ${d}`, margin + 5, y)
          y += 4
        })
        addSpacing(2)
      }

      // Suggestion
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(124, 58, 237)
      pdf.text(`💡 ${t('suggestion')}:`, margin + 5, y)
      y += 5
      addText(problem.suggestion, 10, false, [80, 80, 80])

      addSpacing(5)

      // Séparateur
      if (index < result.problems.length - 1) {
        pdf.setDrawColor(220, 220, 220)
        pdf.setLineWidth(0.2)
        pdf.line(margin + 5, y, pageWidth - margin, y)
        y += 5
      }
    })
  }

  // ── FOOTER sur chaque page ──
  const totalPages = pdf.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text(t('footer'), margin, 285)
    pdf.text(`${t('page')} ${i}/${totalPages}`, pageWidth - margin - 20, 285)
  }

  // Sauvegarde
  pdf.save(`dfm-report-${result.material.toLowerCase()}.pdf`)
}
