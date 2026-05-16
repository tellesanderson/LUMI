const fs = require('fs');
let html = fs.readFileSync('c:/IA/LUMI/index.html', 'utf8');

const replacements = {
    "Trolls": "trolls.png",
    "Hulk": "hulk.png",
    "Homem Aranha": "homem_aranha.png",
    "LOL Surprise": "lol.png",
    "Fortnite": "fortnite.png",
    "Ninjago": "ninjago.png",
    "Homem de Ferro": "homem_ferro.png",
    "Roblox": "roblox.png",
    "Flash": "flash.png",
    "Free Fire": "freefire.png",
    "Palmeiras": "palmeiras.png",
    "Stumble Guys": "stumbleguys.png",
    "Magali": "magali.png",
    "Capivara": "capivara.png"
};

for (const [key, img] of Object.entries(replacements)) {
    const pattern = new RegExp(`(<div class="theme-card__image" style="background:linear-gradient[^>]+>[\\s\\S]*?<span class="theme-card__placeholder">[^<]+</span>\\s*)(<span class="theme-card__badge">[^<]+</span>)(\\s*</div>\\s*<div class="theme-card__content">\\s*<h3 class="theme-card__title">)${key}(</h3>)`);
    
    html = html.replace(pattern, `<div class="theme-card__image">\n          <img src="img/themes/${img}" alt="Tema ${key}" loading="lazy">\n          $2\n        </div>\n        <div class="theme-card__content">\n          <h3 class="theme-card__title">${key}</h3>`);
}

fs.writeFileSync('c:/IA/LUMI/index.html', html, 'utf8');
