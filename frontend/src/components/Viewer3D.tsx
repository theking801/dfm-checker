import { Suspense, useMemo, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import HighlightedMesh from './HighlightedMesh'
import { useTranslation } from '../contexts/LanguageContext'
import type { DFMProblem, MeshStats } from '../types'

interface Viewer3DProps {
  /** URL blob du fichier STL */
  stlUrl: string
  /** Problèmes détectés */
  problems: DFMProblem[]
  /** Statistiques du mesh */
  stats: MeshStats
}

/**
 * Visualiseur 3D interactif du modèle STL avec surlignage des zones problématiques.
 *
 * Utilise @react-three/fiber avec :
 * - OrbitControls pour la rotation/zoom
 * - ContactShadows pour une ombre réaliste
 * - HighlightedMesh pour le rendu avec couleurs
 * - Un fond sombre technique
 */
function Scene({ stlUrl, problems, stats }: Viewer3DProps) {
  const shadowPosition = useMemo(
    () => getShadowPosition(stats.bounding_box),
    [stats.bounding_box]
  )

  return (
    <>
      {/* Éclairage */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />
      <pointLight position={[0, 15, 0]} intensity={0.2} />

      {/* Ombre portée - position dynamique selon la taille du modèle */}
      <ContactShadows
        position={shadowPosition}
        opacity={0.4}
        scale={20}
        blur={2.5}
        far={10}
      />

      {/* Le mesh avec les zones surlignées */}
      <HighlightedMesh
        url={stlUrl}
        problems={problems}
        stats={stats}
      />

      {/* Contrôles de la caméra */}
      <OrbitControls
        enablePan
        enableZoom
        enableRotate
        autoRotate={false}
        minDistance={1}
        maxDistance={50}
        target={[0, 0, 0]}
      />

      {/* Environnement subtil pour la réflexion */}
      <Environment preset="city" />
    </>
  )
}

/**
 * Calcule la position de la caméra pour englober le mesh.
 */
function getCameraPosition(boundingBox: { x: number; y: number; z: number }): [number, number, number] {
  const maxDim = Math.max(boundingBox.x, boundingBox.y, boundingBox.z)
  const distance = Math.max(maxDim * 2.5, 5)
  return [distance * 0.6, distance * 0.4, distance]
}

/**
 * Calcule la position de l'ombre portée en fonction de la hauteur du modèle.
 */
function getShadowPosition(boundingBox: { x: number; y: number; z: number }): [number, number, number] {
  return [0, -boundingBox.z * 0.8, 0]
}

export default function Viewer3D({ stlUrl, problems, stats }: Viewer3DProps) {
  const { t } = useTranslation()
  const cameraPosition = useMemo(
    () => getCameraPosition(stats.bounding_box),
    [stats.bounding_box]
  )

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800/50">
      {/* Légende des couleurs */}
      <div className="absolute top-4 left-4 z-10 space-y-1.5">
        <div className="p-3 space-y-1.5 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{t('viewer.legend')}</span>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm bg-blue-400/80" />
            <span className="text-gray-600 dark:text-gray-200">{t('viewer.normal')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-gray-600 dark:text-gray-200">{t('viewer.overhang')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm bg-orange-400" />
            <span className="text-gray-600 dark:text-gray-200">{t('viewer.wall')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm bg-pink-400" />
            <span className="text-gray-600 dark:text-gray-200">{t('viewer.ratio_label')}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-sm bg-teal-400" />
            <span className="text-gray-600 dark:text-gray-200">{t('viewer.sharp_corner')}</span>
          </div>
        </div>
      </div>

      {/* Contrôles de la souris */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
        <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-300 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg flex items-center gap-3">
          <span>{t('viewer.rotate')}</span>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-600" />
          <span>{t('viewer.zoom')}</span>
          <span className="w-px h-3 bg-gray-200 dark:bg-gray-600" />
          <span>{t('viewer.pan')}</span>
        </div>
      </div>

      {/* Canvas Three.js */}
      <Suspense
        fallback={
          <div className="w-full h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-tech-300/50 border-t-tech-600 rounded-full animate-spin" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('viewer.loading')}</span>
            </div>
          </div>
        }
      >
        <Canvas
          camera={{
            position: cameraPosition,
            fov: 45,
            near: 0.1,
            far: 100,
          }}
          style={{ width: '100%', height: '100%' }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#f8f9fa')
          }}
        >
          <Scene stlUrl={stlUrl} problems={problems} stats={stats} />
        </Canvas>
      </Suspense>
    </div>
  )
}
