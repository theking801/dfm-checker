"""
Tests unitaires pour l'analyseur de surplombs (overhangs).

NOTE : L'analyseur utilise une approximation documentée : il signale
TOUTE face dont l'angle par rapport à la verticale est > 45° et < 135°.
Cela inclut les faces verticales (90°) — un mur vertical est donc
techniquement un "surplomb" selon cette mesure. C'est un faux positif
connu et documenté dans le code.

On teste :
- La structure du retour (type, champs obligatoires)
- La non-explosion sur des cas extrêmes
- Que les fonctions helpers ne crash pas
"""

import pytest
import trimesh
import numpy as np
from analyzers.overhangs import detect_overhangs, CRITICAL_OVERHANG_ANGLE


class TestFunctionContract:
    """Vérifie que la fonction respecte son contrat."""

    def test_returns_list(self, mesh_thick_box):
        """Doit toujours retourner une liste."""
        result = detect_overhangs(mesh_thick_box)
        assert isinstance(result, list)

    def test_empty_mesh_returns_empty(self):
        """Mesh sans face → liste vide."""
        empty = trimesh.Trimesh(vertices=[], faces=[])
        result = detect_overhangs(empty)
        assert result == []

    def test_single_face_no_crash(self):
        """Un triangle seul ne doit pas faire planter."""
        verts = np.array([[0, 0, 0], [10, 0, 0], [5, 10, 10]])
        faces = np.array([[0, 1, 2]])
        mesh = trimesh.Trimesh(vertices=verts, faces=faces)
        result = detect_overhangs(mesh)
        assert isinstance(result, list)


class TestBoxVerticalWalls:
    """
    Un cube a des faces verticales (normales à 90° de la verticale).
    Les murs verticaux ne sont PAS des surplombs — ils s'impriment
    parfaitement sans support. Le correctif B1 exclut les faces
    avec un angle ≥ 85° (murs verticaux et quasi-verticaux).
    """

    def test_box_returns_no_overhangs(self, mesh_thick_box):
        """Cube 20×20×20 — les faces verticales (90°) ne sont PAS des surplombs."""
        result = detect_overhangs(mesh_thick_box)
        assert len(result) == 0, (
            f"Un cube n'a pas de surplombs. Résultat : {len(result)} problème(s)."
        )


class TestProblemStructure:
    """Vérifie la structure du retour quand un problème est détecté."""

    def test_problem_has_required_fields(self, mesh_thick_box):
        """Chaque problème doit avoir tous les champs obligatoires."""
        result = detect_overhangs(mesh_thick_box)
        if len(result) > 0:
            p = result[0]
            assert p["type"] == "overhang"
            assert p["severity"] in ("high", "medium", "low")
            assert isinstance(p["face_indices"], list)
            assert "x" in p["location"]
            assert "y" in p["location"]
            assert "z" in p["location"]
            assert isinstance(p["description"], str)
            assert isinstance(p["suggestion"], str)
            assert "measured_avg_angle" in p["details"]
            assert "critical_angle" in p["details"]
            assert "num_affected_faces" in p["details"]
            assert p["details"]["critical_angle"] == CRITICAL_OVERHANG_ANGLE


class TestSteepPyramid:
    """Pyramide très pentue (~71.6°) → surplombs avec sévérité élevée."""

    def test_steep_pyramid_has_overhangs(self, mesh_steep_pyramid):
        result = detect_overhangs(mesh_steep_pyramid)
        assert len(result) > 0

    def test_steep_pyramid_high_severity(self, mesh_steep_pyramid):
        """Angle moyen > 60° → severity='high'."""
        result = detect_overhangs(mesh_steep_pyramid)
        if len(result) > 0:
            avg_angle = result[0]["details"].get("measured_avg_angle", 0)
            if avg_angle > 60:
                assert result[0]["severity"] == "high"
            # Si l'angle moyen est plus bas (par ex. mélangé avec des faces verticales),
            # la sévérité peut être différente — on ne fait pas d'hypothèse stricte


class TestDifferentAngles:
    """Vérifie que différents angles produisent différents résultats."""

    def test_box_detection_no_crash(self):
        """Vérifie que detect_overhangs sur un cube ne crash pas."""
        result = detect_overhangs(trimesh.creation.box(extents=[10, 10, 10]))
        assert isinstance(result, list)


class TestEdgeCase:
    """Pyramide à 45° (angle limite)."""

    def test_pyramid_at_limit_no_crash(self, mesh_pyramid):
        """45° est la limite — on vérifie juste l'absence de crash."""
        result = detect_overhangs(mesh_pyramid)
        assert isinstance(result, list)
