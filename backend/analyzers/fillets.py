"""
Analyseur de congés / rayons de raccordement (Fillet/Radius Analysis).

RÈGLE DE CONCEPTION GÉNÉRALE (tous procédés de fabrication) :
----------------------------------------------------------
Les angles VIFS (arêtes sans rayon de raccordement) créent des
CONCENTRATIONS DE CONTRAINTES dans la pièce. Sous charge mécanique,
thermique ou vibratoire, ces zones sont les premiers points de
défaillance.

Procédés concernés :
- Injection plastique : les angles vifs gênent l'écoulement de la matière
- Usinage CNC : nécessite un rayon d'outil minimum
- Fonderie : les coins vifs créent des retassures et des contraintes
- Impression 3D FDM : fragilité mécanique aux jonctions de couches
- Fabrication additive métal : distorsion thermique aux angles vifs

Seuil recommandé :
- Rayon minimum universel : 2-3 mm (ou 0.5× épaisseur de paroi)
- Angle intérieur maximum recommandé : 135° (coin "doux")
- En dessous de 135° → concentration de contraintes

Algorithme :
-----------
1. Pour chaque arête adjacente à 2 faces, calculer l'angle dièdre
2. Déterminer si l'arête est convexe (coin externe) ou concave (entaille)
3. Calculer l'angle du coin (= angle de la matière à cette arête)
4. Si l'angle < 135° → concentration de contraintes
5. Regrouper les arêtes connexes en "zones de concentration"
"""

import numpy as np
import trimesh
from collections import defaultdict, deque

# Angle intérieur maximal recommandé (en degrés)
# Un angle est "vif" si l'angle intérieur de la matière < ce seuil
# 180° = surface plane, 90° = coin droit, < 90° = très vif
MAX_RECOMMENDED_ANGLE = 135.0


def _compute_sharp_angle(
    n1: np.ndarray,
    n2: np.ndarray,
) -> float:
    """
    Calcule l'angle "vif" à l'intersection de deux faces adjacentes.

    Quel que soit le type de coin (convexe ou concave), l'angle vif
    mesure à quel point la surface change brusquement de direction.
    Plus l'angle vif est petit, plus la concentration de contraintes
    est sévère.

    Formule :
      angle_entre_normales = arccos(dot(n1, n2))
      angle_vif = 180° - angle_entre_normales

    Exemples :
      - Surface plane : angle_entre = 0°, angle_vif = 180° (pas vif)
      - Coin droit :    angle_entre = 90°, angle_vif = 90° (vif)
      - Coin très vif : angle_entre = 150°, angle_vif = 30° (très vif)
      - Repli 180° :    angle_entre = 180°, angle_vif = 0° (dégénéré)

    Note : Contrairement à une approche par classification convex/concave
    (qui nécessite la direction d'arête), cette méthode est stable et
    ne dépend pas de l'orientation des sommets dans le mesh.

    Args:
        n1: Normale de la face 1 (vecteur unitaire)
        n2: Normale de la face 2 (vecteur unitaire)

    Returns:
        Angle vif en degrés (0-180°)
    """
    cos_angle = float(np.clip(np.dot(n1, n2), -1.0, 1.0))
    angle_between = float(np.degrees(np.arccos(cos_angle)))
    return 180.0 - angle_between


def detect_sharp_corners(
    mesh: trimesh.Trimesh,
    max_angle_deg: float = MAX_RECOMMENDED_ANGLE,
) -> list[dict]:
    """
    Détecte les angles vifs (concentrations de contraintes) dans le mesh.

    L'analyse est indépendante du procédé de fabrication — elle détecte
    toute arête où la surface change brusquement de direction, créant
    une zone de concentration de contraintes potentielle.

    Args:
        mesh: Le mesh trimesh à analyser
        max_angle_deg: Angle intérieur max. considéré comme "vif"
                       (défaut: 135°). Plus petit = détecte moins d'angles.
                       Ex: 150° = très conservateur, 120° = strict

    Returns:
        Liste de dictionnaires décrivant chaque zone problématique
    """
    problems = []
    num_faces = len(mesh.faces)

    if num_faces == 0:
        return problems

    vertices = mesh.vertices
    face_normals = mesh.face_normals

    # Récupération des adjacences entre faces
    adjacency = mesh.face_adjacency          # (N, 2) paires d'indices de faces
    adj_edges = mesh.face_adjacency_edges     # (N, 2, 3) paires de sommets par arête
    adj_angles = mesh.face_adjacency_angles   # (N,) angle entre normales (radians)

    if len(adjacency) == 0:
        return problems

    # Analyse de chaque arête adjacente
    sharp_edge_info = []  # infos sur chaque arête problématique

    for i in range(len(adjacency)):
        f1_idx, f2_idx = adjacency[i]

        # Normales des deux faces
        n1 = face_normals[int(f1_idx)]
        n2 = face_normals[int(f2_idx)]

        # Sommets de l'arête (indices dans le tableau vertices)
        e1_idx, e2_idx = adj_edges[i]
        e1 = vertices[int(e1_idx)]
        e2 = vertices[int(e2_idx)]

        # Calcul de l'angle vif (indépendant de la convexité)
        sharp_angle = _compute_sharp_angle(n1, n2)

        # Seuil : si l'angle vif < max_angle_deg → concentration de contraintes
        # Ex: 90° est vif → flaggé. 150° est doux → pas flaggé.
        # On exclut aussi les angles < 5° (dégénérés / replis 180°)
        if 5.0 < sharp_angle < max_angle_deg:
            midpoint = (e1 + e2) / 2
            sharp_edge_info.append({
                'v1_idx': int(e1_idx),
                'v2_idx': int(e2_idx),
                'midpoint': midpoint,
                'sharp_angle': sharp_angle,
                'face_indices': [int(f1_idx), int(f2_idx)],
                'f1_idx': int(f1_idx),
                'f2_idx': int(f2_idx),
            })

    if not sharp_edge_info:
        return problems

    # ── Regroupement des arêtes connexes en zones ──
    # Principe : deux arêtes vives font partie du MÊME coin si
    # elles partagent un sommet. On utilise un parcours BFS
    # sur le graphe des arêtes pour trouver les composantes connexes.

    # Construire l'adjacence : pour chaque sommet, liste des arêtes incidentes
    vertex_to_edges = defaultdict(list)
    for i, info in enumerate(sharp_edge_info):
        vertex_to_edges[info['v1_idx']].append(i)
        vertex_to_edges[info['v2_idx']].append(i)

    # BFS pour trouver les clusters d'arêtes connexes
    visited = set()
    edge_clusters = []

    for i in range(len(sharp_edge_info)):
        if i in visited:
            continue

        # BFS à partir de cette arête
        cluster = []
        queue = deque([i])
        visited.add(i)

        while queue:
            current = queue.popleft()
            cluster.append(current)

            # Voisins via les deux sommets de l'arête courante
            cur_v1 = sharp_edge_info[current]['v1_idx']
            cur_v2 = sharp_edge_info[current]['v2_idx']

            for v in (cur_v1, cur_v2):
                for neighbor_idx in vertex_to_edges[v]:
                    if neighbor_idx not in visited:
                        visited.add(neighbor_idx)
                        queue.append(neighbor_idx)

        edge_clusters.append(cluster)

    # ── Création d'un problème par cluster ──
    for cluster in edge_clusters:
        cluster_edges = [sharp_edge_info[i] for i in cluster]

        cluster_angles = [e['sharp_angle'] for e in cluster_edges]
        min_angle = float(np.min(cluster_angles))
        avg_angle = float(np.mean(cluster_angles))

        # Centre du cluster = moyenne des midpoints
        cluster_midpoints = np.array([e['midpoint'] for e in cluster_edges])
        cluster_center = cluster_midpoints.mean(axis=0)

        # Faces uniques du cluster
        cluster_faces = set()
        for e in cluster_edges:
            cluster_faces.add(e['f1_idx'])
            cluster_faces.add(e['f2_idx'])
        cluster_faces = sorted(cluster_faces)

        if len(cluster_faces) > 500:
            cluster_faces = cluster_faces[:500]

        # Sévérité
        if min_angle < 60:
            severity = "high"
        elif min_angle < 100:
            severity = "medium"
        else:
            severity = "low"

        # Description selon le nombre d'arêtes dans le cluster
        if len(cluster_edges) >= 3:
            # 3+ arêtes = un vrai coin 3D (intersection de 3+ faces)
            corner_desc = f"Zone de concentration de contraintes : {len(cluster_edges)} arêtes vives convergentes"
        elif len(cluster_edges) == 2:
            corner_desc = f"Coin vif : 3 faces convergent à {min_angle:.0f}°"
        else:
            corner_desc = f"Arête vive isolée à {min_angle:.0f}°"

        problems.append({
            "type": "sharp_corner",
            "severity": severity,
            "face_indices": cluster_faces,
            "location": {
                "x": float(cluster_center[0]),
                "y": float(cluster_center[1]),
                "z": float(cluster_center[2]),
            },
            "description": (
                f"{corner_desc}. "
                f"Angle minimum : {min_angle:.0f}° "
                f"(seuil recommandé : {max_angle_deg}° max). "
                f"Les angles vifs créent des points de fragilité "
                f"quel que soit le procédé de fabrication."
            ),
            "suggestion": (
                f"Ajoute un congé de raccordement (rayon 2-3 mm minimum) "
                f"sur cette arête. En CFAO, utilise l'outil 'Fillet' "
                f"ou 'Round'. Un rayon de 0.5 mm améliore déjà "
                f"significativement la résistance mécanique."
            ),
            "details": {
                "num_sharp_edges": int(len(cluster_edges)),
                "min_sharp_angle_deg": float(round(min_angle, 1)),
                "avg_sharp_angle_deg": float(round(avg_angle, 1)),
                "max_recommended_angle_deg": max_angle_deg,
            },
        })

    # Tri final : problèmes les plus sévères en premier
    severity_order = {"high": 0, "medium": 1, "low": 2}
    problems.sort(key=lambda p: severity_order.get(p["severity"], 3))

    return problems
