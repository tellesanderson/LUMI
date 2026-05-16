const fs = require('fs');
let html = fs.readFileSync('c:/IA/LUMI/index.html', 'utf8');

const stitchTarget = `      <div class="theme-card fade-up fade-up-delay-2" data-category="unissex">
        <div class="theme-card__image" style="background:linear-gradient(135deg,#26c6da,#5c6bc0)">
          <span class="theme-card__placeholder">??</span>
          <span class="theme-card__badge">1–8 anos</span>
        </div>
        <div class="theme-card__content">
          <h3 class="theme-card__title">Stitch</h3>
          <a href="https://wa.me/5541998445947?text=Olá!%20Tenho%20interesse%20no%20tema%20Stitch.%20Pode%20me%20enviar%20um%20orçamento?" class="btn-cta btn-cta--sm" target="_blank">Solicitar Orçamento</a>
        </div>
      </div>`;

const stitchReplacement = `      <div class="theme-card fade-up fade-up-delay-2" data-category="unissex">
        <div class="theme-card__image">
          <img src="img/themes/stitch.png" alt="Tema Stitch" loading="lazy">
          <span class="theme-card__badge">1–8 anos</span>
        </div>
        <div class="theme-card__content">
          <h3 class="theme-card__title">Stitch</h3>
          <a href="https://wa.me/5541998445947?text=Olá!%20Tenho%20interesse%20no%20tema%20Stitch.%20Pode%20me%20enviar%20um%20orçamento?" class="btn-cta btn-cta--sm" target="_blank">Solicitar Orçamento</a>
        </div>
      </div>`;

const bentoTarget = `
      <div class="theme-card fade-up fade-up-delay-3" data-category="meninas">
        <div class="theme-card__image" style="background:linear-gradient(135deg,#f8bbd0,#ce93d8)">
          <span class="theme-card__placeholder">??</span>
          <span class="theme-card__badge">1–5 anos</span>
        </div>
        <div class="theme-card__content">
          <h3 class="theme-card__title">Bento Cake</h3>
          <a href="https://wa.me/5541998445947?text=Olá!%20Tenho%20interesse%20no%20tema%20Bento%20Cake.%20Pode%20me%20enviar%20um%20orçamento?" class="btn-cta btn-cta--sm" target="_blank">Solicitar Orçamento</a>
        </div>
      </div>`;

html = html.replace(stitchTarget, stitchReplacement);
html = html.replace(bentoTarget, "");

fs.writeFileSync('c:/IA/LUMI/index.html', html, 'utf8');
