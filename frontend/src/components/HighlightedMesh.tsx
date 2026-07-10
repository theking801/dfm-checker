import { useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute, Color, Mesh } from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import { useLoader } from '@react-three/fiber'
import type { DFMProblem, MeshStats } from '../types'

interface HighlightedMeshProps {
  url: string
  problems: DFMProblem[]
  stats: MeshStats
}

/**
 * Composant qui affiche le mesh STL avec les zones problématiques surlignées.
 *
 * Principe :
 * 1. On charge le mesh via STLLoader
 * 2. On crée un tableau de couleurs par face (vertex colors)
 * 3. Les faces problématiques sont colorées en rouge/orange
 * 4. Les faces normales restent en gris/bleu technique
 */
export default function HighlightedMesh({ url, problems, stats }: HighlightedMeshProps) {
  const geometry = useLoader(STLLoader, url)
  const meshRef = useRef<Mesh>(null)

  const coloredGeometry = useMemo(() => {
    if (!geometry) return null

    const geo = geometry.clone()
    const positionAttribute = geo.getAttribute('position')

    if (!positionAttribute) return geo

    const vertexCount = positionAttribute.count
    const faceCount = vertexCount / 3

    // Ensemble des indices de faces problématiques
    const problemFaces = new Set<number>()
    for (const problem of problems) {
      for (const idx of problem.face_indices) {
        // L'utilisateur nous donne des indices d'index de face
        // Chaque face = 3 sommets
        if (idx < faceCount) {
          problemFaces.add(idx)
        }
      }
    }

    // Création du tableau de couleurs par sommet
    const colors = new Float32Array(vertexCount * 3)

    // Couleurs — thème clair + violet
    const normalColor = new Color(0.55, 0.50, 0.65) // Violet-gris technique
    const overhangColor = new Color(1.0, 0.3, 0.2) // Rouge pour overhangs
    const thinWallColor = new Color(1.0, 0.6, 0.1) // Orange pour parois fines
    const aspectRatioColor = new Color(0.9, 0.4, 0.5) // Rose pour ratios
    const sharpCornerColor = new Color(0.2, 0.8, 0.7) // Teal pour angles vifs

    // Types de problèmes pour les couleurs
    const problemTypeByFace = new Map<number, string>()
    for (const problem of problems) {
      for (const idx of problem.face_indices) {
        if (idx < faceCount) {
          problemTypeByFace.set(idx, problem.type)
        }
      }
    }

    // Remplissage des couleurs
    for (let i = 0; i < faceCount; i++) {
      const type = problemTypeByFace.get(i)
      let color: Color

      if (type === 'overhang') {
        color = overhangColor
      } else if (type === 'thin_wall') {
        color = thinWallColor
      } else if (type === 'aspect_ratio') {
        color = aspectRatioColor
      } else if (type === 'sharp_corner') {
        color = sharpCornerColor
      } else {
        color = normalColor
      }

      // Même couleur pour les 3 sommets de la face
      for (let j = 0; j < 3; j++) {
        const idx = (i * 3 + j) * 3
        colors[idx] = color.r
        colors[idx + 1] = color.g
        colors[idx + 2] = color.b
      }
    }

    geo.setAttribute('color', new Float32BufferAttribute(colors, 3))
    return geo
  }, [geometry, problems])

  if (!coloredGeometry) return null

  return (
    <mesh ref={meshRef} geometry={coloredGeometry} castShadow receiveShadow>
      <meshStandardMaterial
        vertexColors
        metalness={0.3}
        roughness={0.6}
        side={2} // DoubleSide pour voir l'intérieur
      />
    </mesh>
  )
}
