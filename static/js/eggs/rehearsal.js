/* The rehearsal: "Run it again" changes one tiny detail each time. After the fifth run, we are over-prepared. */
(function () {
  'use strict';
  var root = document.querySelector('[data-egg-page="rehearsal"]');
  if (!root) return;
  var btn = root.querySelector('[data-rerun]'), msg = root.querySelector('[data-run-msg]');
  var d = JSON.parse(document.getElementById('rehearsal-details').textContent);
  var order = ['pen', 'weather', 'chair'], idx = { pen: 0, weather: 0, chair: 0 }, runs = 0;
  function run() {
    runs++;
    var k = order[(runs - 1) % order.length];
    idx[k] = (idx[k] + 1) % d[k].length;
    root.querySelectorAll('[data-detail="' + k + '"]').forEach(function (s) { s.textContent = d[k][idx[k]]; });
    msg.textContent = runs >= 5 ? 'We are now over-prepared. This is fine.' : 'Run ' + runs + ': one detail changed (' + k + ').';
  }
  function start() { btn.hidden = false; btn.addEventListener('click', run); }
  function stop() { btn.hidden = true; btn.removeEventListener('click', run); }
  start();
  AW.egg('rehearsal', { start: start, stop: stop });
})();
