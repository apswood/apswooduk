/* Entrance motion: staggered reveals on scroll. Content is only hidden once this script has run, and never under reduced motion. */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  // A reload or back/forward visit of the same page gets no entrance motion.
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (nav && (nav.type === 'reload' || nav.type === 'back_forward')) return;
  var sel = 'main h1, main .lede, main > * > h2, main > * > p, main > * > ul:not(.deck-track), main .card, main .comp, main .career, main .themes, main .deck, main .roles > li, main article > *';
  var items = Array.prototype.slice.call(document.querySelectorAll(sel)).filter(function (el, i, a) {
    return a.indexOf(el) === i && !el.closest('.deck-track') && !el.closest('[data-egg]');
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      e.target.classList.add('in');
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  var batch = 0, last = 0;
  items.forEach(function (el) {
    var r = el.getBoundingClientRect(), now = performance.now();
    batch = now - last < 50 ? batch + 1 : 0; last = now;
    el.style.setProperty('--d', Math.min(batch, 4) * 40 + 'ms');
    el.classList.add('rv');
    if (el.matches('.career, .themes, .deck')) el.classList.add('rv-f');
    io.observe(el);
  });
  // Safety net: never leave anything hidden
  setTimeout(function () { items.forEach(function (el) { el.classList.add('in'); }); }, 4000);
})();
