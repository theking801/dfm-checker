"""
Analyseur de surplombs (overhangs) pour l'impression FDM.

Détecte les faces du modèle dont l'angle par rapport à la verticale
dépasse le seuil critique, indiquant un besoin de supports.

Référence : Les guidelines publiques de conception FDM indiquent qu'un
angle de surplomb > 45° sans support entraîne un affaissement de la matière.
Sources : Protolabs, Hubs, Simplify3D.
"""

import numpy as np
import trimesh


# Angle critique de surplomb (en degrés par rapport à la verticale)
# Au-delà de cet angle, le filament en surplomb s'affaisse sans support
# Source : Hubs FDM Design Guide - "Overhangs exceeding 45° require supports"
CRITICAL_OVERHANG_ANGLE = 45


def detect_overhangs(
    mesh: trimesh.Trimesh,
) -> list[dict]:
    """
    Détecte les faces en surplomb non supporté dans le mesh.

    Principe :
    1. Calculer l'angle entre chaque normale de face et la verticale (0,0,1)
    2. Une face est en surplomb si cet angle > 45°
    3. Optionnel : vérifier si la face a du support en dessous (pour V1,
       on considère que tout surplomb > 45° est problématique)

    NOTE SUR L'APPROXIMATION :
    La détection précise des surplombs nécessiterait une analyse de
    support (vérifier si une autre face est située sous la zone en
    surplomb). Dans ce MVP, on signale TOUT surplomb > 45°, ce qui
    peut inclure des zones qui seraient en fait soutenues par d'autres
    parties du modèle. Un affinement consisterait à lancer des rayons
    vers le bas pour vérifier la présence de matière support.

    Args:
        mesh: Le mesh trimesh à analyser

    Returns:
        Liste de dictionnaires décrivant chaque zone problématique
    """
    problems = []
    num_faces = len(mesh.faces)

    if num_faces == 0:
        return problems

    # Vecteur vertical (pointant vers le haut)
    # En STL standard, Z est la verticale
    vertical = np.array([0.0, 0.0, 1.0])

    # Calcul de l'angle entre chaque normale de face et la verticale
    # cos(angle) = dot(normal, vertical) / (||normal|| * ||vertical||)
    # Comme les deux sont normalisés, cos(angle) = dot(normal, vertical)
    dot_products = np.dot(mesh.face_normals, vertical)

    # L'angle est l'arccos du produit scalaire
    # On utilise clip pour éviter les erreurs numériques hors [-1, 1]
    dot_products = np.clip(dot_products, -1.0, 1.0)
    angles = np.degrees(np.arccos(dot_products))

    # NOTE : Un mur vertical a un angle de 90° (normale horizontale).
    # Un mur vertical n'est PAS un surplomb — c'est une paroi standard
    # qui s'imprime parfaitement sans support.
    #
    # Un vrai surplomb correspond à une face orientée vers le haut,
    # mais fortement inclinée. On définit le surplomb comme :
    #   - La normale pointe vers le HAUT (produit scalaire > 0)  => angle < 90°
    #   - Mais l'angle par rapport à la verticale dépasse le seuil => angle > 45°
    #
    # Ainsi, on exclut :
    #   - Les murs verticaux (angle ≈ 90°)
    #   - Les faces orientées vers le bas (angle > 90°)
    #
    # Seuil : angle > 45° ET angle < 90° (on exclut les parois verticales et les faces inférieures)
    overhang_mask = (angles > CRITICAL_OVERHANG_ANGLE) & (angles < 85)

    overhang_indices = np.where(overhang_mask)[0]

    if len(overhang_indices) > 0:
        # Calcul de la sévérité basée sur l'angle moyen
        avg_angle = angles[overhang_indices].mean()

        if avg_angle > 60:
            severity = "high"
        elif avg_angle > 50:
            severity = "medium"
        else:
            severity = "low"

        # Localisation approximative : centre de gravité des faces problématiques
        problem_centers = mesh.triangles_center[overhang_indices]
        avg_location = problem_centers.mean(axis=0)

        problems.append(
            {
                "type": "overhang",
                "severity": severity,
                "face_indices": overhang_indices.tolist()
                if len(overhang_indices) < 500
                else overhang_indices[:500].tolist(),
                "location": {
                    "x": float(avg_location[0]),
                    "y": float(avg_location[1]),
                    "z": float(avg_location[2]),
                },
                "description": (
                    f"Surplomb non supporté détecté : angle moyen de "
                    f"{avg_angle:.1f}° par rapport à la verticale "
                    f"(seuil critique : {CRITICAL_OVERHANG_ANGLE}°)"
                ),
                "suggestion": (
                    "Ajoute des supports sous cette zone dans ton slicer, "
                    "ou modifie le design pour réduire l'inclinaison à "
                    f"moins de {CRITICAL_OVERHANG_ANGLE}°. Sans support, "
                    "le filament s'affaissera et la qualité d'impression "
                    "sera dégradée."
                ),
                "details": {
                    "measured_avg_angle": float(round(avg_angle, 1)),
                    "critical_angle": CRITICAL_OVERHANG_ANGLE,
                    "num_affected_faces": int(len(overhang_indices)),
                },
            }
        )

    return problems
