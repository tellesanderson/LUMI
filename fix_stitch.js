const fs = require('fs');
let html = fs.readFileSync('c:/IA/LUMI/index.html', 'utf8');

// 1. Update Stitch
const stitchPattern = /(<div class="theme-card__image" style="background:linear-gradient[^>]+>\s*<span class="theme-card__placeholder">??<\/span>\s*)(<span class="theme-card__badge">1–8 anos<\/span>)(\s*<\/div>\s*<div class="theme-card__content">\s*<h3 class="theme-card__title">Stitch<\/h3>)/;

html = html.replace(stitchPattern, `<div class="theme-card__image">\n          <img src="img/themes/stitch.png" alt="Tema Stitch" loading="lazy">\n          $2\n        </div>\n        <div class="theme-card__content">\n          <h3 class="theme-card__title">Stitch</h3>`);

// 2. Remove Bento Cake
const bentoPattern = /      <div class="theme-card fade-up fade-up-delay-3" data-category="meninas">\s*<div class="theme-card__image" style="background:linear-gradient[^>]+>\s*<span class="theme-card__placeholder">??<\/span>\s*<span class="theme-card__badge">1–5 anos<\/span>\s*<\/div>\s*<div class="theme-card__content">\s*<h3 class="theme-card__title">Bento Cake<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*/;

html = html.replace(bentoPattern, '');

fs.writeFileSync('c:/IA/LUMI/index.html', html, 'utf8');
