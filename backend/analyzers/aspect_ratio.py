"""
Analyseur de ratio hauteur/épaisseur pour l'impression FDM.

Détecte les éléments fins et hauts (type piliers, nervures, parois fines
très hautes) qui risquent de casser sous leur propre poids ou sous
contrainte mécanique.

Référence : Les règles de conception FDM recommandent un ratio
hauteur/largeur maximal de 10:1 pour les éléments verticaux isolés.
Au-delà, la pièce devient fragile et sensible aux vibrations de l'impression.
Sources : Protolabs Design Guidelines, expérience pratique des fabricants.
"""

import numpy as np
import trimesh


# Ratio hauteur/épaisseur maximal recommandé
# Source : guidelines empiriques FDM - ratio 10:1 pour éléments verticaux isolés
MAX_ASPECT_RATIO = 10.0


def _get_mesh_height(mesh: trimesh.Trimesh) -> float:
    """Calcule la hauteur totale du mesh sur l'axe Z."""
    bounds = mesh.bounds
    if bounds is not None:
        return float(bounds[1][2] - bounds[0][2])
    return 0.0


def _get_mesh_width(mesh: trimesh.Trimesh) -> float:
    """Calcule la largeur minimale (section XY) du mesh."""
    # On prend la plus petite dimension dans le plan XY comme estimation
    # de l'épaisseur caractéristique
    bounds = mesh.bounds
    if bounds is not None:
        x_size = bounds[1][0] - bounds[0][0]
        y_size = bounds[1][1] - bounds[0][1]
        return float(min(x_size, y_size))
    return 0.0


def detect_aspect_ratio_issues(
    mesh: trimesh.Trimesh,
) -> list[dict]:
    """
    Détecte les problèmes de ratio hauteur/épaisseur dans le mesh.

    NOTE SUR L'APPROXIMATION :
    Le calcul exact du ratio hauteur/épaisseur pour chaque élément
    individuel d'un mesh complexe nécessite une segmentation du mesh
    en composants distincts (analyse de clusters, squeletisation, etc.).
    Dans ce MVP, on utilise une approche simplifiée :

    1. Approche globale : on calcule le ratio hauteur/largeur de
       l'ensemble du mesh. Si le ratio global est > 10:1, tout
       le modèle est signalé comme potentiellement fragile.

    2. Approche par tranches (si le mesh est complexe) : on découpe
       le mesh en sections horizontales et on analyse le ratio de
       chaque section.

    Cette approche peut manquer des éléments fins individuels dans
    un mesh globalement trapu, mais donne une bonne indication pour
    les cas typiques de piliers et parois hautes.

    Args:
        mesh: Le mesh trimesh à analyser

    Returns:
        Liste de dictionnaires décrivant chaque zone problématique
    """
    problems = []
    num_faces = len(mesh.faces)

    if num_faces == 0:
        return problems

    height = _get_mesh_height(mesh)
    width = _get_mesh_width(mesh)

    if height == 0 or width == 0:
        return problems

    global_ratio = height / width

    if global_ratio > MAX_ASPECT_RATIO:
        # Le ratio global est risqué
        # On va analyser plus finement par tranches Z
        num_slices = min(10, max(3, int(height / 5)))
        z_levels = np.linspace(mesh.bounds[0][2], mesh.bounds[1][2], num_slices + 1)

        thin_sections = []
        for i in range(num_slices):
            z_min = z_levels[i]
            z_max = z_levels[i + 1]

            # On sélectionne les faces dans cette tranche Z
            face_centers = mesh.triangles_center
            z_mask = (face_centers[:, 2] >= z_min) & (face_centers[:, 2] < z_max)

            if z_mask.sum() == 0:
                continue

            # Pour cette section, on calcule la largeur moyenne
            section_centers = face_centers[z_mask]
            x_span = section_centers[:, 0].max() - section_centers[:, 0].min()
            y_span = section_centers[:, 1].max() - section_centers[:, 1].min()

            section_width = min(x_span, y_span) if min(x_span, y_span) > 0 else max(x_span, y_span)
            section_height = z_max - z_min

            if section_width > 0:
                section_ratio = section_height / section_width
                if section_ratio > MAX_ASPECT_RATIO:
                    section_center = section_centers.mean(axis=0)
                    thin_sections.append(
                        {
                            "z_level": float((z_min + z_max) / 2),
                            "ratio": float(section_ratio),
                            "location": {
                                "x": float(section_center[0]),
                                "y": float(section_center[1]),
                                "z": float(section_center[2]),
                            },
                            "face_indices": np.where(z_mask)[0].tolist(),
                        }
                    )

        if thin_sections:
            # On crée un problème pour la pire section
            worst = max(thin_sections, key=lambda s: s["ratio"])

            problems.append(
                {
                    "type": "aspect_ratio",
                    "severity": "high" if worst["ratio"] > 15 else "medium",
                    "face_indices": worst["face_indices"][:500]
                    if len(worst["face_indices"]) > 500
                    else worst["face_indices"],
                    "location": worst["location"],
                    "description": (
                        f"Élément élancé détecté : ratio hauteur/épaisseur de "
                        f"{worst['ratio']:.1f}:1 "
                        f"(seuil recommandé : {MAX_ASPECT_RATIO}:1 maximum). "
                        f"Ce type d'élément risque de se casser pendant "
                        f"l'impression ou l'utilisation."
                    ),
                    "suggestion": (
                        f"Augmente l'épaisseur de cet élément ou réduis sa hauteur "
                        f"pour atteindre un ratio inférieur à {MAX_ASPECT_RATIO}:1. "
                        f"Tu peux aussi ajouter des nervures de renfort ou "
                        f"augmenter le nombre de périmètres dans ton slicer."
                    ),
                    "details": {
                        "global_ratio": float(round(global_ratio, 1)),
                        "worst_section_ratio": float(round(worst["ratio"], 1)),
                        "max_recommended_ratio": MAX_ASPECT_RATIO,
                        "height_mm": float(round(height, 1)),
                        "width_mm": float(round(width, 1)),
                    },
                }
            )
        else:
            # Ratio global mauvais mais pas de section spécifique identifiée
            # On crée quand même un avertissement
            problems.append(
                {
                    "type": "aspect_ratio",
                    "severity": "low",
                    "face_indices": [],
                    "location": {
                        "x": 0,
                        "y": 0,
                        "z": float(height / 2),
                    },
                    "description": (
                        f"Le ratio hauteur/largeur global de la pièce est de "
                        f"{global_ratio:.1f}:1, ce qui dépasse la limite "
                        f"recommandée de {MAX_ASPECT_RATIO}:1. La pièce pourrait "
                        f"être fragile."
                    ),
                    "suggestion": (
                        "Envisage d'épaissir la base ou d'ajouter des renforts "
                        "pour améliorer la stabilité de la pièce."
                    ),
                    "details": {
                        "global_ratio": float(round(global_ratio, 1)),
                        "max_recommended_ratio": MAX_ASPECT_RATIO,
                        "height_mm": float(round(height, 1)),
                        "width_mm": float(round(width, 1)),
                    },
                }
            )

    return problems
