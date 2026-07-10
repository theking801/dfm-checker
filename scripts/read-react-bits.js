#!/usr/bin/env node
/**
 * Utilitaire pour récupérer le code source des composants React Bits
 *
 * Utilisation :
 *   node scripts/read-react-bits.js list                    # Liste tous les composants
 *   node scripts/read-react-bits.js list Animations          # Liste les composants d'une catégorie
 *   node scripts/read-react-bits.js show ClickSpark          # Voir le code source d'un composant
 *   node scripts/read-react-bits.js show ClickSpark css      # Voir le CSS d'un composant
 */

const path = require('path');
const fs = require('fs');

const CONTENT_DIR = path.join(__dirname, '..', 'frontend', 'node_modules', 'reactbits-mcp-server', 'src', 'content');

const CATEGORIES = ['Animations', 'Backgrounds', 'Components', 'TextAnimations'];

function listComponents(categoryFilter) {
  CATEGORIES.forEach((cat) => {
    if (categoryFilter && cat.toLowerCase() !== categoryFilter.toLowerCase()) return;
    
    const dir = path.join(CONTENT_DIR, cat);
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name);
    
    if (items.length === 0) return;
    
    console.log(`\n## ${cat} (${items.length})`);
    items.forEach((name) => {
      const jsxPath = path.join(dir, name, `${name}.jsx`);
      const exists = fs.existsSync(jsxPath) ? '✅' : '❌';
      console.log(`  ${exists} ${name}`);
    });
  });
}

function showComponent(name, showCss) {
  for (const cat of CATEGORIES) {
    const dir = path.join(CONTENT_DIR, cat, name);
    const jsxPath = path.join(dir, `${name}.jsx`);
    const cssPath = path.join(dir, `${name}.css`);
    
    if (fs.existsSync(jsxPath)) {
      console.log(`\n📁 ${cat} / ${name}\n`);
      
      if (showCss) {
        if (fs.existsSync(cssPath)) {
          console.log('🎨 CSS:');
          console.log(fs.readFileSync(cssPath, 'utf-8'));
          console.log('\n---\n');
        } else {
          console.log('⚠️  Pas de fichier CSS');
        }
      }
      
      console.log('📄 JSX:');
      console.log(fs.readFileSync(jsxPath, 'utf-8'));
      return;
    }
  }
  console.log(`❌ Composant "${name}" introuvable`);
  console.log('Vérifie le nom ou utilise "list" pour voir tous les composants.');
}

const cmd = process.argv[2];
const arg = process.argv[3];

if (!cmd) {
  console.log('Utilisation :');
  console.log('  node scripts/read-react-bits.js list [catégorie]');
  console.log('  node scripts/read-react-bits.js show <nom> [css]');
  console.log('\nCatégories : Animations, Backgrounds, Components, TextAnimations');
  process.exit(0);
}

if (cmd === 'list') {
  listComponents(arg);
} else if (cmd === 'show') {
  if (!arg) {
    console.log('❌ Spécifie un nom de composant : node scripts/read-react-bits.js show ClickSpark');
    process.exit(1);
  }
  showComponent(arg, process.argv[4] === 'css');
} else {
  console.log(`❌ Commande inconnue : "${cmd}"`);
  console.log('Utilise "list" ou "show".');
}
