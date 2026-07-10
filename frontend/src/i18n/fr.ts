const fr = {
  // Navbar
  'nav.home': 'Accueil',
  'nav.features': 'Fonctionnalités',
  'nav.how': 'Comment ça marche',
  'nav.analyze': 'Analyser',

  // Hero
  'hero.badge': 'Design for Manufacturing',
  'hero.title': 'Analyse tes fichiers STL en un clic',
  'hero.subtitle': 'Vérifie la fabricabilité, choisis ton matériau, obtiens un rapport détaillé.',
  'hero.desc': "Importe ton fichier STL et laisse notre analyseur détecter automatiquement les parois fines, surplombs et ratios élancés. Les zones problématiques sont surlignées directement sur ton modèle 3D.",
  'hero.cta': 'Analyser un fichier',
  'hero.free': 'Gratuit · Anonyme',
  'hero.scroll': 'Scroll',

  // Features
  'features.title': 'Fonctionnalités',
  'features.subtitle': 'Fais défiler les cartes pour découvrir chaque fonctionnalité',

  // How it works
  'how.title': 'Comment ça marche',
  'how.subtitle': 'Trois étapes simples pour vérifier ton modèle 3D',
  'how.step1.title': '1. Importe ton STL',
  'how.step1.desc': 'Glisse-dépose ton fichier STL. Pas de compte, pas de stockage — analyse instantanée en mémoire.',
  'how.step2.title': '2. Choisis ton matériau',
  'how.step2.desc': 'Sélectionne PLA, ABS ou PETG. Chaque matériau a ses propres seuils pour les parois, surplombs et ratios.',
  'how.step3.title': '3. Obtiens ton rapport',
  'how.step3.desc': 'Reçois une analyse détaillée avec les zones problématiques colorées sur ton modèle 3D, la sévérité et les suggestions.',
  'features.cta': 'Essayer maintenant →',
  'features.import': '📤 Import facile',
  'features.import.desc': "Glisse-dépose ton fichier STL. Pas de création de compte, pas de stockage — analyse en mémoire puis suppression.",
  'features.walls': '📏 Parois fines',
  'features.walls.desc': "L'analyse repère les zones où l'épaisseur est insuffisante pour le matériau choisi (PLA 0.8mm, ABS/PETG 1.0mm) via ray casting.",
  'features.overhangs': '📐 Surplombs',
  'features.overhangs.desc': "Les faces inclinées à plus de 45° sont signalées. Sans supports, ces zones s'affaissent pendant l'impression.",
  'features.ratio': '📊 Ratio élancé',
  'features.ratio.desc': 'Éléments fins et hauts (ratio > 10:1) détectés par analyse par tranches. Ces zones risquent de casser.',
  'features.sharp_corner': '🔺 Angles vifs',
  'features.sharp_corner.desc': 'Détecte les arêtes vives et concentrations de contraintes. Règle DFM universelle : les angles < 135° nécessitent des congés.',
  'features.viewer': '🖥️ Visualisation 3D',
  'features.viewer.desc': "Le modèle STL s'affiche dans un viewer 3D interactif. Les zones problématiques sont surlignées en couleur.",
  'features.report': '📄 Rapport PDF',
  'features.report.desc': 'Rapport détaillé exportable avec sévérité, explications et suggestions de correction pour chaque problème.',

  // Footer
  'footer.text': 'Checker 3D V1 — Projet étudiant · Données basées sur les guidelines publiques de fabrication FDM',

  // Analysis Screen
  'analysis.title': 'Analyse ton fichier STL',
  'analysis.subtitle': "Importe ton fichier, choisis ton matériau, et lance l'analyse",
  'analysis.backend_offline': "Serveur backend inaccessible — vérifie qu'il est lancé",
  'analysis.analyze': "Lancer l'analyse",
  'analysis.progress.prep': 'Préparation du fichier…',
  'analysis.progress.send': 'Envoi au serveur…',
  'analysis.progress.walls': 'Analyse des parois…',
  'analysis.progress.report': 'Génération du rapport…',
  'analysis.progress.final': 'Finalisation…',
  'analysis.progress.default': 'Analyse en cours…',
  'analysis.error.title': "Erreur d'analyse",
  'analysis.error.retry': 'Réessayer',
  'analysis.error.change': 'Changer de fichier',
  'analysis.results.title': "Résultats de l'analyse",
  'analysis.results.desc': 'Les zones problématiques sont surlignées en couleur sur le modèle 3D',
  'analysis.results.again': 'Analyser un autre fichier',

  // Backend
  'backend.online': 'API OK',
  'backend.offline': 'Hors ligne',
  'backend.unknown': '…',

  // Uploader
  'upload.drop': 'Dépose ton fichier STL ici',
  'upload.click': 'ou clique pour parcourir',
  'upload.hint': "Format : .stl — Taille max : 50 MB — Analyse en mémoire, rien n'est stocké",
  'upload.change': 'Clique ou glisse un autre fichier pour changer',

  // Material
  'material.label': "Matériau d'impression",
  'material.thickness': 'Épaisseur de paroi minimale',

  // Viewer
  'viewer.legend': 'Légende',
  'viewer.normal': 'Normal',
  'viewer.overhang': 'Surplomb',
  'viewer.wall': 'Paroi fine',
  'viewer.ratio_label': 'Ratio élancé',
  'viewer.sharp_corner': 'Angle vif',
  'viewer.rotate': '🖱 Glisser pour tourner',
  'viewer.zoom': '🔄 Molette pour zoomer',
  'viewer.pan': '⇧+Glisser pour panoramique',
  'viewer.loading': 'Chargement du modèle 3D...',

  // Report
  'report.title': "Rapport d'analyse",
  'report.material': 'Matériau',
  'report.problems': 'problème(s) détecté(s)',
  'report.measured': 'Mesuré',
  'report.angle': 'Angle',
  'report.ratio_value': 'Ratio',
  'report.stats.faces': 'Faces',
  'report.stats.vertices': 'Sommets',
  'report.stats.volume': 'Volume',
  'report.stats.watertight': 'Watertight',
  'report.no_issues': 'Aucun problème détecté !',
  'report.no_issues.desc': "Ton modèle semble prêt pour l'impression avec les paramètres",
  'report.problems_list': 'Problèmes détectés',
  'report.suggestion': 'Suggestion',
  'report.export': 'Exporter le rapport en PDF',

  // Feedback
  'feedback.button': 'Feedback',
  'feedback.title': 'Donner mon avis',
  'feedback.message_label': 'Ton message *',
  'feedback.message_placeholder': "Un bug ? Une idée d'amélioration ? Un compliment ? 😊",
  'feedback.email_label': 'Ton email (optionnel)',
  'feedback.email_placeholder': 'pour que je puisse te répondre',
  'feedback.submit': 'Envoyer mon feedback',
  'feedback.thanks': 'Merci pour ton retour !',
  'feedback.thanks_desc': 'Ta contribution aide à améliorer l\'outil.',

  // Errors
  'error.unknown': 'Une erreur inconnue est survenue',
  'error.stl_only': 'Seuls les fichiers STL (.stl) sont acceptés.',
  'error.file_too_large': 'Le fichier est trop volumineux. Taille maximum : 50 MB.',
  'error.pdf_failed': "Impossible de générer le PDF. Vérifie la console pour plus de détails.",
}

export default fr
export type TranslationKeys = keyof typeof fr
