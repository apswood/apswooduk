/* Home page spotlight: one random card, a shuffle button, and the egg for seeing them all in one visit. */
(function () {
  'use strict';
  var box = document.querySelector('[data-spotlight]');
  var list = box && box.querySelector('[data-spot-list]');
  if (!list) return;
  var cards = Array.prototype.slice.call(list.children).filter(function (c) { return c.classList.contains('dcard'); });
  if (!cards.length) return;
  var btn = box.querySelector('[data-spot-shuffle]'), note = box.querySelector('[data-spot-note]');
  var seen = {}, seenN = 0, cur = -1, done = false;

  function pick() {
    var pool = cards.map(function (_, i) { return i; }).filter(function (i) { return i !== cur; });
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : 0;
  }
  function show(i, animate) {
    cards.forEach(function (c, k) { c.classList.toggle('is-on', k === i); c.classList.remove('spot-in'); });
    cur = i;
    if (!seen[i]) { seen[i] = 1; seenN++; }
    if (animate) { void cards[i].offsetWidth; cards[i].classList.add('spot-in'); }
  }
  show(pick(), false);
  if (cards.length < 2) return;

  if (btn) {
    btn.hidden = false;
    btn.addEventListener('click', function () {
      show(pick(), true);
      if (seenN === cards.length && !done && window.AW && !AW.serious()) {
        done = true;
        if (note) {
          note.hidden = false;
          note.textContent = 'That is every spotlight. The full timetable, with no cancellations.';
        }
        AW.found('shuffle');
      }
    });
  }
})();
