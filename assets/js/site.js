/* Site shell: theme, Easter Egg mode, and the contract every easter egg follows. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;

  function store(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  // Theme: system (no attribute) -> light -> dark -> system
  var themeBtn = document.getElementById('theme-toggle');
  var labels = { '': 'Theme: system', light: 'Theme: Midsummer', dark: 'Theme: Polar night' };
  function showTheme() {
    if (themeBtn) themeBtn.textContent = labels[root.dataset.theme || ''];
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.dataset.theme || '';
      var next = cur === '' ? 'light' : cur === 'light' ? 'dark' : '';
      if (next) { root.dataset.theme = next; store('aw-theme', next); }
      else { delete root.dataset.theme; store('aw-theme', null); }
      showTheme();
    });
    showTheme();
  }

  // Easter Egg mode: on by default. Turning it off sets the internal serious flag, which switches off every egg and surprise element.
  var sBtn = document.getElementById('egg-toggle');
  function isSerious() { return root.dataset.serious === '1'; }
  function showSerious() {
    if (!sBtn) return;
    sBtn.setAttribute('aria-pressed', isSerious() ? 'false' : 'true');
    sBtn.textContent = 'Easter Egg Hunt Mode: ' + (isSerious() ? 'Off' : 'On');
  }
  if (sBtn) {
    sBtn.hidden = false;
    sBtn.addEventListener('click', function () {
      if (isSerious()) { delete root.dataset.serious; store('aw-serious', null); }
      else { root.dataset.serious = '1'; store('aw-serious', '1'); }
      showSerious();
      document.dispatchEvent(new CustomEvent('aw:serious', { detail: isSerious() }));
    });
    showSerious();
  }

  var controls = document.querySelector('.controls');
  if (controls) controls.hidden = false;

  // Egg contract. An egg is a script in /js/eggs/<name>.js that calls AW.egg(name, { start, stop }).
  // Eggs load only on demand, never when Easter Egg mode is off, and must stop() on 'aw:serious'.
  var registry = {};
  window.AW = {
    serious: isSerious,
    reducedMotion: function () { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
    egg: function (name, api) { registry[name] = api; return api; },
    load: function (name) {
      if (isSerious()) return Promise.resolve(null);
      if (registry[name]) return Promise.resolve(registry[name]);
      return new Promise(function (resolve) {
        var s = document.createElement('script');
        s.src = '/js/eggs/' + name + '.js'; s.onload = function () { resolve(registry[name] || null); };
        s.onerror = function () { resolve(null); };
        document.head.appendChild(s);
      });
    },
    store: store, read: read
  };
  document.addEventListener('aw:serious', function (e) {
    if (e.detail) Object.keys(registry).forEach(function (k) { if (registry[k].stop) registry[k].stop(); });
  });
})();

/* Egg plumbing: found counter, egg index unlock, lazy loading of each egg. */
(function () {
  'use strict';
  var AW = window.AW, root = document.documentElement, mem = {};
  function getFound() {
    try { return JSON.parse(AW.read('aw-found') || '{}'); } catch (e) { return mem; }
  }
  function saveFound(o) { mem = o; AW.store('aw-found', JSON.stringify(o)); }
  var countEl = document.querySelector('.eggs-count'), indexEl = document.querySelector('[data-egg-index]');
  function render() {
    if (!countEl) return;
    var f = getFound(), n = Object.keys(f).length, total = +countEl.dataset.total || 0;
    if (n > 0) { countEl.hidden = false; countEl.textContent = 'Eggs found: ' + n + ' of ' + total; }
    if (indexEl && n >= 3) indexEl.hidden = false;
  }
  AW.found = function (id) {
    if (AW.serious()) return;
    var f = getFound();
    if (f[id]) return;
    f[id] = Date.now(); saveFound(f); render();
  };
  AW.foundList = getFound;
  render();

  function idle(fn) { (window.requestIdleCallback || function (f) { setTimeout(f, 1200); })(fn); }
  function when(sel, name, boot) {
    if (!document.querySelector(sel) || AW.serious()) return;
    idle(function () { AW.load(name).then(function (e) { if (e && boot) boot(e); }); });
  }
  // Terminal: backtick or the footer glyph.
  function openTerminal() { AW.load('terminal').then(function (t) { if (t) t.toggle(); }); }
  document.addEventListener('keydown', function (e) {
    if (e.key !== '`' || e.ctrlKey || e.metaKey || e.altKey) return;
    var t = e.target, tag = t && t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return;
    e.preventDefault(); openTerminal();
  });
  var tb = document.querySelector('[data-terminal]');
  if (tb) tb.addEventListener('click', openTerminal);
  AW.openTerminal = openTerminal;

  // Dig: loaded when the control is first used.
  var dig = document.getElementById('dig-open');
  if (dig) dig.addEventListener('click', function () { AW.load('dig').then(function (d) { if (d) d.toggle(dig); }); });

  when('[data-signal]', 'signal');
  when('[data-board]', 'board');
  when('[data-egg-page="index"]', 'index');
  var pg = document.querySelector('[data-egg-page]');
  if (pg) {
    var pmap = { status: 'status', improve: 'improve', rehearsal: 'rehearsal', connections: 'map' };
    if (pmap[pg.dataset.eggPage]) AW.found(pmap[pg.dataset.eggPage]);
  }
  when('[data-egg-page="rehearsal"]', 'rehearsal');
  when('[data-egg-page="connections"]', 'connections');
  when('[data-pause]', 'pause');

  // Generic trigger: any element with data-egg-click="name" loads that egg and toggles it.
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-egg-click]');
    if (!t) return;
    AW.load(t.dataset.eggClick).then(function (x) { if (x && x.toggle) x.toggle(t); });
  });

  // Konami code: retro mode.
  var seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], pos = 0;
  document.addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === seq[pos]) { pos++; if (pos === seq.length) { pos = 0; AW.load('retro').then(function (r) { if (r) r.toggle(); }); } }
    else pos = (k === seq[0]) ? 1 : 0;
  });
})();
