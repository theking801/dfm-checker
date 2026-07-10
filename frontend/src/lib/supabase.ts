/**
 * Supabase client — Point d'entrée pour la base de données et l'auth
 *
 * Variables d'environnement nécessaires :
 *   VITE_SUPABASE_URL    → https://votre-projet.supabase.co
 *   VITE_SUPABASE_ANON_KEY → clé anon du projet
 */

import { createClient } from '@supabase/supabase-js'

// @ts-expect-error - import.meta.env est défini par Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
// @ts-expect-error - import.meta.env est défini par Vite
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const isConfigured = !!(supabaseUrl && supabaseAnonKey)

if (!isConfigured) {
  console.warn(
    '[Supabase] Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes. ' +
    'Les fonctionnalités admin utiliseront le backend Python SQLite en fallback.'
  )
}

export const supabase = isConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null

// ── Auth ──
export type AuthResult =
  | { success: true; error: null }
  | { success: false; error: string }

/**
 * Connexion avec email + mot de passe via Supabase Auth.
 */
export async function signInAdmin(email: string, password: string): Promise<AuthResult> {
  if (!supabase) return { success: false, error: 'Supabase non configuré' }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { success: false, error: error.message }
  return { success: true, error: null }
}

/**
 * Déconnexion.
 */
export async function signOutAdmin(): Promise<void> {
  if (!supabase) return
  await supabase.auth.signOut()
}

/**
 * Vérifie si un administrateur est connecté.
 */
export function getSession() {
  if (!supabase) return null
  return supabase.auth.getSession()
}

// ── Database helpers ──

/** Types Supabase (auto-générés, version manuelle) */
export interface DbAnalysis {
  id?: number
  date: string
  material: string
  problems_count: number
  high_count: number
  medium_count: number
  low_count: number
  error: boolean
  error_msg?: string | null
  file_size_kb?: number | null
  created_at?: string
}

export interface DbError {
  id: number
  timestamp: string
  type: 'api' | 'upload' | 'analysis' | 'system'
  message: string
  details: string
  severity: 'high' | 'medium' | 'low'
  resolved: boolean
}

export interface DbFeedback {
  id: number
  date: string
  message: string
  email: string
  status: 'new' | 'read' | 'archived'
}

// ── Dashboard ──

export interface DashboardData {
  total_analyses: number
  total_problems: number
  total_errors: number
  high_severity_total: number
  unresolved_errors: number
  total_feedbacks: number
  new_feedbacks: number
  daily: { date: string; analyses: number; errors: number }[]
  recent_errors: DbError[]
}

export async function fetchDashboard(): Promise<DashboardData> {
  if (!supabase) throw new Error('Supabase non configuré')

  // Toutes les requêtes en parallèle pour la perf
  const [
    { count: totalAnalyses, error: err1 },
    { data: analyticsData, error: err2 },
    { data: errorsData, error: err3 },
    { data: feedbacksData, error: err4 },
    { count: unresolvedCount, error: err5 },
    { count: newFeedbacksCount, error: err6 },
    dailyData,
  ] = await Promise.all([
    supabase.from('analytics').select('*', { count: 'exact', head: true }),
    supabase.from('analytics').select('problems_count, high_count, error, date'),
    supabase.from('errors').select('*').order('timestamp', { ascending: false }).limit(5),
    supabase.from('feedbacks').select('*', { count: 'exact', head: true }),
    supabase.from('errors').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('feedbacks').select('*', { count: 'exact', head: true }).eq('status', 'new'),
    // Daily chart: une seule requête avec GROUP BY
    supabase.from('analytics').select('date, error', { count: 'exact' })
      .gte('date', new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]),
  ])

  if (err1 || err2 || err3 || err4 || err5 || err6) {
    throw new Error('Erreur chargement dashboard')
  }

  // Totaux
  const totalProblems = (analyticsData || []).reduce(
    (sum: number, r: any) => sum + (r.problems_count || 0), 0
  )
  const highTotal = (analyticsData || []).reduce(
    (sum: number, r: any) => sum + (r.high_count || 0), 0
  )
  const errorCount = (analyticsData || []).filter((r: any) => r.error).length

  // Daily chart depuis la même requête agrégée
  const daily = buildDailyChartFromData(dailyData.data || [])

  return {
    total_analyses: totalAnalyses || 0,
    total_problems: totalProblems,
    total_errors: errorCount,
    high_severity_total: highTotal,
    unresolved_errors: unresolvedCount || 0,
    total_feedbacks: feedbacksData?.length || 0,
    new_feedbacks: newFeedbacksCount || 0,
    daily,
    recent_errors: (errorsData || []).map(e => ({ ...e, resolved: !!e.resolved })) as DbError[],
  }
}

/** Construit le graphique des 7 derniers jours depuis les data analytics */
function buildDailyChartFromData(data: any[]): { date: string; analyses: number; errors: number }[] {
  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
  const days: { date: string; analyses: number; errors: number }[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayName = dayNames[d.getDay()]

    const dayData = data.filter((r: any) => r.date === dateStr)
    days.push({
      date: dayName,
      analyses: dayData.length,
      errors: dayData.filter((r: any) => r.error).length,
    })
  }

  return days
}

// ── Errors ──

export async function fetchErrors(params?: {
  severity?: string
  resolved?: boolean
  limit?: number
  offset?: number
}): Promise<{ errors: DbError[]; total: number }> {
  if (!supabase) throw new Error('Supabase non configuré')

  let query = supabase.from('errors').select('*', { count: 'exact' })

  if (params?.severity && params.severity !== 'all') {
    query = query.eq('severity', params.severity)
  }
  if (params?.resolved !== undefined) {
    query = query.eq('resolved', params.resolved)
  }

  query = query.order('timestamp', { ascending: false })
    .limit(params?.limit || 100)
    .range(params?.offset || 0, (params?.offset || 0) + (params?.limit || 100) - 1)

  const { data, error, count } = await query
  if (error) throw new Error('Erreur chargement erreurs')

  return {
    errors: (data || []).map(e => ({ ...e, resolved: !!e.resolved })) as DbError[],
    total: count || 0,
  }
}

export async function toggleErrorResolved(errorId: number): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase
    .from('errors')
    .select('resolved')
    .eq('id', errorId)
    .single()

  if (error) throw new Error('Erreur mise à jour')

  const { error: updateError } = await supabase
    .from('errors')
    .update({ resolved: !data.resolved })
    .eq('id', errorId)

  if (updateError) throw new Error('Erreur mise à jour')
}

// ── Feedbacks ──

export async function fetchFeedbacks(): Promise<{ feedbacks: DbFeedback[] }> {
  if (!supabase) throw new Error('Supabase non configuré')

  const { data, error } = await supabase
    .from('feedbacks')
    .select('*')
    .order('date', { ascending: false })
    .order('id', { ascending: false })

  if (error) throw new Error('Erreur chargement feedbacks')
  return { feedbacks: (data || []) as DbFeedback[] }
}

export async function addFeedback(message: string, email: string = ''): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')

  const { error } = await supabase
    .from('feedbacks')
    .insert({ message, email, date: new Date().toISOString().split('T')[0], status: 'new' })

  if (error) throw new Error(error.message || 'Erreur envoi feedback')
}

export async function updateFeedbackStatus(feedbackId: number, status: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré')

  const { error } = await supabase
    .from('feedbacks')
    .update({ status })
    .eq('id', feedbackId)

  if (error) throw new Error('Erreur mise à jour feedback')
}

// ── Behavioral Analytics ──

export async function fetchBehavioralStats(): Promise<any> {
  if (!supabase) throw new Error('Supabase non configuré')

  // Sessions
  const { data: sessionsData, error: sessErr } = await supabase
    .from('sessions')
    .select('*')

  if (sessErr) throw new Error('Erreur chargement sessions')

  const sessions = sessionsData || []
  const totalSessions = sessions.length
  const uploads = sessions.filter((s: any) => s.uploaded_file).length
  const completions = sessions.filter((s: any) => s.completed_analysis).length
  const totalTime = sessions.reduce((sum: number, s: any) => sum + (s.total_time_sec || 0), 0)
  const avgTime = totalSessions > 0 ? totalTime / totalSessions : 0

  // Material usage depuis analytics
  const { data: analyticsData } = await supabase
    .from('analytics')
    .select('material, file_size_kb')

  const materialMap: Record<string, number> = {}
  const fileSizes: number[] = []
  for (const row of (analyticsData || [])) {
    materialMap[row.material] = (materialMap[row.material] || 0) + 1
    if (row.file_size_kb) fileSizes.push(row.file_size_kb)
  }

  const materialUsage = Object.entries(materialMap)
    .map(([material, count]) => ({ material, count }))
    .sort((a, b) => b.count - a.count)

  const avgFileSize = fileSizes.length > 0
    ? fileSizes.reduce((a, b) => a + b, 0) / fileSizes.length
    : 0

  // Size distribution
  const sizeRanges = { '< 100 KB': 0, '100-500 KB': 0, '500 KB - 1 MB': 0, '1-5 MB': 0, '5+ MB': 0 }
  for (const size of fileSizes) {
    if (size < 100) sizeRanges['< 100 KB']++
    else if (size < 500) sizeRanges['100-500 KB']++
    else if (size < 1000) sizeRanges['500 KB - 1 MB']++
    else if (size < 5000) sizeRanges['1-5 MB']++
    else sizeRanges['5+ MB']++
  }
  const sizeDistribution = Object.entries(sizeRanges)
    .map(([size_range, count]) => ({ size_range, count }))
    .filter(s => s.count > 0)

  return {
    total_sessions: totalSessions,
    uploads,
    completions,
    drop_off_upload: totalSessions - uploads,
    drop_off_analysis: uploads - completions,
    upload_rate: totalSessions > 0 ? Math.round(uploads / totalSessions * 100 * 10) / 10 : 0,
    completion_rate: uploads > 0 ? Math.round(completions / uploads * 100 * 10) / 10 : 0,
    avg_time_sec: Math.round(avgTime * 10) / 10,
    material_usage: materialUsage,
    avg_file_size_kb: Math.round(avgFileSize * 10) / 10,
    size_distribution: sizeDistribution,
  }
}
