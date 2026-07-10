"""
Tests unitaires pour l'analyseur de congés / angles vifs (fillets).

Vérifie :
- La structure du retour
- La non-explosion sur des cas extrêmes
- Qu'un cube (angles droits 90°) détecte des coins vifs
- Qu'une sphère (pas d'angles vifs) n'en détecte pas
"""

import pytest
import trimesh
import numpy as np
from analyzers.fillets import detect_sharp_corners, _compute_sharp_angle, MAX_RECOMMENDED_ANGLE


class TestHelperFunctions:
    """Vérifie la fonction _compute_sharp_angle."""

    def test_sharp_angle_flat(self):
        """Surface plane → angle vif = 180°."""
        n1 = np.array([0.0, 0.0, 1.0])
        n2 = np.array([0.0, 0.0, 1.0])
        assert _compute_sharp_angle(n1, n2) == pytest.approx(180.0, abs=1.0)

    def test_sharp_angle_90deg(self):
        """Coin à 90° → angle vif = 90°."""
        n1 = np.array([1.0, 0.0, 0.0])
        n2 = np.array([0.0, 1.0, 0.0])
        assert _compute_sharp_angle(n1, n2) == pytest.approx(90.0, abs=1.0)

    def test_sharp_angle_concave(self):
        """Coin concave à 90° → angle vif = 90° (identique au convexe)."""
        n1 = np.array([-1.0, 0.0, 0.0])
        n2 = np.array([0.0, -1.0, 0.0])
        assert _compute_sharp_angle(n1, n2) == pytest.approx(90.0, abs=1.0)

    def test_sharp_angle_acute(self):
        """Coin très vif (30°) → angle vif = 30°."""
        n1 = np.array([1.0, 0.0, 0.0])
        # Pour un angle de 30° entre les faces: les normales sont à 150°,
        # soit n2 = (cos(150°), sin(150°), 0) = (-0.866, 0.5, 0)
        angle_rad = np.radians(150.0)
        n2 = np.array([np.cos(angle_rad), np.sin(angle_rad), 0.0])
        assert _compute_sharp_angle(n1, n2) == pytest.approx(30.0, abs=1.0)


class TestFunctionContract:
    """Vérifie que la fonction respecte son contrat."""

    def test_returns_list(self, mesh_thick_box):
        """Doit toujours retourner une liste."""
        result = detect_sharp_corners(mesh_thick_box)
        assert isinstance(result, list)

    def test_empty_mesh_returns_empty(self):
        """Mesh sans face → liste vide."""
        empty = trimesh.Trimesh(vertices=[], faces=[])
        result = detect_sharp_corners(empty)
        assert result == []

    def test_single_face_no_crash(self):
        """Un triangle seul ne doit pas faire planter."""
        verts = np.array([[0, 0, 0], [10, 0, 0], [5, 10, 0]])
        faces = np.array([[0, 1, 2]])
        mesh = trimesh.Trimesh(vertices=verts, faces=faces)
        result = detect_sharp_corners(mesh)
        assert isinstance(result, list)


class TestCubeSharpCorners:
    """Un cube 20×20×20 a des angles droits (90°) → coins vifs détectés."""

    def test_cube_has_sharp_corners(self, mesh_thick_box):
        """Les arrêtes d'un cube sont à 90° < 135° → détectées."""
        result = detect_sharp_corners(mesh_thick_box)
        assert len(result) > 0, (
            f"Un cube devrait avoir des coins vifs (90°). Résultat : {result}"
        )

    def test_cube_sharp_corner_type(self, mesh_thick_box):
        result = detect_sharp_corners(mesh_thick_box)
        if len(result) > 0:
            assert result[0]["type"] == "sharp_corner"


class TestSphereNoSharpCorners:
    """Une sphère n'a pas d'angles vifs (surface lisse)."""

    def test_sphere_no_sharp_corners(self):
        """Sphère subdivisée → pas d'angles vifs."""
        sphere = trimesh.creation.icosphere(subdivisions=2)
        result = detect_sharp_corners(sphere)
        # Une sphère icosaédrique a des facettes, mais les angles
        # entre faces adjacentes sont > 135° (surface quasi-lisse)
        # Donc devrait retourner 0 ou très peu de problèmes
        assert len(result) == 0, (
            f"Une sphère subdivisée ne devrait pas avoir de coins vifs. "
            f"Résultat : {len(result)}"
        )


class TestCustomThreshold:
    """Vérifie que le seuil personnalisé fonctionne."""

    def test_low_threshold_finds_fewer(self, mesh_thick_box):
        """Seuil plus bas (120°) → moins de détections qu'à 150°."""
        result_strict = detect_sharp_corners(mesh_thick_box, max_angle_deg=120.0)
        result_loose = detect_sharp_corners(mesh_thick_box, max_angle_deg=150.0)
        # Plus le seuil est bas, moins on détecte de problèmes
        assert len(result_strict) <= len(result_loose) or len(result_strict) == 0


class TestProblemStructure:
    """Vérifie la structure du retour quand un problème est détecté."""

    def test_problem_has_required_fields(self, mesh_thick_box):
        """Chaque problème doit avoir tous les champs obligatoires."""
        result = detect_sharp_corners(mesh_thick_box)
        if len(result) > 0:
            p = result[0]
            assert p["type"] == "sharp_corner"
            assert p["severity"] in ("high", "medium", "low")
            assert isinstance(p["face_indices"], list)
            assert "x" in p["location"]
            assert "y" in p["location"]
            assert "z" in p["location"]
            assert isinstance(p["description"], str) and len(p["description"]) > 0
            assert isinstance(p["suggestion"], str) and len(p["suggestion"]) > 0
            assert "num_sharp_edges" in p["details"]
            assert "min_sharp_angle_deg" in p["details"]
            assert "avg_sharp_angle_deg" in p["details"]
            assert "max_recommended_angle_deg" in p["details"]
