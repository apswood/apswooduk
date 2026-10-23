/* The signal box egg: a four-aspect colour-light signal on the career line. */
(function () {
  'use strict';
  var btn = document.querySelector('[data-signal]'), cap = document.querySelector('[data-signal-cap]');
  if (!btn) return;
  var aspects = [
    { k: 'red', name: 'red', cap: 'Red. Stop. This is a red aspect, not a suggestion.' },
    { k: 'yellow', name: 'single yellow', cap: 'Single yellow. Caution. Be prepared to stop at the next signal, which is the correct reading and not a metaphor.' },
    { k: 'double', name: 'double yellow', cap: 'Double yellow. Attention. The next signal is at single yellow, so please prepare to prepare.' },
    { k: 'green', name: 'green', cap: 'Route set. Points locked. ', link: 'Proceed', tail: '.' }
  ];
  var i = 0;
  function show() {
    var a = aspects[i];
    btn.dataset.aspect = a.k;
    btn.setAttribute('aria-label', 'Signal showing ' + a.name + '. Activate to change the aspect.');
    cap.textContent = a.cap;
    if (a.link) {
      var l = document.createElement('a');
      l.href = '/status/'; l.textContent = a.link;
      cap.appendChild(l); cap.appendChild(document.createTextNode(a.tail || ''));
    }
    if (a.k === 'green') AW.found('signal');
  }
  function start() { btn.hidden = false; btn.dataset.aspect = 'red'; }
  function stop() { btn.hidden = true; cap.textContent = ''; i = 0; }
  btn.addEventListener('click', function () { i = (i + 1) % aspects.length; show(); });
  start();
  AW.egg('signal', { start: start, stop: stop });
})();
