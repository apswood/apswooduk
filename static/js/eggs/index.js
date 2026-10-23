/* The egg index. Unlocks after three finds. Reads the list from /eggs.json and finds from the browser. */
(function () {
  'use strict';
  var box = document.querySelector('[data-egg-page="index"]');
  if (!box) return;
  var locked = box.querySelector('[data-locked]'), list = box.querySelector('[data-list]'), cache = null;
  function render(eggs) {
    cache = eggs;
    list.innerHTML = '';
    var f = AW.foundList(), n = Object.keys(f).length;
    if (n < 3) { list.hidden = true; return; }
    var first = Math.min.apply(null, Object.keys(f).map(function (k) { return f[k]; }));
    locked.textContent = 'Found ' + n + ' of ' + eggs.length + '. First find recorded at ' + new Date(first).toLocaleString('en-GB') + '. There is also a note in the page source.';
    eggs.forEach(function (e) {
      var li = document.createElement('li'), got = f[e.id];
      var t = got ? e.name : 'Not yet found';
      li.innerHTML = '<strong></strong> <span></span>';
      li.firstChild.textContent = t + '.';
      li.lastChild.textContent = got ? ' ' + e.how + ' First found ' + new Date(got).toLocaleDateString('en-GB') + ' at ' + new Date(got).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '.' : ' Keep looking.';
      list.appendChild(li);
    });
    list.hidden = false;
  }
  function start() {
    if (cache) render(cache);
    else fetch('/eggs.json').then(function (r) { return r.json(); }).then(render);
  }
  start();
  AW.egg('index', { start: start, stop: function () { list.hidden = true; } });
})();
