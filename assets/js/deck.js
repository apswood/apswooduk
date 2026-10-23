/* Experience page: the career line and the role cards move together.
   Selecting a station (or a card) parks the train just below that station and shows the role.
   Without JS the stations are anchor links and every role card is visible in a list. */
(function () {
  'use strict';
  var deck = document.querySelector('[data-deck]');
  if (!deck) return;
  var track = deck.querySelector('[data-deck-track]');
  var ctl = deck.querySelector('[data-deck-ctl]');
  var count = deck.querySelector('[data-deck-count]');
  var prev = deck.querySelector('[data-deck-prev]');
  var next = deck.querySelector('[data-deck-next]');
  var bar = document.querySelector('[data-themes-bar]');
  var svg = document.querySelector('[data-tube]');
  var train = svg && svg.querySelector('[data-train]');
  var cards = Array.prototype.slice.call(track.children);
  var stations = svg ? Array.prototype.slice.call(svg.querySelectorAll('.station')) : [];
  var segs = svg ? Array.prototype.slice.call(svg.querySelectorAll('.seg')) : [];
  var reduced = function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var DEFAULT_THEME = 'highlights';
  var idx = 0, theme = DEFAULT_THEME, D = 0, anim = 0, scrollT;

  deck.classList.add('is-deck');
  ctl.hidden = false;
  if (bar) bar.hidden = false;

  // --- Train: distance along the track, measured from the top of the first segment ---
  var cum = [0];
  segs.forEach(function (s) { cum.push(cum[cum.length - 1] + s.getTotalLength()); });
  var total = cum[cum.length - 1];
  function nodeD(i) { return Math.min(total, cum[Math.min(i, segs.length)] + 36); }
  function place(d) {
    if (!train || !segs.length) return;
    var k = 0;
    while (k < segs.length - 1 && d > cum[k + 1]) k++;
    var local = Math.max(0, Math.min(segs[k].getTotalLength(), d - cum[k]));
    var p = segs[k].getPointAtLength(local), q = segs[k].getPointAtLength(Math.min(segs[k].getTotalLength(), local + 1));
    var tx = q.x - p.x, ty = q.y - p.y;
    var deg = Math.atan2(-tx, ty) * 180 / Math.PI;
    train.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ') rotate(' + deg.toFixed(1) + ')');
  }
  // cubic-bezier(0.22, 1, 0.36, 1)
  function ease(t) {
    var x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1;
    function bx(s) { return 3 * (1 - s) * (1 - s) * s * x1 + 3 * (1 - s) * s * s * x2 + s * s * s; }
    function by(s) { return 3 * (1 - s) * (1 - s) * s * y1 + 3 * (1 - s) * s * s * y2 + s * s * s; }
    var lo = 0, hi = 1, s = t;
    for (var i = 0; i < 18; i++) { s = (lo + hi) / 2; if (bx(s) < t) lo = s; else hi = s; }
    return by(s);
  }
  function moveTrain(to, instant) {
    cancelAnimationFrame(anim);
    if (instant || reduced()) { D = to; place(D); return; }
    var from = D, t0 = performance.now(), dur = 400;
    (function step(now) {
      var t = Math.min(1, (now - t0) / dur);
      D = from + (to - from) * ease(t); place(D);
      if (t < 1) anim = requestAnimationFrame(step);
    })(t0);
  }

  // --- Selection ---
  function cardAt(i) { return cards[i]; }
  function cardLeft(i) { return cards[i].offsetLeft - track.offsetLeft; }
  function select(i, opts) {
    opts = opts || {};
    idx = Math.max(0, Math.min(cards.length - 1, i));
    if (opts.scroll !== false) track.scrollTo({ left: cardLeft(idx), behavior: opts.instant || reduced() ? 'auto' : 'smooth' });
    cards.forEach(function (c, j) { c.classList.toggle('is-current', j === idx); });
    stations.forEach(function (s, j) {
      var on = j === idx;
      s.classList.toggle('is-active', on);
      if (on) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current');
    });
    count.textContent = 'Role ' + (idx + 1) + ' of ' + cards.length;
    prev.disabled = idx <= 0; next.disabled = idx >= cards.length - 1;
    var st = stations[idx];
    if (st) moveTrain(nodeD(+st.dataset.node), opts.instant);
    updateChips();
  }

  // Only offer themes that apply to the selected role. Highlights and All always show.
  function updateChips() {
    if (!bar) return;
    var have = {};
    Array.prototype.forEach.call(cards[idx].querySelectorAll('[data-outcomes] > li'), function (li) {
      (li.getAttribute('data-themes') || '').split(/\s+/).forEach(function (t) { if (t) have[t] = true; });
    });
    bar.querySelectorAll('[data-theme]').forEach(function (b) {
      var id = b.dataset.theme;
      b.hidden = !(id === 'highlights' || id === 'all' || have[id]);
    });
    if (theme !== 'all' && bar.querySelector('[data-theme="' + theme + '"]').hidden) setTheme(DEFAULT_THEME);
  }

  // --- Themes: show the matching outcomes inside each role card ---
  function setTheme(t) {
    var known = bar && bar.querySelector('[data-theme="' + t + '"]');
    theme = known ? t : DEFAULT_THEME;
    cards.forEach(function (c) {
      var items = c.querySelectorAll('[data-outcomes] > li'), shown = 0;
      Array.prototype.forEach.call(items, function (li) {
        var ids = (li.getAttribute('data-themes') || '').split(/\s+/);
        li.hidden = !(theme === 'all' || ids.indexOf(theme) > -1);
        if (!li.hidden) shown++;
      });
      var empty = c.querySelector('.rempty');
      if (empty) empty.hidden = !items.length || shown > 0;
    });
    if (bar) bar.querySelectorAll('[data-theme]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.theme === theme ? 'true' : 'false');
    });
  }
  if (bar) bar.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme]'); if (b) setTheme(b.dataset.theme);
  });

  // --- Controls ---
  prev.addEventListener('click', function () { select(idx - 1); });
  next.addEventListener('click', function () { select(idx + 1); });
  track.addEventListener('keydown', function (e) {
    if (e.target !== track) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); select(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); select(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); select(0); }
    else if (e.key === 'End') { e.preventDefault(); select(cards.length - 1); }
  });
  track.addEventListener('scroll', function () {
    clearTimeout(scrollT);
    scrollT = setTimeout(function () {
      var best = 0, d = 1e9;
      cards.forEach(function (c, j) { var dx = Math.abs(cardLeft(j) - track.scrollLeft); if (dx < d) { d = dx; best = j; } });
      if (best !== idx) select(best, { scroll: false });
    }, 90);
  }, { passive: true });
  stations.forEach(function (s, j) {
    s.addEventListener('click', function (e) {
      e.preventDefault();
      select(j);
      var r = deck.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) deck.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('[data-goto]'), function (a) {
    a.addEventListener('click', function (e) {
      var j = cards.findIndex(function (c) { return c.id === (a.getAttribute('href') || '').slice(1); });
      if (j < 0) return;
      e.preventDefault(); select(j);
      var r = deck.getBoundingClientRect();
      if (r.top < 0 || r.top > window.innerHeight * 0.6) deck.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    });
  });
  window.addEventListener('resize', function () { track.scrollTo({ left: cardLeft(idx), behavior: 'auto' }); place(D); });

  setTheme(DEFAULT_THEME);
  var hash = location.hash.slice(1), start = cards.findIndex(function (c) { return c.id === hash; });
  select(start > -1 ? start : 0, { instant: true });
})();
