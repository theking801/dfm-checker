/**
 * Utilitaire d'export PDF du rapport d'analyse DFM.
 *
 * Utilise html2canvas pour capturer le rapport visuellement,
 * puis jsPDF pour générer le fichier PDF.
 */

import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

/**
 * Exporte un élément HTML en PDF.
 *
 * @param element - L'élément DOM à capturer
 * @param filename - Nom du fichier PDF (sans extension)
 */
export async function exportToPdf(
  element: HTMLElement,
  filename: string = 'dfm-report'
): Promise<void> {
  if (!element) {
    throw new Error("L'élément à exporter n'existe pas")
  }

  try {
    // Capture de l'élément avec html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Haute résolution
      useCORS: true,
      backgroundColor: '#0f172a', // Fond sombre pour correspondre au thème
      logging: false,
      allowTaint: false,
    })

    const imgData = canvas.toDataURL('image/png')
    const imgWidth = 210 // A4 en mm
    const pageHeight = 297 // A4 en mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF('p', 'mm', 'a4')
    let heightLeft = imgHeight
    let position = 0

    // Ajout de l'image sur une ou plusieurs pages si nécessaire
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Sauvegarde
    pdf.save(`${filename}.pdf`)
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    throw new Error('Impossible de générer le PDF. Essaie de réessayer.')
  }
}
