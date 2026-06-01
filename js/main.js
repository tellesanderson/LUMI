/* =============================================
   LUMI DECORAÇÕES — Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initThemes();
  initTestimonialSlider();
  initPartyFloatingEffects();
});

let themes = [];

// Helper to escape HTML characters (XSS Prevention)
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ===== Render Themes Dynamically ===== */
function initThemes() {
  const themeGrid = document.getElementById('themeGrid');
  if (!themeGrid) return;

  if (typeof isFirebaseConfigured !== 'undefined' && isFirebaseConfigured) {
    // Carrega do Firebase Firestore
    db.collection('themes').get()
      .then((querySnapshot) => {
        let fetchedThemes = [];
        querySnapshot.forEach((doc) => {
          fetchedThemes.push({ id: doc.id, ...doc.data() });
        });
        
        if (fetchedThemes.length > 0) {
          // Ordena por título ou data de criação
          themes = fetchedThemes.sort((a, b) => {
            if (a.createdAt && b.createdAt) return a.createdAt - b.createdAt;
            return a.title.localeCompare(b.title);
          });
          renderThemeGrid();
        } else {
          console.log("Banco Firestore vazio. Carregando padrões locais...");
          loadLocalThemes();
          renderThemeGrid();
        }
      })
      .catch((error) => {
        console.error("Erro ao carregar do Firestore, usando fallback local:", error);
        loadLocalThemes();
        renderThemeGrid();
      });
  } else {
    // Firebase não configurado, roda localmente
    loadLocalThemes();
    renderThemeGrid();
  }
}

function loadLocalThemes() {
  const storedThemes = localStorage.getItem('lumi_themes');
  if (storedThemes) {
    try {
      themes = JSON.parse(storedThemes);
    } catch (e) {
      console.error("Erro ao carregar temas do localStorage, usando padrões.", e);
      themes = defaultThemes;
    }
  } else {
    themes = defaultThemes;
    localStorage.setItem('lumi_themes', JSON.stringify(themes));
  }
}

function renderThemeGrid() {
  const themeGrid = document.getElementById('themeGrid');
  const themesSubtitle = document.getElementById('themesSubtitle');
  if (!themeGrid) return;

  themeGrid.innerHTML = '';

  if (themesSubtitle) {
    themesSubtitle.innerHTML = `<strong>${themes.length} temas</strong> encantadores para crianças de 1 a 10 anos. Cada kit Pegue e Monte vem com toda a decoração completa para você retirar, decorar e devolver!`;
  }

  themes.forEach((theme, index) => {
    const delayClass = `fade-up-delay-${index % 4}`;
    const card = document.createElement('div');
    card.className = `theme-card fade-up ${delayClass}`;
    card.dataset.category = theme.category;
    
    const safeTitle = escapeHTML(theme.title);
    let imageSrc = theme.coverImage || theme.image || '';
    
    if (!imageSrc) {
      imageSrc = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="%23F6AFCB"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Baloo 2', cursive" font-size="24" fill="white">${safeTitle}</text></svg>`;
    }

    const whatsappMessage = encodeURIComponent(`Olá! Tenho interesse no kit Pegue e Monte do tema ${theme.title}. Gostaria de consultar a disponibilidade para a data...`);
    const whatsappLink = `https://wa.me/5541998445947?text=${whatsappMessage}`;

    const galleryCount = theme.galleryImages ? theme.galleryImages.length : 0;
    const galleryIcon = galleryCount > 0 ? `<span class="theme-card__badge">📸 +${galleryCount} fotos</span>` : '';

    card.innerHTML = `
      <div class="theme-card__image" onclick="openGallery('${theme.id}')" style="cursor:pointer">
        <img src="${imageSrc}" alt="Tema ${safeTitle}" loading="lazy">
        ${galleryIcon}
      </div>
      <div class="theme-card__content">
        <h3 class="theme-card__title" onclick="openGallery('${theme.id}')" style="cursor:pointer">${safeTitle}</h3>
        <a href="${whatsappLink}" class="btn-cta btn-cta--sm" target="_blank" rel="noopener noreferrer">Reservar Tema</a>
      </div>
    `;
    themeGrid.appendChild(card);
  });

  // Inicializa filtros e animações após injetar os cartões
  initThemeFilters();
  initScrollAnimations();
}

/* ===== Sticky Header ===== */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  }, { passive: true });
}

/* ===== Mobile Menu ===== */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    menu.classList.toggle('active');
    document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
  });

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      menu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ===== Theme Filters ===== */
function initThemeFilters() {
  const buttons = document.querySelectorAll('.theme-filters__btn');
  const cards = document.querySelectorAll('.theme-card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;

      cards.forEach(card => {
        if (filter === 'todos' || card.dataset.category === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'fadeIn .4s ease forwards';
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });
}

/* ===== Testimonial Slider ===== */
function initTestimonialSlider() {
  const track = document.querySelector('.testimonials-track');
  const dots = document.querySelectorAll('.testimonials-dots__dot');
  if (!track || !dots.length) return;

  let current = 0;
  const cards = track.querySelectorAll('.testimonial-card');
  const total = cards.length;
  let autoPlay;

  function getVisible() {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  function goTo(index) {
    const visible = getVisible();
    const maxIndex = Math.max(0, total - visible);
    current = Math.max(0, Math.min(index, maxIndex));
    const pct = (current / total) * 100;
    track.style.transform = `translateX(-${pct}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => {
      goTo(i);
      resetAutoPlay();
    });
  });

  function resetAutoPlay() {
    clearInterval(autoPlay);
    autoPlay = setInterval(() => {
      const visible = getVisible();
      const maxIndex = Math.max(0, total - visible);
      goTo(current >= maxIndex ? 0 : current + 1);
    }, 5000);
  }

  goTo(0);
  resetAutoPlay();

  window.addEventListener('resize', () => goTo(current));
}

/* ===== Scroll Animations ===== */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.fade-up');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  elements.forEach(el => observer.observe(el));
}

/* Fade In keyframe (used by filters) */
const style = document.createElement('style');
style.textContent = `@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`;
document.head.appendChild(style);

/* ===== Modal Gallery ===== */
window.openGallery = function(themeId) {
  const theme = themes.find(t => t.id === themeId);
  if (!theme) return;
  
  let images = [];
  if (theme.coverImage) images.push(theme.coverImage);
  else if (theme.image) images.push(theme.image);
  
  if (theme.galleryImages && theme.galleryImages.length > 0) {
    images = images.concat(theme.galleryImages);
  }

  if (images.length === 0) return;

  let modal = document.getElementById('galleryModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'galleryModal';
    modal.className = 'gallery-modal';
    document.body.appendChild(modal);
  }

  let slidesHtml = images.map((img, i) => `
    <div class="gallery-slide ${i === 0 ? 'active' : ''}">
      <img src="${img}" alt="Foto ${i+1} do tema">
    </div>
  `).join('');

  modal.innerHTML = `
    <div class="gallery-modal__overlay" onclick="closeGallery()"></div>
    <div class="gallery-modal__content">
      <button class="gallery-modal__close" onclick="closeGallery()">×</button>
      <div class="gallery-slider">
        ${slidesHtml}
      </div>
      ${images.length > 1 ? `
        <button class="gallery-prev" onclick="changeSlide(-1)">❮</button>
        <button class="gallery-next" onclick="changeSlide(1)">❯</button>
      ` : ''}
    </div>
  `;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  window.currentSlideIndex = 0;
};

window.closeGallery = function() {
  const modal = document.getElementById('galleryModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
};

window.changeSlide = function(dir) {
  const slides = document.querySelectorAll('.gallery-slide');
  if (!slides.length) return;
  slides[window.currentSlideIndex].classList.remove('active');
  window.currentSlideIndex = (window.currentSlideIndex + dir + slides.length) % slides.length;
  slides[window.currentSlideIndex].classList.add('active');
};

/* ===== FLOATING PARTY EFFECTS (Balloons & Confetti) ===== */
function initPartyFloatingEffects() {
  const container = document.createElement('div');
  container.id = 'party-effects-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '0'; // Behind header and text, above base page bg
  container.style.overflow = 'hidden';
  document.body.appendChild(container);

  const colors = ['#F6AFCB', '#8ECDF2', '#F9D976', '#B9A7F5', '#AEE3D6', '#FF7AA2'];

  function createConfetti() {
    if (document.hidden) return;
    const confetti = document.createElement('div');
    
    const size = Math.random() * 8 + 6;
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    confetti.style.width = `${size}px`;
    confetti.style.height = `${size * (Math.random() > 0.5 ? 1 : 1.5)}px`;
    confetti.style.background = color;
    confetti.style.position = 'absolute';
    confetti.style.bottom = '-20px';
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.opacity = Math.random() * 0.4 + 0.15; // Soft opacity
    confetti.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    const duration = Math.random() * 10 + 8;
    const drift = (Math.random() - 0.5) * 120;
    
    container.appendChild(confetti);

    const animation = confetti.animate([
      { transform: `translate(0, 0) rotate(0deg)`, opacity: confetti.style.opacity },
      { transform: `translate(${drift}px, -110vh) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: duration * 1000,
      easing: 'linear'
    });

    animation.onfinish = () => confetti.remove();
  }

  function createBalloon() {
    if (document.hidden) return;
    const balloon = document.createElement('div');
    
    const scale = Math.random() * 0.3 + 0.5; // Scale 0.5 to 0.8 to keep it soft
    const balloonColor = colors[Math.floor(Math.random() * colors.length)];
    
    balloon.style.position = 'absolute';
    balloon.style.bottom = '-120px';
    balloon.style.left = `${Math.random() * 85 + 5}vw`;
    balloon.style.opacity = '0.35'; // Very subtle overlay
    balloon.style.transform = `scale(${scale})`;
    
    // Minimalist SVG Balloon
    balloon.innerHTML = `
      <svg width="60" height="75" viewBox="0 0 60 75" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="30" cy="30" rx="28" ry="30" fill="${balloonColor}"/>
        <path d="M30 60L26 66H34L30 60Z" fill="${balloonColor}"/>
        <path d="M30 66C30 70 28 72 28 75" stroke="#aaa" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    `;
    
    container.appendChild(balloon);

    const duration = Math.random() * 15 + 15; // 15s to 30s
    const sway = Math.random() * 60 + 40;
    
    const animation = balloon.animate([
      { transform: `translate(0, 0) scale(${scale})`, opacity: 0.35 },
      { transform: `translate(${Math.sin(1) * sway}px, -40vh) scale(${scale})`, opacity: 0.35 },
      { transform: `translate(${Math.sin(2) * sway}px, -80vh) scale(${scale})`, opacity: 0.35 },
      { transform: `translate(${Math.sin(3) * sway}px, -115vh) scale(${scale})`, opacity: 0 }
    ], {
      duration: duration * 1000,
      easing: 'ease-in-out'
    });

    animation.onfinish = () => balloon.remove();
  }

  // Pre-populate particles on start so page feels alive instantly
  for (let i = 0; i < 12; i++) {
    setTimeout(createConfetti, Math.random() * 6000);
  }
  for (let i = 0; i < 2; i++) {
    setTimeout(createBalloon, Math.random() * 10000);
  }

  // Spawn loops
  setInterval(createConfetti, 1500);
  setInterval(createBalloon, 10000);
}
