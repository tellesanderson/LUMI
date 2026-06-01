/* =============================================
   LUMI DECORAÇÕES — Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initThemes();
  initTestimonialSlider();
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
