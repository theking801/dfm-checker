# DFM Checker — Design for Manufacturing Checker

Analyse la fabricabilité de tes fichiers STL pour l'impression 3D FDM. Obtiens un rapport visuel interactif avec les zones problématiques surlignées directement sur ton modèle 3D.

## ✨ Fonctionnalités V1

- **Upload** de fichier `.stl` par drag & drop
- **3 analyses automatiques** :
  - 🔴 **Parois fines** : épaisseur < seuil matériau (PLA 0.8mm, ABS/PETG 1.0mm)
  - 🟠 **Surplombs** : faces inclinées > 45° sans support
  - 🟡 **Ratio élancé** : éléments hauts et fins (ratio > 10:1)
- **Visualisation 3D interactive** avec zones problématiques colorées (rouge/orange/rose)
- **Rapport détaillé** avec explications et suggestions de correction
- **Export PDF** du rapport
- 100% anonyme, aucun stockage de fichiers, pas de compte nécessaire

## 🏗️ Architecture

```
dfm-checker/
├── frontend/          # React + Vite + Three.js + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx      # Page d'accueil
│   │   │   ├── FileUploader.tsx     # Upload STL drag & drop
│   │   │   ├── MaterialSelector.tsx # Choix matériau
│   │   │   ├── Viewer3D.tsx         # Visualiseur 3D
│   │   │   ├── HighlightedMesh.tsx  # Mesh avec zones colorées
│   │   │   ├── ReportCard.tsx       # Carte problème individuelle
│   │   │   └── ReportPanel.tsx      # Panneau rapport complet
│   │   ├── services/api.ts          # Appel API backend
│   │   ├── types/index.ts           # Types TypeScript
│   │   └── utils/pdfExport.ts       # Export PDF
│   └── ...
├── backend/           # FastAPI + trimesh + numpy
│   ├── main.py                     # API REST
│   └── analyzers/
│       ├── wall_thickness.py       # Détection parois fines
│       ├── overhangs.py            # Détection surplombs
│       └── aspect_ratio.py         # Détection ratio élancé
└── README.md
```

## 🚀 Installation et lancement

### Prérequis

- **Node.js** 18+ et **npm**
- **Python** 3.10+
- Un fichier STL à tester (tu peux en trouver sur [Printables](https://www.printables.com/) ou [Thingiverse](https://www.thingiverse.com/))

### 1. Backend (Python / FastAPI)

```bash
# Se placer dans le dossier backend
cd backend

# Créer un environnement virtuel (recommandé)
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur macOS/Linux :
# source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'environnement
cp .env.example .env

# Lancer le serveur
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Le backend est maintenant accessible sur `http://localhost:8000`.
La documentation interactive de l'API est disponible sur `http://localhost:8000/docs`.

### 2. Frontend (React / Vite)

```bash
# Dans un nouveau terminal, se placer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend est maintenant accessible sur `http://localhost:5173`.

### 3. Utilisation

1. Ouvre `http://localhost:5173` dans ton navigateur
2. Clique sur "Analyser un fichier STL"
3. Sélectionne ton matériau (PLA, ABS, ou PETG)
4. Glisse-dépose ou choisis ton fichier `.stl`
5. Clique sur "Lancer l'analyse"
6. Explore le modèle 3D et le rapport !

## 🌐 Déploiement

### Frontend → Vercel

1. Crée un compte sur [Vercel](https://vercel.com)
2. Connecte ton repo GitHub
3. Configure :
   - **Framework** : Vite
   - **Root directory** : `frontend`
   - **Build command** : `npm run build`
   - **Output directory** : `dist`
   - **Environment variable** : `VITE_API_URL` = URL de ton backend déployé

### Backend → Railway ou Render

1. Crée un compte sur [Railway](https://railway.app) ou [Render](https://render.com)
2. Connecte ton repo GitHub, root directory : `backend`
3. **Start command** : `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Ajoute la variable d'environnement `CORS_ORIGINS` = URL de ton frontend Vercel

## 📊 Détection des défauts

| Problème | Seuil | Source |
|---|---|---|
| **Paroi fine PLA** | < 0.8 mm | Protolabs FDM Design Guide |
| **Paroi fine ABS** | < 1.0 mm | Protolabs FDM Design Guide |
| **Paroi fine PETG** | < 1.0 mm | Protolabs FDM Design Guide |
| **Surplomb critique** | > 45° | Hubs FDM Design Rules |
| **Ratio élancé** | > 10:1 | Règles empiriques FDM |

> ⚠️ **Note sur les approximations** : Les calculs géométriques sur un mesh STL sont complexes. Ce MVP utilise des approximations raisonnables documentées dans le code (ray casting pour l'épaisseur, détection par normales pour les surplombs, analyse par tranches pour le ratio). Les résultats sont une aide à la décision, pas un jugement définitif.

## 🛠️ Stack technique

- **Frontend** : React 18, Vite 5, Three.js (@react-three/fiber + drei), TailwindCSS
- **Backend** : Python, FastAPI, trimesh, numpy
- **PDF** : html2canvas + jsPDF
- **Animations** : Composants CSS personnalisés (inspiration React Bits)

## 📝 Licence

Projet étudiant — MIT

## 🙏 Crédits

- Seuils basés sur les guidelines publiques de Protolabs et Hubs
- Icônes par [Heroicons](https://heroicons.com)
