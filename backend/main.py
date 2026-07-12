"""
DFM Checker - Backend API
==========================
Analyseur de fabricabilité pour impression 3D FDM.

Endpoints :
- GET  /               → informations de base
- GET  /health         → statut détaillé + version
- GET  /materials      → matériaux supportés et leurs seuils
- POST /analyze        → upload STL + analyse complète
- GET  /admin/dashboard → stats dashboard admin
- GET  /admin/errors    → liste des erreurs
- PATCH /admin/errors/{id} → toggle résolu
- GET  /admin/feedbacks → liste des feedbacks
- POST /admin/feedbacks → ajouter un feedback
- PATCH /admin/feedbacks/{id} → update statut

Utilisation :
    uvicorn main:app --reload --port 8000
"""

import logging
import os
import sys
import time
import tempfile
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Request, Query, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional

import trimesh

from analyzers.wall_thickness import detect_thin_walls
from analyzers.overhangs import detect_overhangs
from analyzers.aspect_ratio import detect_aspect_ratio_issues
from analyzers.fillets import detect_sharp_corners
from constants import SEVERITY_ORDER
import database as db

load_dotenv()

# ──────────────────────────────────────────────
# Admin Authentication
# ──────────────────────────────────────────────
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY")

async def verify_admin_key(x_admin_key: Optional[str] = Header(None)):
    """Verify admin API key from X-Admin-Key header."""
    if not ADMIN_API_KEY:
        raise HTTPException(status_code=503, detail="Admin API key not configured")
    if x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Invalid admin API key")
    return True

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s | %(levelname)-7s | %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("dfm-checker")

# ──────────────────────────────────────────────
# App
# ──────────────────────────────────────────────
app = FastAPI(
    title="DFM Checker API",
    description="Design for Manufacturing Checker — Analyse la fabricabilité de fichiers STL pour l'impression FDM.",
    version="1.0.0",
)

# ──────────────────────────────────────────────
# CORS
# ──────────────────────────────────────────────
# CORS — restrict to known origins
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",") if os.getenv("CORS_ORIGINS") else [
    "https://dfm-checker.vercel.app",
    "http://localhost:5173",  # Vite dev server
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Configuration
# ──────────────────────────────────────────────
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE_MB", 50)) * 1024 * 1024

MATERIAL_INFO = {
    "PLA": {
        "name": "PLA (acide polylactique)",
        "min_wall_mm": 0.8,
        "max_temp_c": 220,
        "bed_temp_c": 60,
        "recommended": True,
    },
    "ABS": {
        "name": "ABS (acrylonitrile butadiène styrène)",
        "min_wall_mm": 1.0,
        "max_temp_c": 250,
        "bed_temp_c": 110,
        "recommended": True,
    },
    "PETG": {
        "name": "PETG (polyéthylène téréphtalate glycol)",
        "min_wall_mm": 1.0,
        "max_temp_c": 240,
        "bed_temp_c": 80,
        "recommended": True,
    },
}

# Dérivé automatiquement des clés de MATERIAL_INFO — pas de duplication
SUPPORTED_MATERIALS = list(MATERIAL_INFO.keys())
DEFAULT_MATERIAL = "PLA"

# Seuils dérivés pour éviter la duplication des valeurs d'épaisseur
MATERIAL_THRESHOLDS = {
    "min_wall_thickness_mm": {
        mat: info["min_wall_mm"] for mat, info in MATERIAL_INFO.items()
    },
    "max_overhang_angle_deg": 45,
    "max_aspect_ratio": 10.0,
    "max_sharp_angle_deg": 135.0,
}


# ──────────────────────────────────────────────
# Modèles Pydantic
# ──────────────────────────────────────────────

class FeedbackCreate(BaseModel):
    message: str
    email: str = ""

class FeedbackStatusUpdate(BaseModel):
    status: str  # 'new', 'read', 'archived'

class SessionUpdate(BaseModel):
    session_id: str
    uploaded: bool = False
    completed: bool = False

class SessionTimeUpdate(BaseModel):
    session_id: str
    time_sec: int


# ──────────────────────────────────────────────
# Middleware : requête → log + timing
# ──────────────────────────────────────────────
@app.middleware("http")
async def log_requests_and_add_headers(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s → %s (%.0fms)",
        request.method,
        request.url.path,
        response.status_code,
        elapsed,
    )
    # Security Headers — no CSP on API (blocks cross-origin fetch)
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────

@app.get("/")
async def root():
    """Health check rapide."""
    return {
        "name": "DFM Checker API",
        "version": "1.0.0",
        "status": "running",
        "supported_materials": SUPPORTED_MATERIALS,
    }


@app.get("/health")
async def health_detailed():
    """Statut détaillé de l'API (pour le frontend)."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "uptime_hours": None,  # facultatif : à implémenter avec un start_time global
        "max_file_size_mb": MAX_FILE_SIZE // (1024 * 1024),
        "supported_materials": SUPPORTED_MATERIALS,
        "environment": {
            "python": sys.version,
            "trimesh": trimesh.__version__,
        },
    }


@app.get("/materials")
async def get_materials():
    """Retourne la liste des matériaux supportés et leurs seuils."""
    return {
        "materials": SUPPORTED_MATERIALS,
        "default": DEFAULT_MATERIAL,
        "thresholds": MATERIAL_THRESHOLDS,
        "details": MATERIAL_INFO,
    }


@app.post("/analyze")
async def analyze_stl(
    file: UploadFile = File(...),
    material: str = Form(default=DEFAULT_MATERIAL),
):
    """
    Analyse un fichier STL pour détecter les problèmes de fabricabilité.

    Paramètres :
    - file     : fichier STL à analyser (binaire ou ASCII)
    - material : matériau sélectionné ("PLA", "ABS", ou "PETG")

    Retourne un rapport JSON complet.
    """
    material_upper = material.upper()
    content = bytearray()  # initialisé tôt pour le except

    # ── Validation matériau ──
    if material_upper not in SUPPORTED_MATERIALS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Matériau non supporté : {material}. "
                f"Supportés : {', '.join(SUPPORTED_MATERIALS)}"
            ),
        )

    # ── Validation fichier ──
    if not file.filename:
        raise HTTPException(status_code=400, detail="Nom de fichier manquant.")

    # Sanitize filename to prevent log injection
    clean_filename = "".join(c for c in file.filename if c.isprintable() and c not in "\r\n")

    if not clean_filename.lower().endswith(".stl"):
        raise HTTPException(
            status_code=400,
            detail="Le fichier doit être au format STL (.stl).",
        )

    # ── Check size before reading (FastAPI / Starlette handles size property) ──
    if file.size is not None and file.size > MAX_FILE_SIZE:
        max_mb = MAX_FILE_SIZE // (1024 * 1024)
        raise HTTPException(
            status_code=413,
            detail=f"Fichier trop volumineux. Taille max : {max_mb} Mo.",
        )

    # ── Read file in chunks to prevent memory exhaustion (DoS) ──
    content = bytearray()
    chunk_size = 1024 * 1024  # 1 MB chunks
    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        content.extend(chunk)
        if len(content) > MAX_FILE_SIZE:
            max_mb = MAX_FILE_SIZE // (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"Fichier trop volumineux. Taille max : {max_mb} Mo.",
            )

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Fichier vide.")

    # ── Vérification rapide : signature STL ──
    is_binary_stl = len(content) > 80 and content[:5] != b"solid"
    is_ascii_stl = content[:5].lower() == b"solid"

    if not is_binary_stl and not is_ascii_stl:
        raise HTTPException(
            status_code=400,
            detail=(
                "Le fichier ne semble pas être un STL valide. "
                "Les fichiers STL commencent par 'solid' (ASCII) "
                "ou ont un en-tête binaire de 80 octets."
            ),
        )

    logger.info(
        "Analyse de %s (%.1f KB, %s) — matériau : %s",
        clean_filename,
        len(content) / 1024,
        "binaire" if is_binary_stl else "ASCII",
        material_upper,
    )

    # ── Traitement ──
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".stl", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name

        # Chargement du mesh
        loaded = trimesh.load(tmp_path)
        mesh = None

        if isinstance(loaded, trimesh.Trimesh):
            mesh = loaded
        elif isinstance(loaded, trimesh.Scene):
            meshes = list(loaded.geometry.values())
            if meshes:
                mesh = meshes[0]
            else:
                raise HTTPException(
                    status_code=400,
                    detail="Le fichier STL ne contient aucun mesh valide.",
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="Format de fichier STL non reconnu.",
            )

        if len(mesh.faces) == 0:
            raise HTTPException(
                status_code=400,
                detail="Le mesh ne contient aucune face.",
            )

        # Analyses
        problems = []
        problems.extend(detect_thin_walls(mesh, material_upper))
        problems.extend(detect_overhangs(mesh))
        problems.extend(detect_aspect_ratio_issues(mesh))
        problems.extend(detect_sharp_corners(mesh))

        # Tri par sévérité
        problems.sort(key=lambda p: SEVERITY_ORDER.get(p["severity"], 3))

        # Statistiques
        stats = {
            "num_faces": int(len(mesh.faces)),
            "num_vertices": int(len(mesh.vertices)),
            "is_watertight": bool(mesh.is_watertight),
            "volume_mm3": (
                float(round(mesh.volume, 2)) if mesh.is_watertight else None
            ),
            "bounding_box": {
                "x": float(round(mesh.bounds[1][0] - mesh.bounds[0][0], 2)),
                "y": float(round(mesh.bounds[1][1] - mesh.bounds[0][1], 2)),
                "z": float(round(mesh.bounds[1][2] - mesh.bounds[0][2], 2)),
            },
        }

        result = {
            "material": material_upper,
            "thresholds": MATERIAL_THRESHOLDS,
            "problems": problems,
            "stats": stats,
            "summary": {
                "total_problems": len(problems),
                "high_severity": len([p for p in problems if p["severity"] == "high"]),
                "medium_severity": len([p for p in problems if p["severity"] == "medium"]),
                "low_severity": len([p for p in problems if p["severity"] == "low"]),
            },
        }

        logger.info(
            "Analyse terminée : %d problèmes (H:%d M:%d L:%d)",
            result["summary"]["total_problems"],
            result["summary"]["high_severity"],
            result["summary"]["medium_severity"],
            result["summary"]["low_severity"],
        )

        # ── Log analytics ──
        try:
            db.log_analysis(
                material=material_upper,
                problems_count=result["summary"]["total_problems"],
                high_count=result["summary"]["high_severity"],
                medium_count=result["summary"]["medium_severity"],
                low_count=result["summary"]["low_severity"],
                file_size_kb=len(content) / 1024,
            )
        except Exception as db_err:
            logger.warning("Erreur log analytics: %s", db_err)

        return JSONResponse(content=result)

    except HTTPException as http_err:
        # Log l'erreur dans la base
        try:
            db.log_error(
                type="api",
                message=f"Erreur validation: {clean_filename}",
                details=f"{len(content)/1024:.1f} KB - {material_upper}",
                severity="medium" if http_err.status_code == 400 else "high",
            )
        except Exception:
            pass
        raise
    except Exception as e:
        logger.exception("Erreur lors de l'analyse de %s", clean_filename)
        # Log l'erreur dans la base
        try:
            db.log_analysis(
                material=material_upper,
                problems_count=0, high_count=0, medium_count=0, low_count=0,
                error=True, error_msg=str(e)[:200],
                file_size_kb=len(content) / 1024 if content else 0,
            )
            db.log_error(
                type="analysis",
                message=f"Analyse échouée: {clean_filename}",
                details=str(e)[:300],
                severity="high",
            )
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail="Erreur interne lors de l'analyse du fichier STL.",
        )
    finally:
        if tmp_path:
            try:
                Path(tmp_path).unlink(missing_ok=True)
            except Exception:
                pass


# ──────────────────────────────────────────────
# Admin Endpoints
# ──────────────────────────────────────────────

@app.get("/admin/dashboard")
async def admin_dashboard(_: bool = Depends(verify_admin_key)):
    """Retourne les statistiques pour le dashboard admin."""
    try:
        return db.get_dashboard_stats()
    except Exception as e:
        logger.exception("Erreur dashboard admin")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/admin/errors")
async def admin_errors(
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0),
    _: bool = Depends(verify_admin_key),
):
    """Retourne les erreurs avec filtres optionnels."""
    try:
        return db.get_errors(severity=severity, resolved=resolved, limit=limit, offset=offset)
    except Exception as e:
        logger.exception("Erreur récupération erreurs")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.patch("/admin/errors/{error_id}")
async def admin_toggle_error(error_id: int, _: bool = Depends(verify_admin_key)):
    """Toggle le statut résolu d'une erreur."""
    try:
        db.toggle_error_resolved(error_id)
        return {"ok": True}
    except Exception as e:
        logger.exception("Erreur toggle erreur")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/admin/feedbacks")
async def admin_feedbacks(_: bool = Depends(verify_admin_key)):
    """Retourne tous les feedbacks."""
    try:
        feedbacks = db.get_feedbacks()
        return {"feedbacks": feedbacks}
    except Exception as e:
        logger.exception("Erreur récupération feedbacks")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/admin/feedbacks")
async def admin_add_feedback(fb: FeedbackCreate):
    """Ajoute un nouveau feedback (depuis le frontend)."""
    if not fb.message.strip():
        raise HTTPException(status_code=400, detail="Message vide")
    if len(fb.message) > 1000:
        raise HTTPException(status_code=400, detail="Message too long (max 1000 characters)")
    if len(fb.email) > 255:
        raise HTTPException(status_code=400, detail="Email too long (max 255 characters)")
    try:
        fid = db.add_feedback(message=fb.message, email=fb.email)
        return {"id": fid, "ok": True}
    except Exception as e:
        logger.exception("Erreur ajout feedback")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.patch("/admin/feedbacks/{feedback_id}")
async def admin_update_feedback_status(feedback_id: int, update: FeedbackStatusUpdate, _: bool = Depends(verify_admin_key)):
    """Met à jour le statut d'un feedback (new/read/archived)."""
    if update.status not in ("new", "read", "archived"):
        raise HTTPException(status_code=400, detail="Statut invalide")
    try:
        db.update_feedback_status(feedback_id, update.status)
        return {"ok": True}
    except Exception as e:
        logger.exception("Erreur update feedback")
        raise HTTPException(status_code=500, detail="Internal server error")


# ──────────────────────────────────────────────
# Session Tracking Endpoints
# ──────────────────────────────────────────────

@app.post("/session/update")
async def session_update(update: SessionUpdate):
    """Met à jour l'état d'une session (upload, complétion)."""
    try:
        db.upsert_session(update.session_id, update.uploaded, update.completed)
        return {"ok": True}
    except Exception as e:
        logger.exception("Erreur session update")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.post("/session/time")
async def session_time(update: SessionTimeUpdate):
    """Enregistre le temps passé dans une session."""
    try:
        db.update_session_time(update.session_id, update.time_sec)
        return {"ok": True}
    except Exception as e:
        logger.exception("Erreur session time")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/admin/behavioral")
async def admin_behavioral(_: bool = Depends(verify_admin_key)):
    """Retourne les stats comportementales pour le dashboard admin."""
    try:
        return db.get_behavioral_stats()
    except Exception as e:
        logger.exception("Erreur stats comportementales")
        raise HTTPException(status_code=500, detail="Internal server error")


# ──────────────────────────────────────────────
# User Activity Logging
# ──────────────────────────────────────────────

class ActivityLog(BaseModel):
    session_id: str = ""
    event_type: str = "page_view"
    page: str = ""
    message: str = ""
    details: str = ""
    metadata: str = "{}"


@app.post("/activity/log")
async def activity_log(activity: ActivityLog, request: Request):
    """Enregistre un événement d'activité utilisateur."""
    try:
        ip = request.headers.get("x-forwarded-for", "").split(",")[0].strip()
        if not ip:
            ip = request.client.host if request.client else ""
        ua = request.headers.get("user-agent", "")

        db.log_user_activity(
            session_id=activity.session_id,
            ip_address=ip,
            user_agent=ua,
            event_type=activity.event_type,
            page=activity.page,
            message=activity.message,
            details=activity.details,
            metadata=activity.metadata,
        )
        return {"ok": True}
    except Exception as e:
        logger.exception("Erreur log activité")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/admin/activities")
async def admin_activities(
    event_type: Optional[str] = Query(None),
    limit: int = Query(100),
    offset: int = Query(0),
    _: bool = Depends(verify_admin_key),
):
    """Retourne les activités utilisateur."""
    try:
        return db.get_user_activities(event_type=event_type, limit=limit, offset=offset)
    except Exception as e:
        logger.exception("Erreur récupération activités")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/admin/activity-stats")
async def admin_activity_stats(_: bool = Depends(verify_admin_key)):
    """Stats rapides des activités."""
    try:
        return db.get_activity_stats()
    except Exception as e:
        logger.exception("Erreur stats activités")
        raise HTTPException(status_code=500, detail="Internal server error")
