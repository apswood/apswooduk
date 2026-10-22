/* The awkward pause. Once per session, on first opening Contact. Never with reduced motion or Serious mode. */
(function () {
  'use strict';
  var el = document.querySelector('[data-pause]'), timer = null;
  if (!el) return;
  var seen = false;
  try { seen = sessionStorage.getItem('aw-pause') === '1'; } catch (e) {}
  function start() {
    if (seen || AW.reducedMotion() || AW.serious()) return;
    try { sessionStorage.setItem('aw-pause', '1'); } catch (e) {}
    seen = true; el.hidden = false; el.textContent = '…';
    timer = setTimeout(function () { el.textContent = 'Sorry. I wanted to see if you would fill the silence.'; AW.found('pause'); }, 3000);
  }
  function stop() { clearTimeout(timer); el.hidden = true; el.textContent = ''; }
  start();
  AW.egg('pause', { start: start, stop: stop });
})();
