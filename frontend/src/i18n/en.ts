const en = {
  // Navbar
  'nav.home': 'Home',
  'nav.features': 'Features',
  'nav.how': 'How it works',
  'nav.analyze': 'Analyze',

  // Hero
  'hero.badge': 'Design for Manufacturing',
  'hero.title': 'Analyze your STL files in one click',
  'hero.subtitle': 'Check manufacturability, choose your material, get a detailed report.',
  'hero.desc': "Upload your STL file and let our analyzer automatically detect thin walls, overhangs, and aspect ratios. Problem areas are highlighted directly on your 3D model.",
  'hero.cta': 'Analyze a file',
  'hero.free': 'Free · Anonymous',
  'hero.scroll': 'Scroll',

  // Features
  'features.title': 'Features',
  'features.subtitle': 'Scroll through the cards to discover each feature',

  // How it works
  'how.title': 'How it works',
  'how.subtitle': 'Three simple steps to check your 3D model',
  'how.step1.title': '1. Upload your STL',
  'how.step1.desc': 'Drag and drop your STL file. No account needed, no data stored — instant in-memory analysis.',
  'how.step2.title': '2. Choose your material',
  'how.step2.desc': 'Select PLA, ABS, or PETG. Each material has specific thresholds for walls, overhangs, and aspect ratios.',
  'how.step3.title': '3. Get your report',
  'how.step3.desc': 'Receive a detailed analysis with color-coded problem areas on your 3D model, severity ratings, and fix suggestions.',
  'features.cta': 'Try now →',
  'features.import': '📤 Easy import',
  'features.import.desc': 'Drag and drop your STL file. No account creation, no storage — in-memory analysis then deletion.',
  'features.walls': '📏 Thin walls',
  'features.walls.desc': "Detects areas where wall thickness is insufficient for the chosen material (PLA 0.8mm, ABS/PETG 1.0mm) via ray casting.",
  'features.overhangs': '📐 Overhangs',
  'features.overhangs.desc': 'Faces angled beyond 45° are flagged. Without supports, these areas sag during printing.',
  'features.ratio': '📊 Aspect ratio',
  'features.ratio.desc': 'Slender and tall elements (ratio > 10:1) detected by slice analysis. These areas risk breaking.',
  'features.viewer': '🖥️ 3D Visualization',
  'features.viewer.desc': "The STL model displays in an interactive 3D viewer. Problem areas are highlighted in color on the mesh.",
  'features.sharp_corner': '🔺 Sharp corners',
  'features.sharp_corner.desc': 'Detects sharp edges and stress concentrations in your model. Universal DFM rule: corners < 135° need fillets.',
  'features.report': '📄 PDF Report',
  'features.report.desc': 'Detailed exportable report with severity, explanations, and correction suggestions for each problem.',

  // Footer
  'footer.text': 'Checker 3D V1 — Student project · Data based on public FDM manufacturing guidelines',

  // Analysis Screen
  'analysis.title': 'Analyze your STL file',
  'analysis.subtitle': "Upload your file, choose your material, and start the analysis",
  'analysis.backend_offline': 'Backend server unreachable — make sure it is running',
  'analysis.analyze': "Start analysis",
  'analysis.progress.prep': 'Preparing file…',
  'analysis.progress.send': 'Sending to server…',
  'analysis.progress.walls': 'Analyzing walls…',
  'analysis.progress.report': 'Generating report…',
  'analysis.progress.final': 'Finalizing…',
  'analysis.progress.default': 'Analyzing…',
  'analysis.error.title': "Analysis error",
  'analysis.error.retry': 'Retry',
  'analysis.error.change': 'Change file',
  'analysis.results.title': "Analysis results",
  'analysis.results.desc': 'Problem areas are highlighted in color on the 3D model',
  'analysis.results.again': 'Analyze another file',

  // Backend
  'backend.online': 'API OK',
  'backend.offline': 'Offline',
  'backend.unknown': '…',

  // Uploader
  'upload.drop': 'Drop your STL file here',
  'upload.click': 'or click to browse',
  'upload.hint': "Format: .stl — Max size: 50 MB — In-memory analysis, nothing is stored",
  'upload.change': 'Click or drop another file to change',

  // Material
  'material.label': "Printing material",
  'material.thickness': 'Minimum wall thickness',

  // Viewer
  'viewer.legend': 'Legend',
  'viewer.normal': 'Normal',
  'viewer.overhang': 'Overhang',
  'viewer.wall': 'Thin wall',
  'viewer.ratio_label': 'Aspect ratio',
  'viewer.sharp_corner': 'Sharp corner',
  'viewer.rotate': '🖱 Drag to rotate',
  'viewer.zoom': '🔄 Scroll to zoom',
  'viewer.pan': '⇧+Drag to pan',
  'viewer.loading': 'Loading 3D model...',

  // Report
  'report.title': "Analysis report",
  'report.material': 'Material',
  'report.problems': 'problem(s) detected',
  'report.measured': 'Measured',
  'report.angle': 'Angle',
  'report.ratio_value': 'Ratio',
  'report.stats.faces': 'Faces',
  'report.stats.vertices': 'Vertices',
  'report.stats.volume': 'Volume',
  'report.stats.watertight': 'Watertight',
  'report.no_issues': 'No issues detected!',
  'report.no_issues.desc': "Your model seems ready for printing with",
  'report.problems_list': 'Detected problems',
  'report.suggestion': 'Suggestion',
  'report.export': 'Export report as PDF',

  // Feedback
  'feedback.button': 'Feedback',
  'feedback.title': 'Share your feedback',
  'feedback.message_label': 'Your message *',
  'feedback.message_placeholder': 'A bug? An idea? A compliment? 😊',
  'feedback.email_label': 'Your email (optional)',
  'feedback.email_placeholder': "so I can get back to you",
  'feedback.submit': 'Send feedback',
  'feedback.thanks': 'Thanks for your feedback!',
  'feedback.thanks_desc': 'Your input helps improve the tool.',

  // Errors
  'error.unknown': 'An unknown error occurred',
  'error.stl_only': 'Only STL files (.stl) are accepted.',
  'error.file_too_large': 'File is too large. Maximum size: 50 MB.',
  'error.pdf_failed': "Unable to generate PDF. Check the console for details.",
}

export default en
export type TranslationKeys = keyof typeof en
