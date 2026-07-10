# DFM Checker — Design for Manufacturing Checker

Analyze your STL files for FDM 3D printing manufacturability. Get an interactive visual report with problem areas highlighted directly on your 3D model.

## ✨ Features V1

- **Upload** `.stl` files via drag & drop
- **3 automatic analyses**:
  - 🔴 **Thin walls**: thickness < material threshold (PLA 0.8mm, ABS/PETG 1.0mm)
  - 🟠 **Overhangs**: faces angled > 45° without supports
  - 🟡 **Aspect ratio**: tall and slender elements (ratio > 10:1)
- **Interactive 3D visualization** with color-coded problem zones (red/orange/pink)
- **Detailed report** with explanations and correction suggestions
- **PDF export** of the report
- 100% anonymous, no file storage, no account required

## 🏗️ Architecture

```
dfm-checker/
├── frontend/          # React + Vite + Three.js + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── LandingPage.tsx      # Landing page
│   │   │   ├── FileUploader.tsx     # STL drag & drop upload
│   │   │   ├── MaterialSelector.tsx # Material selection
│   │   │   ├── Viewer3D.tsx         # 3D viewer
│   │   │   ├── HighlightedMesh.tsx  # Mesh with colored zones
│   │   │   ├── ReportCard.tsx       # Individual problem card
│   │   │   └── ReportPanel.tsx      # Full report panel
│   │   ├── services/api.ts          # Backend API calls
│   │   ├── types/index.ts           # TypeScript types
│   │   └── utils/pdfExport.ts       # PDF export utility
│   └── ...
├── backend/           # FastAPI + trimesh + numpy
│   ├── main.py                     # REST API
│   └── analyzers/
│       ├── wall_thickness.py       # Thin wall detection
│       ├── overhangs.py            # Overhang detection
│       └── aspect_ratio.py         # Aspect ratio detection
└── README.md
```

## 📊 Defect Detection

| Problem | Threshold | Source |
|---|---|---|
| **Thin wall PLA** | < 0.8 mm | Protolabs FDM Design Guide |
| **Thin wall ABS** | < 1.0 mm | Protolabs FDM Design Guide |
| **Thin wall PETG** | < 1.0 mm | Protolabs FDM Design Guide |
| **Critical overhang** | > 45° | Hubs FDM Design Rules |
| **Slender ratio** | > 10:1 | FDM empirical rules |

> ⚠️ **Note on approximations**: Geometric calculations on an STL mesh are complex. This MVP uses reasonable approximations documented in the code (ray casting for thickness, normal-based detection for overhangs, slice analysis for aspect ratio). Results are a decision-making aid, not a definitive judgement.

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, Three.js (@react-three/fiber + drei), TailwindCSS
- **Backend**: Python, FastAPI, trimesh, numpy
- **PDF**: html2canvas + jsPDF
- **Animations**: Custom CSS components (React Bits inspired)

## 📝 License

Student project — MIT

## 🙏 Credits

- Thresholds based on public guidelines from Protolabs and Hubs
- Icons by [Heroicons](https://heroicons.com) 
