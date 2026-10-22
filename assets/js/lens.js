/* Lens toggle (printable CV). It only reorders for display. Without JS everything shows in data order. */
(function () {
  'use strict';
  var LENSES = ['balanced', 'operating-model', 'hands-on'];
  var params = new URLSearchParams(location.search);
  var lens = LENSES.indexOf(params.get('lens')) > -1 ? params.get('lens') : 'balanced';

  function tokens(el, attr) { return (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean); }

  // --- Lens: stable reorder, never removes anything ---
  var lists = document.querySelectorAll('[data-lens-list]');
  lists.forEach(function (list) {
    Array.prototype.forEach.call(list.children, function (c, i) { c.dataset.i = i; });
  });
  function applyLens() {
    lists.forEach(function (list) {
      var items = Array.prototype.slice.call(list.children).filter(function (c) { return c.dataset.i !== undefined; });
      items.sort(function (a, b) {
        var ra = lens !== 'balanced' && tokens(a, 'data-lenses').indexOf(lens) > -1 ? 0 : 1;
        var rb = lens !== 'balanced' && tokens(b, 'data-lenses').indexOf(lens) > -1 ? 0 : 1;
        return ra - rb || a.dataset.i - b.dataset.i;
      });
      items.forEach(function (c) { list.appendChild(c); });
    });
    document.querySelectorAll('[data-lens-toggle] [data-lens]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.lens === lens ? 'true' : 'false');
    });
    // Carry the lens through internal links so a tailored link stays tailored.
    document.querySelectorAll('a[href^="/"]').forEach(function (a) {
      var u = new URL(a.getAttribute('href'), location.origin);
      if (lens === 'balanced') u.searchParams.delete('lens'); else u.searchParams.set('lens', lens);
      a.setAttribute('href', u.pathname + u.search + u.hash);
    });
  }
  function syncUrl() {
    var u = new URL(location.href);
    if (lens === 'balanced') u.searchParams.delete('lens'); else u.searchParams.set('lens', lens);
    history.replaceState(null, '', u);
  }
  document.querySelectorAll('[data-lens-toggle]').forEach(function (t) {
    t.hidden = false;
    t.addEventListener('click', function (e) {
      var b = e.target.closest('[data-lens]'); if (!b) return;
      lens = b.dataset.lens; applyLens(); syncUrl();
    });
  });
  applyLens();
})();
