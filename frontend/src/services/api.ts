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
  fetchBehavioralStats as supabaseFetchBehavioral,
} from '../lib/supabase'

/**
 * Récupère l'URL de base de l'API.
 */
function getApiBaseUrl(): string {
  // @ts-expect-error - import.meta.env est défini par Vite
  if (import.meta.env.DEV) {
    return 'http://localhost:8000'
  }
  return 'https://dfm-checker.onrender.com'
}

/** Récupère la clé API admin depuis les variables d'environnement */
function getAdminApiKey(): string {
  // @ts-expect-error - import.meta.env est défini par Vite
  return import.meta.env.VITE_ADMIN_API_KEY || ''
}

/** Headers communs pour les appels admin vers le backend Python */
function getAdminHeaders(): HeadersInit {
  const key = getAdminApiKey()
  return key ? { 'X-Admin-Key': key } : {}
}

/**
 * Vérifie la connexion avec le backend.
 */
export async function checkBackendHealth(): Promise<boolean> {
  const baseUrl = getApiBaseUrl()
  try {
    const response = await fetch(`${baseUrl}/health`)
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

  const response = await fetch(`${baseUrl}/analyze`, {
    method: 'POST',
    body: formData,
  })

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
  const response = await fetch(`${baseUrl}/admin/dashboard`, {
    headers: getAdminHeaders(),
  })
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

  const response = await fetch(`${baseUrl}/admin/errors?${params}`, {
    headers: getAdminHeaders(),
  })
  if (!response.ok) throw new Error('Erreur chargement erreurs')
  return response.json()
}

export async function toggleErrorResolved(errorId: number): Promise<void> {
  if (hasSupabase()) {
    return supabaseToggleError(errorId)
  }
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/errors/${errorId}`, { 
    method: 'PATCH',
    headers: getAdminHeaders(),
  })
  if (!response.ok) throw new Error('Erreur mise à jour')
}

export async function fetchAdminFeedbacks(): Promise<any> {
  if (hasSupabase()) {
    return supabaseFetchFeedbacks()
  }
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/feedbacks`, {
    headers: getAdminHeaders(),
  })
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
    headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
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
    headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Erreur mise à jour feedback')
}

export { signInAdmin } from '../lib/supabase'

// ──────────────────────────────────────────────
// Session Tracking
// ──────────────────────────────────────────────

/**
 * Génère un ID de session unique basé sur le timestamp + random.
 */
function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

let _sessionId: string | null = null

export function getSessionId(): string {
  if (!_sessionId) {
    _sessionId = localStorage.getItem('dfm_session_id')
    if (!_sessionId) {
      _sessionId = generateSessionId()
      localStorage.setItem('dfm_session_id', _sessionId)
    }
  }
  return _sessionId
}

export async function trackSessionEvent(event: {
  uploaded?: boolean
  completed?: boolean
}): Promise<void> {
  try {
    if (hasSupabase()) {
      // Écrire directement dans Supabase
      const { supabase } = await import('../lib/supabase')
      if (!supabase) return
      const sid = getSessionId()
      const { data: existing } = await supabase
        .from('sessions')
        .select('session_id')
        .eq('session_id', sid)
        .maybeSingle()

      if (existing) {
        await supabase
          .from('sessions')
          .update({
            last_active: new Date().toISOString(),
            uploaded_file: event.uploaded ? true : undefined,
            completed_analysis: event.completed ? true : undefined,
          })
          .eq('session_id', sid)
      } else {
        await supabase
          .from('sessions')
          .insert({
            session_id: sid,
            uploaded_file: event.uploaded || false,
            completed_analysis: event.completed || false,
          })
      }
    } else {
      // Fallback: backend API
      const baseUrl = getApiBaseUrl()
      await fetch(`${baseUrl}/session/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
        body: JSON.stringify({
          session_id: getSessionId(),
          ...event,
        }),
      })
    }
  } catch {
    // Silencieux
  }
}

export async function trackSessionTime(timeSec: number): Promise<void> {
  try {
    if (hasSupabase()) {
      const { supabase } = await import('../lib/supabase')
      if (!supabase) return
      const sid = getSessionId()
      await supabase
        .from('sessions')
        .upsert({
          session_id: sid,
          total_time_sec: timeSec,
          last_active: new Date().toISOString(),
        }, { onConflict: 'session_id' })
    } else {
      const baseUrl = getApiBaseUrl()
      await fetch(`${baseUrl}/session/time`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
        body: JSON.stringify({
          session_id: getSessionId(),
          time_sec: timeSec,
        }),
      })
    }
  } catch {
    // Silencieux
  }
}

// ──────────────────────────────────────────────
// Behavioral Analytics (Admin)
// ──────────────────────────────────────────────

export interface BehavioralStats {
  total_sessions: number
  uploads: number
  completions: number
  drop_off_upload: number
  drop_off_analysis: number
  upload_rate: number
  completion_rate: number
  avg_time_sec: number
  material_usage: { material: string; count: number }[]
  avg_file_size_kb: number
  size_distribution: { size_range: string; count: number }[]
}

export async function fetchBehavioralStats(): Promise<BehavioralStats> {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/behavioral`, {
    headers: getAdminHeaders(),
  })
  if (!response.ok) throw new Error('Erreur chargement stats comportementales')
  return response.json()
}

// ──────────────────────────────────────────────
// User Activity Logging
// ──────────────────────────────────────────────

export interface ActivityEvent {
  event_type: 'page_view' | 'error' | 'upload' | 'analysis' | 'feedback' | 'backend_error' | 'click'
  page?: string
  message?: string
  details?: string
  metadata?: string
}

export async function logActivity(event: ActivityEvent): Promise<void> {
  try {
    if (hasSupabase()) {
      const { supabase } = await import('../lib/supabase')
      if (!supabase) return
      await supabase
        .from('user_activity')
        .insert({
          session_id: getSessionId(),
          event_type: event.event_type,
          page: event.page || '',
          message: event.message || '',
          details: event.details || '',
          metadata: event.metadata || '{}',
        })
    } else {
      const baseUrl = getApiBaseUrl()
      await fetch(`${baseUrl}/activity/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAdminHeaders() },
        body: JSON.stringify({
          session_id: getSessionId(),
          ...event,
        }),
      })
    }
  } catch {
    // Silencieux
  }
}

// ──────────────────────────────────────────────
// Log analysis to Supabase (admin analytics)
// ──────────────────────────────────────────────

export async function logAnalysisToSupabase(result: AnalysisResult, file: File): Promise<void> {
  try {
    if (!hasSupabase()) return
    const { supabase } = await import('../lib/supabase')
    if (!supabase) return

    await supabase.from('analytics').insert({
      material: result.material,
      problems_count: result.summary.total_problems,
      high_count: result.summary.high_severity,
      medium_count: result.summary.medium_severity,
      low_count: result.summary.low_severity,
      error: false,
      file_size_kb: Math.round(file.size / 1024),
      date: new Date().toISOString().split('T')[0],
    })
  } catch {
    // Silencieux
  }
}

export interface UserActivity {
  id: number
  timestamp: string
  session_id: string
  ip_address: string
  user_agent: string
  event_type: string
  page: string
  message: string
  details: string
  metadata: string
}

export interface ActivityStats {
  total_events: number
  by_type: { event_type: string; count: number }[]
  recent_errors: UserActivity[]
  unique_ips: number
  today_events: number
}

export async function fetchActivities(
  eventType?: string,
  limit = 100,
  offset = 0
): Promise<{ activities: UserActivity[]; total: number }> {
  if (hasSupabase()) {
    const { supabase } = await import('../lib/supabase')
    if (!supabase) throw new Error('Supabase non configuré')

    let query = supabase.from('user_activity').select('*', { count: 'exact' })
    if (eventType && eventType !== 'all') {
      query = query.eq('event_type', eventType)
    }
    query = query.order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw new Error('Erreur chargement activités')
    return { activities: (data || []) as UserActivity[], total: count || 0 }
  }

  const baseUrl = getApiBaseUrl()
  const params = new URLSearchParams()
  if (eventType && eventType !== 'all') params.set('event_type', eventType)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  const response = await fetch(`${baseUrl}/admin/activities?${params}`, {
    headers: getAdminHeaders(),
  })
  if (!response.ok) throw new Error('Erreur chargement activités')
  return response.json()
}

export async function fetchActivityStats(): Promise<ActivityStats> {
  if (hasSupabase()) {
    const { supabase } = await import('../lib/supabase')
    if (!supabase) throw new Error('Supabase non configuré')

    const { data, error } = await supabase
      .from('user_activity')
      .select('event_type')

    if (error) throw new Error('Erreur stats activités')

    const rows = data || []
    const total = rows.length

    // Par type
    const typeMap: Record<string, number> = {}
    for (const r of rows) {
      typeMap[r.event_type] = (typeMap[r.event_type] || 0) + 1
    }
    const by_type = Object.entries(typeMap)
      .map(([event_type, count]) => ({ event_type, count }))
      .sort((a, b) => b.count - a.count)

    // Erreurs récentes
    const { data: errors } = await supabase
      .from('user_activity')
      .select('*')
      .in('event_type', ['error', 'backend_error'])
      .order('timestamp', { ascending: false })
      .limit(10)

    // IPs uniques
    const { data: allIps } = await supabase
      .from('user_activity')
      .select('ip_address')
      .neq('ip_address', '')
    const uniqueIps = new Set((allIps || []).map((r: any) => r.ip_address)).size

    // Aujourd'hui
    const today = new Date().toISOString().split('T')[0]
    const todayEvents = rows.filter((r: any) => r.timestamp?.startsWith(today)).length

    return {
      total_events: total,
      by_type,
      recent_errors: (errors || []) as UserActivity[],
      unique_ips: uniqueIps,
      today_events: todayEvents,
    }
  }

  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/admin/activity-stats`, {
    headers: getAdminHeaders(),
  })
  if (!response.ok) throw new Error('Erreur chargement stats activités')
  return response.json()
}
