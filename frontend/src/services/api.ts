/**
 * Service API pour communiquer avec le backend DFM Checker
 */

import type { AnalysisResult, Material } from '../types'

// ── Types admin — réexportés ou définis localement
import type { DashboardData, DbError, DbFeedback } from '../lib/supabase'

export type AdminDashboard = DashboardData
export type AdminError = DbError
export type AdminFeedback = DbFeedback
export interface ErrorListResponse { errors: any[]; total: number }
export interface FeedbackListResponse { feedbacks: any[] }

import {
  fetchDashboard as supabaseFetchDashboard,
  fetchErrors as supabaseFetchErrors,
  toggleErrorResolved as supabaseToggleError,
  fetchFeedbacks as supabaseFetchFeedbacks,
  addFeedback as supabaseAddFeedback,
  updateFeedbackStatus as supabaseUpdateFeedback,
  signInAdmin,
} from '../lib/supabase'

/**
 * Récupère l'URL de base de l'API.
 * En développement, utilise le proxy Vite (on envoie vers /api).
 * En production, utilise la variable d'environnement.
 */
function getApiBaseUrl(): string {
  // @ts-expect-error - import.meta.env est défini par Vite
  if (import.meta.env.DEV) {
    return '/api'
  }
  // @ts-expect-error - import.meta.env est défini par Vite
  return (import.meta.env.VITE_API_URL || 'http://localhost:8000')
}

/**
 * Vérifie la connexion avec le backend.
 * Utilisé par le composant pour afficher l'indicateur de statut.
 *
 * @returns true si le backend est joignable, false sinon
 */
export async function checkBackendHealth(): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`${baseUrl}/health`, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    return response.ok
  } catch {
    return false
  }
}

/**
 * Récupère la liste des matériaux supportés depuis le backend.
 */
export async function fetchMaterials() {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/materials`)
  if (!response.ok) {
    throw new Error('Impossible de récupérer les matériaux')
  }
  return response.json()
}

/**
 * Upload un fichier STL et lance l'analyse de fabricabilité.
 *
 * @param file - Le fichier STL à analyser
 * @param material - Le matériau sélectionné
 * @param onProgress - Callback de progression (0-100)
 * @returns Le résultat de l'analyse
 */
export async function analyzeStl(
  file: File,
  material: Material,
  onProgress?: (progress: number) => void
): Promise<AnalysisResult> {
  const baseUrl = getApiBaseUrl()
  const formData = new FormData()

  formData.append('file', file)
  formData.append('material', material)

  onProgress?.(10)

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120_000) // 2 min timeout

  try {
    const response = await fetch(`${baseUrl}/analyze`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    onProgress?.(50)

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      throw new Error(
        errorData?.detail || `Erreur serveur : ${response.status} ${response.statusText}`
      )
    }

    onProgress?.(70)

    const result: AnalysisResult = await response.json()
    onProgress?.(100)

    return result
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        "L'analyse a pris trop de temps. Vérifie que le fichier n'est pas trop complexe."
      )
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(
        'Impossible de contacter le serveur. Vérifie que le backend est bien lancé.'
      )
    }

    throw error
  }
}

// ──────────────────────────────────────────────
// Admin API — utilise Supabase côté client, avec fallback API Python
// ──────────────────────────────────────────────

/** Vérifie si Supabase est configuré */
function hasSupabase(): boolean {
  // @ts-expect-error - import.meta.env est défini par Vite
  return !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY)
}

export async function fetchAdminDashboard(): Promise<any> {
  if (hasSupabase()) {
    return supabaseFetchDashboard()
  }
  // Fallback: appel à l'API Python
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/dashboard`)
  if (!response.ok) throw new Error('Erreur chargement dashboard')
  return response.json()
}

export async function fetchAdminErrors(
  severity?: string,
  resolved?: boolean,
  limit = 100,
  offset = 0
): Promise<any> {
  if (hasSupabase()) {
    return supabaseFetchErrors({ severity, resolved, limit, offset })
  }
  const baseUrl = getApiBaseUrl()
  const params = new URLSearchParams()
  if (severity && severity !== 'all') params.set('severity', severity)
  if (resolved !== undefined) params.set('resolved', String(resolved))
  params.set('limit', String(limit))
  params.set('offset', String(offset))

  const response = await fetch(`${baseUrl}/admin/errors?${params}`)
  if (!response.ok) throw new Error('Erreur chargement erreurs')
  return response.json()
}

export async function toggleErrorResolved(errorId: number): Promise<void> {
  if (hasSupabase()) {
    return supabaseToggleError(errorId)
  }
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/errors/${errorId}`, { method: 'PATCH' })
  if (!response.ok) throw new Error('Erreur mise à jour')
}

export async function fetchAdminFeedbacks(): Promise<any> {
  if (hasSupabase()) {
    return supabaseFetchFeedbacks()
  }
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/feedbacks`)
  if (!response.ok) throw new Error('Erreur chargement feedbacks')
  return response.json()
}

export async function submitFeedback(message: string, email: string = ''): Promise<void> {
  if (hasSupabase()) {
    return supabaseAddFeedback(message, email)
  }
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/feedbacks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, email }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.detail || 'Erreur envoi feedback')
  }
}

export async function updateFeedbackStatus(feedbackId: number, status: string): Promise<void> {
  if (hasSupabase()) {
    return supabaseUpdateFeedback(feedbackId, status)
  }
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/feedbacks/${feedbackId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Erreur mise à jour feedback')
}

export { signInAdmin } from '../lib/supabase'
