(() => {
  document.documentElement.classList.add('js-enabled');

  const header = document.querySelector('.site-header');
  const menuToggle = document.querySelector('#menu-toggle');
  const mobileNavigation = document.querySelector('#mobile-navigation');
  const progress = document.querySelector('#scroll-progress');
  const backToTop = document.querySelector('#back-to-top');

  function setMenu(open) {
    if (!menuToggle || !mobileNavigation) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobileNavigation.hidden = !open;
    document.body.classList.toggle('navigation-open', open);
    menuToggle.classList.toggle('is-open', open);
  }

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  mobileNavigation?.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 820) setMenu(false);
  });

  let scrollFrame = null;
  function updateScrollUI() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    if (progress) progress.style.transform = `scaleX(${Math.min(scrollTop / scrollable, 1)})`;
    backToTop?.classList.toggle('is-visible', scrollTop > 650);
    header?.classList.toggle('is-scrolled', scrollTop > 12);
    scrollFrame = null;
  }

  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUI);
  }, { passive: true });
  updateScrollUI();

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  document.querySelectorAll('[data-current-year]').forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const statusDot = document.querySelector('#database-status-dot');
  const statusText = document.querySelector('#database-status-text');
  async function updateDatabaseStatus() {
    if (!statusDot || !statusText) return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    try {
      const response = await fetch('/api/restaurants/stats/summary', { signal: controller.signal });
      if (!response.ok) throw new Error('Database unavailable');
      const data = await response.json();
      const count = Number(data?.totals?.restaurantCount || 0);
      statusDot.classList.add('is-online');
      statusText.textContent = `MongoDB connected · ${count.toLocaleString()} ${count === 1 ? 'record' : 'records'}`;
    } catch {
      statusDot.classList.add('is-offline');
      statusText.textContent = 'Database connection unavailable';
    } finally {
      clearTimeout(timer);
    }
  }
  updateDatabaseStatus();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    function registerReveal(element) {
      if (!(element instanceof HTMLElement) || element.dataset.revealRegistered) return;
      element.dataset.revealRegistered = 'true';
      element.classList.add('reveal-target');
      revealObserver.observe(element);
    }

    const revealSelector = '.section__heading, .portal-card, .summary-card, .analytics-card, .archive-photo-card, .filter-panel, .restaurant-card, .page-actions';
    document.querySelectorAll(revealSelector).forEach(registerReveal);

    const mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(revealSelector)) registerReveal(node);
          node.querySelectorAll?.(revealSelector).forEach(registerReveal);
        });
      }
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });
  }

  document.querySelectorAll('img').forEach((image) => {
    if (!image.hasAttribute('decoding')) image.decoding = 'async';
  });
})();
