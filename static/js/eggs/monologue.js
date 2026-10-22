/* Inner monologue mode on the Approach page. Off by default. Up to five italic asides. */
(function () {
  'use strict';
  var btn = null, items = [];
  function build() {
    var thoughts = JSON.parse(btn.dataset.thoughts || '[]').slice(0, 5);
    var host = document.getElementById('main');
    var spots = [];
    host.querySelectorAll('h1, p:not(.egg-row)').forEach(function (a) { spots.push(a); });
    thoughts.forEach(function (t, i) {
      var p = document.createElement('p');
      p.className = 'thought'; p.textContent = t; p.setAttribute('aria-hidden', 'true');
      var at = spots[Math.min(i, spots.length - 1)];
      if (at) at.parentNode.insertBefore(p, at.nextSibling);
      items.push(p);
    });
    var st = document.createElement('style');
    st.textContent = '.thought{font-style:italic;color:var(--muted);border-left:3px solid var(--accent);padding-left:12px;margin:.6em 0}';
    document.head.appendChild(st);
  }
  function show(on) {
    items.forEach(function (p) { p.hidden = !on; });
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    var live = document.getElementById('aw-monologue-live');
    if (live) live.textContent = on ? 'Inner monologue on.' : 'Inner monologue off.';
  }
  function toggle(b) {
    btn = b;
    if (!items.length) {
      build();
      var live = document.createElement('p'); live.id = 'aw-monologue-live'; live.className = 'sr-only'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
      document.body.appendChild(live);
      show(true); AW.found('monologue'); return;
    }
    show(items[0].hidden);
  }
  AW.egg('monologue', { toggle: toggle, stop: function () { if (btn) show(false); } });
})();
