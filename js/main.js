/* =============================================
   LUMI DECORAÇÕES — Main JavaScript
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initThemeFilters();
  initTestimonialSlider();
  initScrollAnimations();
});

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
