/* How it all connects: hover or focus a node to light up what it depends on. */
(function () {
  'use strict';
  var svg = document.querySelector('[data-graph]');
  if (!svg) return;
  var nodes = svg.querySelectorAll('.node'), edges = svg.querySelectorAll('.edge');
  function light(id) {
    var near = {}; near[id] = true;
    edges.forEach(function (e) {
      var on = e.dataset.a === id || e.dataset.b === id;
      e.classList.toggle('lit', on);
      if (on) { near[e.dataset.a] = true; near[e.dataset.b] = true; }
    });
    nodes.forEach(function (n) { n.classList.toggle('lit', !!near[n.dataset.id]); n.classList.toggle('dim', !near[n.dataset.id]); });
  }
  function clear() { edges.forEach(function (e) { e.classList.remove('lit'); }); nodes.forEach(function (n) { n.classList.remove('lit', 'dim'); }); }
  function start() {
    svg.removeAttribute('aria-hidden');
    nodes.forEach(function (n) {
      n.setAttribute('tabindex', '0'); n.setAttribute('role', 'button');
      n.setAttribute('aria-label', n.textContent.trim() + '. Highlights what it connects to.');
      n.addEventListener('mouseenter', function () { light(n.dataset.id); });
      n.addEventListener('focus', function () { light(n.dataset.id); });
      n.addEventListener('mouseleave', clear); n.addEventListener('blur', clear);
    });
  }
  AW.egg('connections', { start: start, stop: clear });
  start();
})();
