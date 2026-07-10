/**
 * Types TypeScript pour le DFM Checker
 */

export type Material = 'PLA' | 'ABS' | 'PETG'

export type ProblemType = 'thin_wall' | 'overhang' | 'aspect_ratio' | 'sharp_corner'

export type Severity = 'high' | 'medium' | 'low'

export interface ProblemLocation {
  x: number
  y: number
  z: number
}

export interface ProblemDetails {
  measured_avg_thickness?: number
  threshold?: number
  num_affected_faces?: number
  material?: string
  measured_avg_angle?: number
  critical_angle?: number
  global_ratio?: number
  worst_section_ratio?: number
  max_recommended_ratio?: number
  height_mm?: number
  width_mm?: number
}

export interface DFMProblem {
  type: ProblemType
  severity: Severity
  face_indices: number[]
  location: ProblemLocation
  description: string
  suggestion: string
  details: ProblemDetails
}

export interface BoundingBox {
  x: number
  y: number
  z: number
}

export interface MeshStats {
  num_faces: number
  num_vertices: number
  is_watertight: boolean
  volume_mm3: number | null
  bounding_box: BoundingBox
}

export interface Thresholds {
  min_wall_thickness_mm: Record<Material, number>
  max_overhang_angle_deg: number
  max_aspect_ratio: number
}

export interface AnalysisSummary {
  total_problems: number
  high_severity: number
  medium_severity: number
  low_severity: number
}

export interface AnalysisResult {
  material: Material
  thresholds: Thresholds
  problems: DFMProblem[]
  stats: MeshStats
  summary: AnalysisSummary
}

export interface AnalysisState {
  status: 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error'
  result: AnalysisResult | null
  error: string | null
  progress: number
}

export const MATERIAL_NAMES: Record<Material, string> = {
  PLA: 'PLA (acide polylactique)',
  ABS: 'ABS (acrylonitrile butadiène styrène)',
  PETG: 'PETG (polyéthylène téréphtalate glycol)',
}

export const SEVERITY_CONFIG: Record<Severity, { label: string; color: string; bg: string }> = {
  high: { label: 'Critique', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  medium: { label: 'Modéré', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  low: { label: 'Info', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
}

export const PROBLEM_LABELS: Record<ProblemType, { title: string; icon: string }> = {
  thin_wall: { title: 'Paroi trop fine', icon: '📏' },
  overhang: { title: 'Surplomb non supporté', icon: '📐' },
  aspect_ratio: { title: 'Ratio élancé', icon: '📊' },
  sharp_corner: { title: 'Angle vif / Concentration de contraintes', icon: '🔺' },
}
