/* Platform announcements on the departure board. Hover or focus shows one, and one appears every few minutes. */
(function () {
  'use strict';
  var board = document.querySelector('[data-board]'), line = board && board.querySelector('.dm-announce');
  if (!board || !line) return;
  var msgs = [
    'Please mind the gap between project delivery and live service.',
    'Please keep your change requests with you at all times.'
  ];
  var n = 0, timer = null, hide = null, every = null;
  function show(sticky) {
    line.textContent = msgs[n++ % msgs.length]; line.hidden = false;
    AW.found('board');
    clearTimeout(hide);
    if (!sticky) hide = setTimeout(function () { line.hidden = true; }, 12000);
  }
  function start() {
    board.tabIndex = 0;
    if (AW.reducedMotion()) { line.textContent = msgs[0]; line.hidden = false; return; }
    board.addEventListener('mouseenter', onIn); board.addEventListener('focus', onIn);
    every = setInterval(function () { show(false); }, 180000);
  }
  function onIn() { show(false); }
  function stop() {
    clearInterval(every); clearTimeout(hide); line.hidden = true; board.removeAttribute('tabindex');
    board.removeEventListener('mouseenter', onIn); board.removeEventListener('focus', onIn);
  }
  start();
  AW.egg('board', { start: start, stop: stop });
})();
