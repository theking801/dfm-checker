"""
Tests unitaires pour l'analyseur de ratio hauteur/épaisseur (aspect_ratio).

Vérifie :
- La structure du retour
- Les fonctions helpers (_get_mesh_height, _get_mesh_width)
- La non-explosion sur des cas extrêmes
- Qu'un mesh très élancé est détecté
"""

import pytest
import trimesh
import numpy as np
from analyzers.aspect_ratio import (
    detect_aspect_ratio_issues,
    _get_mesh_height,
    _get_mesh_width,
    MAX_ASPECT_RATIO,
)


class TestFunctionContract:
    """Vérifie que la fonction respecte son contrat."""

    def test_returns_list(self, mesh_thick_box):
        """Doit toujours retourner une liste."""
        result = detect_aspect_ratio_issues(mesh_thick_box)
        assert isinstance(result, list)

    def test_empty_mesh_returns_empty(self):
        """Mesh sans face → liste vide."""
        empty = trimesh.Trimesh(vertices=[], faces=[])
        result = detect_aspect_ratio_issues(empty)
        assert result == []

    def test_single_face_no_crash(self):
        """Un triangle seul ne doit pas faire planter."""
        verts = np.array([[0, 0, 0], [10, 0, 0], [5, 10, 0]])
        faces = np.array([[0, 1, 2]])
        mesh = trimesh.Trimesh(vertices=verts, faces=faces)
        result = detect_aspect_ratio_issues(mesh)
        assert isinstance(result, list)

    def test_zero_width_no_crash(self):
        """Un mesh très plat ne doit pas faire planter."""
        verts = np.array([
            [0, 0, 0], [10, 0, 0], [10, 10, 0], [0, 10, 0],
            [0, 0, 0.1], [10, 0, 0.1], [10, 10, 0.1], [0, 10, 0.1],
        ])
        faces = np.array([
            [0, 1, 2], [0, 2, 3],
            [4, 5, 6], [4, 6, 7],
            [0, 1, 5], [0, 5, 4],
            [1, 2, 6], [1, 6, 5],
            [2, 3, 7], [2, 7, 6],
            [3, 0, 4], [3, 4, 7],
        ])
        mesh = trimesh.Trimesh(vertices=verts, faces=faces)
        result = detect_aspect_ratio_issues(mesh)
        assert isinstance(result, list)


class TestCubeNoIssues:
    """Cube 20×20×20 mm → ratio 1:1 < 10:1 → pas de problème."""

    def test_cube_has_no_issues(self, mesh_thick_box):
        """Ratio hauteur/largeur = 20/20 = 1:1 < 10:1."""
        result = detect_aspect_ratio_issues(mesh_thick_box)
        assert len(result) == 0, (
            f"Un cube (ratio 1:1) ne devrait pas avoir de problèmes. Résultat : {result}"
        )


class TestShortColumnNoIssues:
    """Colonne 5×5×20 → ratio 20/5 = 4:1 < 10:1 → pas de problème."""

    def test_short_column_no_issues(self, mesh_short_column):
        result = detect_aspect_ratio_issues(mesh_short_column)
        assert len(result) == 0, (
            f"Colonne 5×5×20 (ratio 4:1) ne devrait pas poser problème. Résultat : {result}"
        )


class TestTallColumnHasIssues:
    """Colonne 5×5×100 → ratio 100/5 = 20:1 > 10:1 → problème détecté."""

    def test_tall_column_has_issues(self, mesh_tall_column):
        """Ratio 20:1 > 10:1 → doit détecter un problème."""
        result = detect_aspect_ratio_issues(mesh_tall_column)
        assert len(result) > 0, (
            f"Colonne 5×5×100 (ratio 20:1) devrait avoir un problème. Résultat : {result}"
        )

    def test_tall_column_type(self, mesh_tall_column):
        result = detect_aspect_ratio_issues(mesh_tall_column)
        if len(result) > 0:
            assert result[0]["type"] == "aspect_ratio"

    def test_tall_column_details(self, mesh_tall_column):
        """Vérifie les champs de détails disponibles."""
        result = detect_aspect_ratio_issues(mesh_tall_column)
        assert len(result) > 0, "La colonne élancée doit déclencher une détection"
        details = result[0]["details"]
        # Champs obligatoires
        assert "global_ratio" in details
        assert "height_mm" in details
        assert "width_mm" in details
        assert details["max_recommended_ratio"] == MAX_ASPECT_RATIO
        # Valeurs attendues pour colonne 5×5×100
        assert details["global_ratio"] == pytest.approx(20.0, abs=5.0)
        assert details["height_mm"] == pytest.approx(100.0, abs=2.0)
        assert details["width_mm"] == pytest.approx(5.0, abs=1.0)
        # worst_section_ratio est optionnel (dépend de l'analyse par tranches)
        if "worst_section_ratio" in details:
            assert details["worst_section_ratio"] >= MAX_ASPECT_RATIO


class TestHelperFunctions:
    """Vérifie les fonctions helpers _get_mesh_height et _get_mesh_width."""

    def test_height_thick_box(self, mesh_thick_box):
        h = _get_mesh_height(mesh_thick_box)
        assert h == pytest.approx(20.0, abs=0.5)

    def test_width_thick_box(self, mesh_thick_box):
        w = _get_mesh_width(mesh_thick_box)
        assert w == pytest.approx(20.0, abs=0.5)

    def test_height_tall_column(self, mesh_tall_column):
        h = _get_mesh_height(mesh_tall_column)
        assert h == pytest.approx(100.0, abs=1.0)

    def test_width_tall_column(self, mesh_tall_column):
        w = _get_mesh_width(mesh_tall_column)
        assert w == pytest.approx(5.0, abs=0.5)

    def test_short_column_height(self, mesh_short_column):
        h = _get_mesh_height(mesh_short_column)
        assert h == pytest.approx(20.0, abs=0.5)

    def test_short_column_width(self, mesh_short_column):
        w = _get_mesh_width(mesh_short_column)
        assert w == pytest.approx(5.0, abs=0.5)


class TestProblemStructure:
    """Vérifie la structure du retour quand un problème est détecté."""

    def test_problem_has_required_fields(self, mesh_tall_column):
        result = detect_aspect_ratio_issues(mesh_tall_column)
        if len(result) > 0:
            p = result[0]
            assert p["type"] == "aspect_ratio"
            assert p["severity"] in ("high", "medium", "low")
            assert isinstance(p["face_indices"], list)
            assert "x" in p["location"]
            assert "y" in p["location"]
            assert "z" in p["location"]
            assert isinstance(p["description"], str) and len(p["description"]) > 0
            assert isinstance(p["suggestion"], str) and len(p["suggestion"]) > 0
            assert "details" in p
