/* Departure board egg: platform announcements + Solari-style split-flap cycling on the second service row. */
(function () {
  'use strict';
  var board = document.querySelector('[data-board]');
  var line = board && board.querySelector('.dm-announce');
  var nextRow = board && board.querySelector('.dm-next');
  var nextDest = nextRow && nextRow.querySelector('.dm-dest');
  var nextTime = nextRow && nextRow.querySelector('.dm-time');
  if (!board || !line) return;

  var origDest = nextDest ? nextDest.textContent : '';
  var origTime = nextTime ? nextTime.textContent : '';

  var msgs = [
    'Please mind the gap between project delivery and live service.',
    'Please keep your change requests with you at all times.'
  ];
  var services = [
    { dest: origDest || 'Next Opportunity', time: origTime || 'To be announced' },
    { dest: 'Managed Services', time: 'London / Hybrid' },
    { dest: 'Service Delivery', time: 'Boarding soon' }
  ];
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/: ';

  var css = '.board-dm.is-flap .sf-wrap{display:inline-flex;flex-wrap:wrap;gap:2px;vertical-align:baseline}' +
    '.board-dm.is-flap .sf-ch{position:relative;display:inline-block;min-width:.62em;text-align:center;padding:1px 2px;border-radius:2px;background:#1a1e22;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 1px 1px rgba(0,0,0,.6);line-height:1.15}' +
    '.board-dm.is-flap .sf-ch::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.55);pointer-events:none}' +
    '.board-dm.is-flap .sf-ch.sf-sp{background:transparent;box-shadow:none;min-width:.35em}' +
    '.board-dm.is-flap .sf-ch.sf-sp::after{display:none}' +
    '.board-dm.is-flap .sf-ch.sf-flip{animation:sf-tick .11s ease-in-out}' +
    '@keyframes sf-tick{0%{transform:perspective(120px) rotateX(0deg)}50%{transform:perspective(120px) rotateX(-68deg);filter:brightness(.7)}100%{transform:perspective(120px) rotateX(0deg)}}';

  var styleEl = null, n = 0, sIdx = 0, paused = false;
  var hide = null, every = null, flapEvery = null, timers = [];

  function clearFlapTimers() {
    while (timers.length) clearTimeout(timers.pop());
  }

  function renderStatic(el, text) {
    if (!el) return;
    el.removeAttribute('aria-label');
    el.textContent = text;
  }

  function flapTo(el, target) {
    if (!el) return;
    var upper = target.toUpperCase();
    var prev = (el.getAttribute('aria-label') || el.textContent || '').toUpperCase();
    el.setAttribute('aria-label', target);
    el.textContent = '';
    var wrap = document.createElement('span');
    wrap.className = 'sf-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    var spans = [];
    for (var i = 0; i < upper.length; i++) {
      var ch = document.createElement('span');
      ch.className = 'sf-ch' + (upper[i] === ' ' ? ' sf-sp' : '');
      ch.textContent = prev[i] && prev[i] !== ' ' ? prev[i] : (upper[i] === ' ' ? '\u00a0' : ALPHABET[(i * 7) % 26]);
      wrap.appendChild(ch);
      spans.push(ch);
    }
    el.appendChild(wrap);

    spans.forEach(function (sp, idx) {
      var goal = upper[idx];
      if (goal === ' ') { sp.textContent = '\u00a0'; return; }
      var steps = 3 + (idx % 4);
      var baseDelay = idx * 35;
      for (var k = 1; k <= steps; k++) {
        (function (step, isLast) {
          var id = setTimeout(function () {
            sp.textContent = isLast ? goal : ALPHABET[(Math.floor(Math.random() * 36))];
            sp.classList.remove('sf-flip');
            void sp.offsetWidth;
            sp.classList.add('sf-flip');
          }, baseDelay + step * 65);
          timers.push(id);
        })(k, k === steps);
      }
    });
  }

  function stepService() {
    if (paused || !nextDest || !nextTime) return;
    sIdx = (sIdx + 1) % services.length;
    flapTo(nextDest, services[sIdx].dest);
    flapTo(nextTime, services[sIdx].time);
  }

  function show(sticky) {
    line.textContent = msgs[n++ % msgs.length];
    line.hidden = false;
    AW.found('board');
    clearTimeout(hide);
    if (!sticky) hide = setTimeout(function () { line.hidden = true; }, 12000);
  }

  function onIn() { paused = true; show(false); }
  function onOut() { paused = false; }

  function start() {
    board.tabIndex = 0;
    if (AW.reducedMotion()) { line.textContent = msgs[0]; line.hidden = false; return; }
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
    }
    board.classList.add('is-flap');
    paused = false;
    sIdx = 0;
    if (nextDest && nextTime) {
      flapTo(nextDest, services[0].dest);
      flapTo(nextTime, services[0].time);
      flapEvery = setInterval(stepService, 8500);
    }
    board.addEventListener('mouseenter', onIn);
    board.addEventListener('mouseleave', onOut);
    board.addEventListener('focus', onIn);
    board.addEventListener('blur', onOut);
    every = setInterval(function () { show(false); }, 180000);
  }

  function stop() {
    clearInterval(every);
    clearInterval(flapEvery);
    clearTimeout(hide);
    clearFlapTimers();
    line.hidden = true;
    board.classList.remove('is-flap');
    board.removeAttribute('tabindex');
    board.removeEventListener('mouseenter', onIn);
    board.removeEventListener('mouseleave', onOut);
    board.removeEventListener('focus', onIn);
    board.removeEventListener('blur', onOut);
    renderStatic(nextDest, origDest);
    renderStatic(nextTime, origTime);
  }

  start();
  AW.egg('board', { start: start, stop: stop });
})();
