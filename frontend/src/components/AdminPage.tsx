/**
 * AdminPage — Dashboard d'administration DFM Checker
 * Stats, erreurs, feedbacks — connecté au backend SQLite.
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import FadeContent from './FadeContent'
import {
  fetchAdminDashboard,
  fetchAdminErrors,
  toggleErrorResolved,
  fetchAdminFeedbacks,
  updateFeedbackStatus,
} from '../services/api'
import type {
  AdminDashboard,
  AdminError,
  AdminFeedback,
} from '../services/api'

interface AdminPageProps {
  onBack: () => void
}

type Tab = 'dashboard' | 'errors' | 'feedbacks'

function StatCard({ label, value, icon, color, trend }: { label: string; value: string; icon: string; color: string; trend?: string }) {
  return (
    <div className="glass-panel p-5 flex items-start gap-4 group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${color} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {trend && <p className="text-[11px] text-green-600 dark:text-green-400 mt-0.5">{trend}</p>}
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
    medium: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30',
    low: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  }
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border ${colors[severity] || ''}`}>
      {severity}
    </span>
  )
}

function TypeBadge({ type }: { type: string }) {
  const icons: Record<string, string> = { api: '🔌', upload: '📤', analysis: '⚙️', system: '🖥️' }
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
      <span>{icons[type] || '?'}</span>
      <span className="capitalize">{type}</span>
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; class: string }> = {
    new: { label: 'Nouveau', class: 'bg-tech-500/15 text-tech-600 dark:text-tech-400 border-tech-500/30' },
    read: { label: 'Lu', class: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
    archived: { label: 'Archivé', class: 'bg-gray-500/5 text-gray-400 border-gray-500/10' },
  }
  const c = config[status] || config.read
  return (
    <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${c.class}`}>
      {c.label}
    </span>
  )
}

function MiniChart({ data }: { data: { date: string; analyses: number }[] }) {
  const maxVal = Math.max(...data.map(d => d.analyses), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
            {d.analyses}
          </span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-tech-600 to-purple-500 transition-all duration-300 group-hover:from-tech-500 group-hover:to-purple-400 cursor-pointer"
            style={{ height: `${(d.analyses / maxVal) * 100}%`, minHeight: d.analyses > 0 ? '6px' : '0' }}
          />
          <span className="text-[9px] text-gray-400 dark:text-gray-600">{d.date}</span>
        </div>
      ))}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-panel p-5">
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
            <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-panel p-6">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="glass-panel p-6">
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
          <div className="space-y-3 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 dark:bg-gray-800 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage({ onBack }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')

  // Données
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null)
  const [errors, setErrors] = useState<AdminError[]>([])
  const [errorsTotal, setErrorsTotal] = useState(0)
  const [feedbacks, setFeedbacks] = useState<AdminFeedback[]>([])

  // États
  const [loading, setLoading] = useState(true)
  const [dbConnected, setDbConnected] = useState(false)

  // Filtres erreurs
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterResolved, setFilterResolved] = useState<string>('all')

  // ── Chargement initial ──
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [dash, errRes, fbRes] = await Promise.all([
          fetchAdminDashboard(),
          fetchAdminErrors(),
          fetchAdminFeedbacks(),
        ])
        if (cancelled) return
        setDashboard(dash)
        setErrors(errRes.errors)
        setErrorsTotal(errRes.total)
        setFeedbacks(fbRes.feedbacks)
        setDbConnected(true)
      } catch {
        if (!cancelled) setDbConnected(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // ── Rafraîchir erreurs filtrées ──
  useEffect(() => {
    let cancelled = false
    async function refetch() {
      try {
        const resolved = filterResolved === 'all' ? undefined : filterResolved === 'resolved'
        const res = await fetchAdminErrors(
          filterSeverity === 'all' ? undefined : filterSeverity,
          resolved,
        )
        if (!cancelled) {
          setErrors(res.errors)
          setErrorsTotal(res.total)
        }
      } catch {
        // silencieux
      }
    }
    refetch()
    return () => { cancelled = true }
  }, [filterSeverity, filterResolved])

  // ── Rafraîchir feedbacks ──
  const refreshFeedbacks = useCallback(async () => {
    try {
      const fbRes = await fetchAdminFeedbacks()
      setFeedbacks(fbRes.feedbacks)
    } catch { /* silencieux */ }
  }, [])

  // ── Actions ──
  const handleToggleResolve = async (id: number) => {
    try {
      await toggleErrorResolved(id)
      setErrors(prev => prev.map(e => e.id === id ? { ...e, resolved: !e.resolved } : e))
    } catch { /* silencieux */ }
  }

  const handleFeedbackStatus = async (id: number, status: 'new' | 'read' | 'archived') => {
    try {
      await updateFeedbackStatus(id, status)
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status } : f))
    } catch { /* silencieux */ }
  }

  // ── Mémoïsation ──
  const unresolvedErrors = useMemo(() => errors.filter(e => !e.resolved).length, [errors])
  const newFeedbacks = useMemo(() => feedbacks.filter(f => f.status === 'new').length, [feedbacks])

  const tabs: { key: Tab; label: string; icon: string; badge?: number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'errors', label: 'Erreurs', icon: '⚠️', badge: unresolvedErrors },
    { key: 'feedbacks', label: 'Feedbacks', icon: '💬', badge: newFeedbacks },
  ]

  const errorRate = dashboard && dashboard.total_analyses > 0
    ? ((dashboard.total_errors / dashboard.total_analyses) * 100).toFixed(1)
    : '0'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button onClick={onBack}
                className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Retour</span>
              </button>
              <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 hidden sm:block" />
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-white">Admin</h1>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">DFM Checker — Panel de contrôle</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!dbConnected && !loading && (
                <span className="text-[10px] font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                  Backend déconnecté
                </span>
              )}
              {dbConnected && (
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  Base OK
                </span>
              )}
              <span className="text-[10px] font-mono text-gray-400 dark:text-gray-600 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded-md">v1.0.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-0">
          {tabs.map(tab => (
            <button key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'text-tech-700 dark:text-tech-300'
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                  tab.key === 'errors'
                    ? 'bg-red-500/15 text-red-600 dark:text-red-400'
                    : 'bg-tech-500/15 text-tech-600 dark:text-tech-400'
                }`}>
                  {tab.badge}
                </span>
              )}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tech-600 dark:bg-tech-400 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading && <LoadingSkeleton />}

        {!loading && !dbConnected && (
          <div className="glass-panel p-12 text-center space-y-4">
            <div className="text-5xl">🔌</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Backend non joignable</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Le serveur backend semble éteint. Les données affichées sont simulées à titre de démonstration.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              (Les vraies données apparaîtront automatiquement quand le backend sera relancé)
            </p>
          </div>
        )}

        {!loading && dbConnected && activeTab === 'dashboard' && dashboard && (
          <FadeContent threshold={0.1} duration={600}>
            <div className="space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Analyses" value={String(dashboard.total_analyses)} icon="🔬" color="from-tech-500/20 to-purple-500/20 bg-gradient-to-br" />
                <StatCard label="Problèmes détectés" value={String(dashboard.total_problems)} icon="🔍" color="from-orange-500/20 to-red-500/20 bg-gradient-to-br" />
                <StatCard label="Taux d'erreur" value={`${errorRate}%`} icon="⚠️" color="from-red-500/20 to-pink-500/20 bg-gradient-to-br" />
                <StatCard label="Feedbacks" value={String(dashboard.total_feedbacks)} icon="💬" color="from-green-500/20 to-emerald-500/20 bg-gradient-to-br" trend={`+${dashboard.new_feedbacks} nouveaux`} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-panel p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Analyses par jour</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Dernière semaine</p>
                  {dashboard.daily.length > 0 ? (
                    <MiniChart data={dashboard.daily} />
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">Aucune analyse récente</p>
                  )}
                </div>

                <div className="glass-panel p-6">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Sévérité des problèmes</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Cumul depuis le début</p>
                  <div className="space-y-3">
                    {[
                      { label: 'Critique (haute)', value: dashboard.high_severity_total || 0, color: 'bg-red-500', max: Math.max(dashboard.total_problems, 1) },
                      { label: 'Modérée', value: 0, color: 'bg-orange-500', max: Math.max(dashboard.total_problems, 1) },
                      { label: 'Faible', value: 0, color: 'bg-yellow-500', max: Math.max(dashboard.total_problems, 1) },
                    ].map(item => {
                      const pct = dashboard.total_problems > 0 ? Math.round((item.value / (dashboard.high_severity_total || 1)) * 100) : 0
                      return (
                        <div key={item.label} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 dark:text-gray-300 w-28 shrink-0">{item.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                              style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-10 text-right">{item.value}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Recent errors */}
              {dashboard.recent_errors.length > 0 && (
                <div className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dernières erreurs</h3>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Les 5 événements les plus récents</p>
                    </div>
                    <button onClick={() => setActiveTab('errors')}
                      className="text-xs font-medium text-tech-600 dark:text-tech-400 hover:text-tech-700 dark:hover:text-tech-300 transition-colors">
                      Voir tout →
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dashboard.recent_errors.map((err: any) => (
                      <div key={err.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                        <TypeBadge type={err.type} />
                        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{err.message}</span>
                        <SeverityBadge severity={err.severity} />
                        <span className={`text-[10px] font-mono ${err.resolved ? 'text-green-500' : 'text-red-400'}`}>
                          {err.resolved ? 'Résolu' : 'Ouvert'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FadeContent>
        )}

        {!loading && dbConnected && activeTab === 'errors' && (
          <FadeContent threshold={0.1} duration={600}>
            <div className="glass-panel overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Sévérité :</span>
                  {['all', 'high', 'medium', 'low'].map(s => (
                    <button key={s}
                      onClick={() => setFilterSeverity(s)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                        filterSeverity === s
                          ? 'bg-tech-500/15 text-tech-600 dark:text-tech-400 border-tech-500/30'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {s === 'all' ? 'Tous' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <div className="w-px h-5 bg-gray-200 dark:bg-gray-700" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Statut :</span>
                  {['all', 'resolved', 'unresolved'].map(s => (
                    <button key={s}
                      onClick={() => setFilterResolved(s)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                        filterResolved === s
                          ? 'bg-tech-500/15 text-tech-600 dark:text-tech-400 border-tech-500/30'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {s === 'all' ? 'Tous' : s === 'resolved' ? 'Résolus' : 'Ouverts'}
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                <span className="text-[11px] text-gray-400 dark:text-gray-500">{errorsTotal} erreur(s)</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800/50">
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Message</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Détails</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Sévérité</th>
                      <th className="text-left px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                      <th className="text-right px-4 py-3 text-[11px] font-medium text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errors.map(err => (
                      <tr key={err.id} className="border-b border-gray-50 dark:border-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 font-mono whitespace-nowrap">{err.timestamp}</td>
                        <td className="px-4 py-3"><TypeBadge type={err.type} /></td>
                        <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-medium">{err.message}</td>
                        <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">{err.details}</td>
                        <td className="px-4 py-3"><SeverityBadge severity={err.severity} /></td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-medium ${err.resolved ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                            {err.resolved ? 'Résolu' : 'Ouvert'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => handleToggleResolve(err.id)}
                            className={`px-2.5 py-1 text-[10px] font-medium rounded-lg border transition-colors ${
                              err.resolved
                                ? 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                : 'border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10'
                            }`}
                          >
                            {err.resolved ? 'Rouvrir' : 'Résoudre'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {errors.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
                          Aucune erreur trouvée
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </FadeContent>
        )}

        {!loading && dbConnected && activeTab === 'feedbacks' && (
          <FadeContent threshold={0.1} duration={600}>
            <div className="space-y-3">
              {feedbacks.map(fb => (
                <div key={fb.id} className="glass-panel p-5 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <StatusBadge status={fb.status} />
                      <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{fb.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fb.status === 'new' && (
                        <button onClick={() => handleFeedbackStatus(fb.id, 'read')}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-tech-500/30 text-tech-600 dark:text-tech-400 hover:bg-tech-500/10 transition-colors">
                          Marquer lu
                        </button>
                      )}
                      {fb.status === 'read' && (
                        <button onClick={() => handleFeedbackStatus(fb.id, 'archived')}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                          Archiver
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{fb.message}</p>
                  {fb.email && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="truncate">{fb.email}</span>
                    </div>
                  )}
                </div>
              ))}
              {feedbacks.length === 0 && (
                <div className="glass-panel p-12 text-center">
                  <p className="text-sm text-gray-400 dark:text-gray-500">Aucun feedback pour le moment</p>
                </div>
              )}
            </div>
          </FadeContent>
        )}
      </div>

      {/* ── Footer admin ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200 dark:border-gray-800 mt-8">
        <p className="text-[11px] text-gray-400 dark:text-gray-600 text-center">
          Panel d'administration — {dbConnected ? 'Données en temps réel (SQLite)' : 'Backend déconnecté'}
        </p>
      </div>
    </div>
  )
}
