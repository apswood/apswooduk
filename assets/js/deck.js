/* Experience deck: horizontal snap track, theme filter, career-line links. Without JS the cards stack as a list. */
(function () {
  'use strict';
  var deck = document.querySelector('[data-deck]');
  if (!deck) return;
  var track = deck.querySelector('[data-deck-track]');
  var ctl = deck.querySelector('[data-deck-ctl]');
  var count = deck.querySelector('[data-deck-count]');
  var bar = document.querySelector('[data-themes-bar]');
  var cards = Array.prototype.slice.call(track.children);
  var reduce = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var theme = 'all';

  deck.classList.add('is-deck');
  if (ctl) ctl.hidden = false;
  if (bar) bar.hidden = false;

  function visible() {
    return cards.filter(function (c) { return !c.hidden; });
  }
  function current() {
    var list = visible(), left = track.getBoundingClientRect().left, best = 0, d = 1e9;
    list.forEach(function (c, i) {
      var dx = Math.abs(c.getBoundingClientRect().left - left);
      if (dx < d) { d = dx; best = i; }
    });
    return { list: list, i: best };
  }
  function show(i) {
    var list = visible();
    if (!list.length) return;
    i = Math.max(0, Math.min(list.length - 1, i));
    var x = list[i].offsetLeft - track.offsetLeft;
    track.scrollTo({ left: x, behavior: reduce() ? 'auto' : 'smooth' });
  }
  function update() {
    var s = current(), n = s.list.length;
    if (count) count.textContent = n ? (s.i + 1) + ' of ' + n : 'No cards for this theme';
    cards.forEach(function (c) { c.classList.toggle('is-current', s.list[s.i] === c); });
    deck.querySelector('[data-deck-prev]').disabled = s.i <= 0;
    deck.querySelector('[data-deck-next]').disabled = s.i >= n - 1;
  }
  var raf;
  track.addEventListener('scroll', function () {
    cancelAnimationFrame(raf); raf = requestAnimationFrame(update);
  }, { passive: true });
  deck.querySelector('[data-deck-prev]').addEventListener('click', function () { show(current().i - 1); });
  deck.querySelector('[data-deck-next]').addEventListener('click', function () { show(current().i + 1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current().i + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); show(current().i - 1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0); }
    else if (e.key === 'End') { e.preventDefault(); show(1e6); }
  });

  // Themes
  function setTheme(t) {
    theme = t;
    cards.forEach(function (c) {
      var ids = (c.dataset.themes || '').split(/\s+/);
      c.hidden = !(t === 'all' || ids.indexOf(t) > -1);
    });
    if (bar) bar.querySelectorAll('[data-theme]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.theme === t ? 'true' : 'false');
    });
    track.scrollTo({ left: 0, behavior: 'auto' });
    update();
  }
  if (bar) {
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-theme]'); if (b) setTheme(b.dataset.theme);
    });
    var hasHighlights = cards.some(function (c) { return (c.dataset.themes || '').indexOf('highlights') > -1; });
    setTheme(hasHighlights ? 'highlights' : 'all');
  } else update();

  // Career line stations jump to the first card of that role
  document.querySelectorAll('.career a.station').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var target = document.getElementById((a.getAttribute('href') || '').slice(1));
      if (!target) return;
      e.preventDefault();
      if (target.hidden) setTheme('all');
      var i = visible().indexOf(target);
      show(i);
      deck.scrollIntoView({ behavior: reduce() ? 'auto' : 'smooth', block: 'nearest' });
      target.classList.remove('pulse'); void target.offsetWidth; target.classList.add('pulse');
    });
  });
  window.addEventListener('resize', update);
})();
