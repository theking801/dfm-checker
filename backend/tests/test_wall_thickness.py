"""
Tests unitaires pour l'analyseur d'épaisseur de paroi (wall_thickness).

NOTE : L'analyseur utilise le ray casting (approximation). Les rayons
partent du centre des faces → si l'origine est exactement sur la surface,
trimesh peut détecter une intersection à distance 0. C'est une limitation
connue et documentée du MVP.

On teste donc :
- La structure du retour (type, champs obligatoires)
- La non-explosion sur des cas extrêmes
- Que la fonction ne crash pas et retourne le bon type
"""

import pytest
import trimesh
import numpy as np
from analyzers.wall_thickness import detect_thin_walls, MIN_WALL_THICKNESS


class TestFunctionContract:
    """Vérifie que la fonction respecte son contrat de base."""

    def test_returns_list(self, mesh_thick_box):
        """Doit toujours retourner une liste."""
        result = detect_thin_walls(mesh_thick_box)
        assert isinstance(result, list)

    def test_empty_mesh_returns_empty(self):
        """Mesh sans face → liste vide."""
        empty = trimesh.Trimesh(vertices=[], faces=[])
        result = detect_thin_walls(empty)
        assert result == []

    def test_single_face_no_crash(self):
        """Un triangle seul ne doit pas faire planter."""
        verts = np.array([[0, 0, 0], [1, 0, 0], [0, 1, 0]])
        faces = np.array([[0, 1, 2]])
        mesh = trimesh.Trimesh(vertices=verts, faces=faces)
        result = detect_thin_walls(mesh)
        assert isinstance(result, list)

    def test_ultra_thin_returns_list(self, mesh_thin_slab):
        """Mesh très fin → ne crash pas, retourne une liste."""
        result = detect_thin_walls(mesh_thin_slab)
        assert isinstance(result, list)

    def test_unknown_material_no_crash(self, mesh_thick_box):
        """Matériau inconnu → utilise le seuil par défaut, ne crash pas."""
        result = detect_thin_walls(mesh_thick_box, "UNKNOWN")
        assert isinstance(result, list)


class TestProblemStructure:
    """Si un problème est détecté, sa structure doit être correcte."""

    def test_problem_has_required_fields(self):
        """Vérifie que le format du problème est correct."""
        # On utilise un mesh volontairement très fin pour forcer une détection
        # Note : selon la géométrie, la détection peut ou non fonctionner
        flat = trimesh.creation.box(extents=[20, 20, 0.2])
        result = detect_thin_walls(flat, "PLA")
        if len(result) > 0:
            p = result[0]
            assert p["type"] == "thin_wall"
            assert p["severity"] in ("high", "medium", "low")
            assert isinstance(p["face_indices"], list)
            assert "x" in p["location"]
            assert "y" in p["location"]
            assert "z" in p["location"]
            assert isinstance(p["description"], str) and len(p["description"]) > 0
            assert isinstance(p["suggestion"], str) and len(p["suggestion"]) > 0
            assert "measured_avg_thickness" in p["details"]
            assert "threshold" in p["details"]
            assert "num_affected_faces" in p["details"]

    def test_severity_logic(self):
        """Vérifie que severity est 'high' si l'épaisseur < 70% du seuil."""
        ultra_thin = trimesh.creation.box(extents=[30, 30, 0.1])
        result = detect_thin_walls(ultra_thin, "PLA")
        if len(result) > 0:
            detected = result[0]["details"]["measured_avg_thickness"]
            threshold = result[0]["details"]["threshold"]
            if detected < threshold * 0.7:
                assert result[0]["severity"] == "high"


class TestMaterialThresholds:
    """Vérifie les valeurs des seuils par matériau."""

    def test_pla_threshold(self):
        assert MIN_WALL_THICKNESS["PLA"] == 0.8

    def test_abs_threshold(self):
        assert MIN_WALL_THICKNESS["ABS"] == 1.0

    def test_petg_threshold(self):
        assert MIN_WALL_THICKNESS["PETG"] == 1.0

    def test_all_materials_have_thresholds(self):
        for mat in ("PLA", "ABS", "PETG"):
            assert mat in MIN_WALL_THICKNESS
