/* Retro mode: an original 2004-era personal homepage reskin. Konami code toggles it. Esc or turning Easter Egg mode off restores the site. */
(function () {
  'use strict';
  var root = document.documentElement, active = false, style = null, added = [], ask = null;

  var css =
    'html.retro:root{--bg:#dfe8f5;--surface:#f3f3a0;--ink:#111;--muted:#2b2b2b;--accent:#0000cc;--accent-ink:#fff;--focus:#cc0000;--head:Verdana,Geneva,sans-serif;--body:Verdana,Geneva,sans-serif}' +
    'html.retro body{font-size:15px;background-color:#dfe8f5;background-image:linear-gradient(45deg,#d3dff0 25%,transparent 25% 75%,#d3dff0 75%),linear-gradient(45deg,#d3dff0 25%,transparent 25% 75%,#d3dff0 75%);background-size:24px 24px;background-position:0 0,12px 12px}' +
    'html.retro a{text-decoration:underline}' +
    'html.retro .divider{display:none}' +
    'html.retro .chip,html.retro .btn{border-radius:0;border:2px outset #888;background:#e8e8e8;color:#111}' +
    'html.retro .card,html.retro .comp,html.retro .board-dm{border-radius:0}' +
    '.retro-banner{border:3px ridge #6a6aa8;background:#fff;color:#111;padding:8px 12px;margin:0 0 14px;font-weight:bold;max-width:none}' +
    '.retro-new{background:#cc0000;color:#fff;padding:0 6px;margin-left:8px;font-size:.8em;animation:retro-blink 1.4s steps(1) 3}' +
    '@keyframes retro-blink{50%{background:#000}}' +
    '.retro-counter{display:inline-block;border:2px inset #888;background:#000;color:#39ff14;font:13px/1.4 "Courier New",monospace;padding:4px 8px;margin:0 0 14px;max-width:none}' +
    '.retro-foot{border-top:3px double #6a6aa8;margin-top:24px;padding-top:12px;font-size:.9rem;max-width:none}' +
    '.retro-ask{background:#fff;color:#111;border:3px ridge #6a6aa8;padding:14px 18px;margin:0 0 18px;font-family:"Courier New",monospace}' +
    '.retro-ask h2{font-family:Verdana,Geneva,sans-serif;margin-top:0;color:#111}.retro-ask dt{font-weight:bold;margin-top:.8em}.retro-ask dd{margin:0 0 0 1.2em}' +
    '.retro-cursor{animation:retro-cursor 1s steps(1) 4}@keyframes retro-cursor{50%{opacity:0}}' +
    '@media(prefers-reduced-motion:reduce){.retro-new,.retro-cursor{animation:none}}';

  var QA = [
    ['Do you like trains?', 'Yes. Mostly the timetable.'],
    ['Is this website finished?', 'No.'],
    ['Do you still play the saxophone?', 'Yes. The neighbours have opinions.'],
    ['What does the visitor counter count?', 'Nothing. It is decorative.'],
    ['Can I sign the guestbook?', 'The guestbook is closed for maintenance. It has been closed since 2006.'],
    ['How do I get in touch?', 'Use the Contact page. It has a LinkedIn button.']
  ];
  var RING = ['/', '/about/', '/experience/', '/approach/', '/off-the-clock/', '/contact/'];

  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; }

  function on() {
    active = true; root.classList.add('retro');
    style = el('style'); style.textContent = css; document.head.appendChild(style);
    var main = document.getElementById('main');
    var name = (document.querySelector('.brand') || {}).textContent || 'Andrew';
    var banner = el('p', 'retro-banner', 'Welcome to ' + name + "'s Home Page!");
    banner.appendChild(el('span', 'retro-new', 'NEW!'));
    var counter = el('p', 'retro-counter', 'Visitors: Decorative. No visitors were counted.');
    var askBtn = el('button', 'chip', 'Ask Andrew'); askBtn.type = 'button'; askBtn.setAttribute('aria-expanded', 'false');
    askBtn.addEventListener('click', function () {
      if (ask) { ask.remove(); ask = null; askBtn.setAttribute('aria-expanded', 'false'); return; }
      ask = el('section', 'retro-ask'); ask.setAttribute('aria-label', 'Ask Andrew');
      ask.appendChild(el('h2', '', 'Ask Andrew'));
      var dl = el('dl');
      QA.forEach(function (qa) { dl.appendChild(el('dt', '', 'Q: ' + qa[0])); dl.appendChild(el('dd', '', 'A: ' + qa[1])); });
      ask.appendChild(dl);
      var p = el('p', '', 'C:\\> '); p.appendChild(el('span', 'retro-cursor', '_')); ask.appendChild(p);
      banner.parentNode.insertBefore(ask, counter.nextSibling);
      askBtn.setAttribute('aria-expanded', 'true');
    });
    var wrap = el('div'); wrap.appendChild(banner); wrap.appendChild(counter); wrap.appendChild(el('p')); wrap.lastChild.appendChild(askBtn);
    main.insertBefore(wrap, main.firstChild); added.push(wrap);

    var i = RING.indexOf(location.pathname); if (i < 0) i = 0;
    var foot = el('div', 'retro-foot');
    var ring = el('p'); ring.appendChild(document.createTextNode('Webring: '));
    function link(label, href) { var a = el('a', '', label); a.href = href; return a; }
    ring.appendChild(link('Previous', RING[(i + RING.length - 1) % RING.length])); ring.appendChild(document.createTextNode(' | '));
    ring.appendChild(link('Random', RING[Math.floor(Math.random() * RING.length)])); ring.appendChild(document.createTextNode(' | '));
    ring.appendChild(link('Next', RING[(i + 1) % RING.length]));
    foot.appendChild(ring); foot.appendChild(el('p', '', 'Guestbook closed for maintenance since 2006.'));
    foot.appendChild(el('p', '', 'Press Escape to return to the present.'));
    var f = document.querySelector('.foot'); f.appendChild(foot); added.push(foot);
    AW.found('retro');
  }

  function off() {
    active = false; root.classList.remove('retro');
    if (style) style.remove(); style = null; ask = null;
    added.forEach(function (n) { n.remove(); }); added = [];
  }

  document.addEventListener('keydown', function (e) { if (active && e.key === 'Escape') off(); });
  AW.egg('retro', { toggle: function () { if (active) off(); else on(); }, stop: off });
})();
