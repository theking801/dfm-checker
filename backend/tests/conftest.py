"""
Fixtures et helpers pour les tests des analyseurs DFM.

Utilise trimesh.creation pour générer des meshes de test avec
des propriétés connues (épaisseur de paroi, angle de surplomb,
ratio hauteur/largeur, etc.).
"""

import numpy as np
import trimesh
import pytest


# ──────────────────────────────────────────────
# Helpers : génération de meshes de test
# ──────────────────────────────────────────────

def thick_box() -> trimesh.Trimesh:
    """Cube 20×20×20 mm → paroi épaisse, pas de surplomb, ratio 1:1."""
    return trimesh.creation.box(extents=[20, 20, 20])


def thin_slab() -> trimesh.Trimesh:
    """
    Plaque fine 50×50×0.5 mm → paroi très fine (< 0.8mm PLA).
    Attention : trimesh.creation.box avec une dimension très petite
    peut ne pas donner des résultats exploitables pour le ray casting.
    On utilise plutôt une version plus réaliste.
    """
    return trimesh.creation.box(extents=[50, 50, 0.5])


def moderate_slab() -> trimesh.Trimesh:
    """Plaque 50×50×2.0 mm → épaisseur suffisante (2.0 > 0.8/1.0)."""
    return trimesh.creation.box(extents=[50, 50, 2.0])


def tall_column() -> trimesh.Trimesh:
    """Colonne fine et haute 5×5×100 mm → ratio hauteur/largeur = 100/5 = 20:1 > 10:1."""
    return trimesh.creation.box(extents=[5, 5, 100])


def short_column() -> trimesh.Trimesh:
    """Colonne trapue 5×5×20 mm → ratio 20/5 = 4:1 < 10:1, pas de problème."""
    return trimesh.creation.box(extents=[5, 5, 20])


def overhang_mesh(angle_deg: float = 60) -> trimesh.Trimesh:
    """
    Crée un mesh avec une face inclinée à l'angle donné (par défaut 60° > 45°).

    Construit un prisme triangulaire dont la face inclinée a l'angle
    spécifié par rapport à l'horizontale.

    Args:
        angle_deg: Angle d'inclinaison de la face en degrés (0 = verticale)

    Returns:
        Mesh avec une face inclinée de l'angle demandé
    """
    length = 30
    height = 20
    # Angle en radians, base de la face inclinée
    angle_rad = np.radians(angle_deg)
    overhang_x = height / np.tan(angle_rad) if angle_rad > 0.01 else 0

    # On crée un prisme : un triangle extrudé
    vertices = np.array([
        [0, 0, 0],           # 0: base avant gauche
        [0, length, 0],      # 1: base arrière gauche
        [overhang_x, 0, height],   # 2: sommet avant droit
        [overhang_x, length, height],  # 3: sommet arrière droit
        [-5, 0, 0],          # 4: extension base avant (pour rendre watertight)
        [-5, length, 0],     # 5: extension base arrière
    ])

    faces = np.array([
        [0, 1, 3],  # face inclinée (overhang)
        [0, 3, 2],
        [0, 1, 5],  # base
        [0, 5, 4],
        [1, 3, 5],  # côté arrière
        [3, 5, 1],  # corrigé winding
        [0, 2, 4],  # côté avant
        [2, 4, 0],  # corrigé winding
        [2, 3, 4],  # dessus
        [3, 4, 5],  # dessus
    ])

    mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=True)
    return mesh


def pyramid_with_overhangs() -> trimesh.Trimesh:
    """
    Pyramide à base carrée (20×20, hauteur 20).
    Les faces inclinées ont un angle de ~45° (arctan(10/10) = 45°).
    Certaines faces seront exactement à la limite.
    """
    vertices = np.array([
        [0, 0, 0],
        [20, 0, 0],
        [20, 20, 0],
        [0, 20, 0],
        [10, 10, 20],  # sommet
    ])

    faces = np.array([
        [0, 1, 4],  # face avant
        [1, 2, 4],  # face droite
        [2, 3, 4],  # face arrière
        [3, 0, 4],  # face gauche
        [0, 1, 2],  # base
        [0, 2, 3],
    ])

    return trimesh.Trimesh(vertices=vertices, faces=faces, process=True)


def steep_pyramid() -> trimesh.Trimesh:
    """
    Pyramide très pentue (base 40×40, hauteur 60).
    Les faces inclinées ont un angle de ~71.6° — bien au-dessus du seuil de 45°.
    """
    vertices = np.array([
        [0, 0, 0],
        [40, 0, 0],
        [40, 40, 0],
        [0, 40, 0],
        [20, 20, 60],  # sommet haut
    ])

    faces = np.array([
        [0, 1, 4],
        [1, 2, 4],
        [2, 3, 4],
        [3, 0, 4],
        [0, 1, 2],
        [0, 2, 3],
    ])

    return trimesh.Trimesh(vertices=vertices, faces=faces, process=True)


# ──────────────────────────────────────────────
# Fixtures pytest
# ──────────────────────────────────────────────

@pytest.fixture
def mesh_thick_box():
    return thick_box()


@pytest.fixture
def mesh_moderate_slab():
    return moderate_slab()


@pytest.fixture
def mesh_thin_slab():
    return thin_slab()


@pytest.fixture
def mesh_tall_column():
    return tall_column()


@pytest.fixture
def mesh_short_column():
    return short_column()


@pytest.fixture
def mesh_overhang_60():
    return overhang_mesh(60)


@pytest.fixture
def mesh_overhang_30():
    return overhang_mesh(30)


@pytest.fixture
def mesh_pyramid():
    return pyramid_with_overhangs()


@pytest.fixture
def mesh_steep_pyramid():
    return steep_pyramid()
