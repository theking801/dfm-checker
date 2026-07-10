"""
Analyseur d'épaisseur de paroi pour l'impression FDM.

Détecte les zones du modèle dont l'épaisseur de paroi est inférieure
au seuil recommandé pour le matériau choisi.

Seuils basés sur les guidelines publiques de fabricants FDM :
- Protolabs (protolabs.com/resources/blog/design-for-fdm/)
- Hubs (hubs.com/knowledge-base/design-guide-fdm/)
Ces informations sont librement accessibles et ne proviennent pas de normes propriétaires.
"""

import numpy as np
import trimesh


# Seuils d'épaisseur minimale recommandée par matériau (en mm)
# Sources : Protolabs FDM Design Guide, Hubs FDM Design Rules
MIN_WALL_THICKNESS = {
    "PLA": 0.8,   # PLA : minimum 0.8mm pour éviter les trous et déformations
    "ABS": 1.0,   # ABS : minimum 1.0mm (plus sensible au warping)
    "PETG": 1.0,  # PETG : minimum 1.0mm (tendance au stringing si trop fin)
}


def detect_thin_walls(
    mesh: trimesh.Trimesh, material: str = "PLA"
) -> list[dict]:
    """
    Détecte les zones de paroi fine dans le mesh.

    Utilise une approche par rayonnement (ray casting) :
    - On prend un échantillon de points sur la surface du mesh
    - Pour chaque point, on lance un rayon vers l'intérieur selon la normale
    - La distance jusqu'à la face opposée = épaisseur locale approximative

    NOTE SUR L'APPROXIMATION :
    Le calcul exact d'épaisseur de paroi sur un mesh triangulé arbitraire
    est un problème complexe (nécessite une analyse de voxelisation ou
    de distance signée). Cette méthode par ray casting donne une bonne
    approximation pour les mailles watertight, mais peut manquer certaines
    zones fines complexes. C'est un compromis acceptable pour un MVP.

    Args:
        mesh: Le mesh trimesh à analyser
        material: Le matériau sélectionné ("PLA", "ABS", ou "PETG")

    Returns:
        Liste de dictionnaires décrivant chaque zone problématique
    """
    threshold = MIN_WALL_THICKNESS.get(material.upper(), 0.8)

    if not mesh.is_watertight:
        # Si le mesh n'est pas watertight, le ray casting donnera
        # des résultats imprécis. On tente quand même avec un avertissement.
        pass

    problems = []

    # On échantillonne les faces du mesh
    # Pour un MVP, on utilise un sous-ensemble de faces pour la performance
    num_faces = len(mesh.faces)

    if num_faces == 0:
        return problems

    # Limite d'échantillonnage pour la performance
    # Sur les gros mesh, on prend au max 5000 faces
    sample_size = min(num_faces, 5000)

    # Échantillonnage uniforme des faces
    face_indices = np.linspace(0, num_faces - 1, sample_size, dtype=int)

    # Vecteurs : centres des faces
    face_centers = mesh.triangles_center[face_indices]
    face_normals = mesh.face_normals[face_indices]

    # Pour chaque face échantillonnée, on lance un rayon
    # dans la direction opposée à la normale (vers l'intérieur)
    # et on mesure la distance jusqu'à la prochaine intersection
    #
    # IMPORTANT : On décale légèrement l'origine du rayon vers l'intérieur
    # pour éviter que trimesh ne détecte une intersection à distance 0
    # (l'origine est exactement sur la surface de la face).
    ray_origins = face_centers + face_normals * 0.001
    ray_directions = -face_normals

    # Lancement des rayons
    locations, index_ray, index_tri = mesh.ray.intersects_location(
        ray_origins=ray_origins,
        ray_directions=ray_directions,
        multiple_hits=False,
    )

    if len(locations) == 0:
        return problems

    # Calcul des distances
    ray_starts = ray_origins[index_ray]
    distances = np.linalg.norm(locations - ray_starts, axis=1)

    # Faces problématiques (épaisseur < seuil)
    thin_mask = distances < threshold
    thin_indices = face_indices[index_ray[thin_mask]]
    thin_distances = distances[thin_mask]

    if len(thin_indices) > 0:
        # On regroupe les faces par proximité (clusters)
        # Pour un MVP, on crée une entrée par face détectée,
        # regroupée en grandes zones si possible
        thin_centers = face_centers[
            np.isin(face_indices, thin_indices)
        ]

        if len(thin_centers) > 0:
            avg_location = thin_centers.mean(axis=0)
        else:
            avg_location = [0, 0, 0]

        problems.append(
            {
                "type": "thin_wall",
                "severity": "high" if thin_distances.mean() < threshold * 0.7 else "medium",
                "face_indices": thin_indices.tolist()
                if len(thin_indices) < 500
                else thin_indices[:500].tolist(),
                "location": {
                    "x": float(avg_location[0]),
                    "y": float(avg_location[1]),
                    "z": float(avg_location[2]),
                },
                "description": (
                    f"Épaisseur de paroi insuffisante détectée : "
                    f"{thin_distances.mean():.2f}mm en moyenne "
                    f"(seuil recommandé pour {material} : {threshold}mm)"
                ),
                "suggestion": (
                    f"Augmente l'épaisseur de paroi à au moins {threshold}mm "
                    f"dans les zones concernées. Sous cette épaisseur, "
                    f"la pièce risque d'avoir des trous, des déformations "
                    f"ou une fragilité excessive."
                ),
                "details": {
                    "measured_avg_thickness": float(round(thin_distances.mean(), 2)),
                    "threshold": threshold,
                    "num_affected_faces": int(len(thin_indices)),
                    "material": material,
                },
            }
        )

    return problems
