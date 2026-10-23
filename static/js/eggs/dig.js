/* Beneath the street. Original strata, a detector, and a finds log. Loaded when the Dig control is first used. */
(function () {
  'use strict';
  var sec = null, data = null, btn = null, sndBtn = null, audio = null, osc = null, gain = null;
  var detector = false, sound = false, dug = {}, mx = -999, my = -999;

  var css =
    '.dig{max-width:1120px;margin:0 auto;padding:0 var(--m,20px) 60px;position:relative}.dig[hidden]{display:none}' +
    '.dig-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 16px}' +
    '.dig-strata{list-style:none;margin:0;padding:0}' +
    '.stratum{max-width:none;position:relative;min-height:62vh;overflow:hidden;color:#fff;display:flex;flex-direction:column;justify-content:flex-end}' +
    '.stratum-art{position:absolute;inset:0}.stratum-art svg.bg{width:100%;height:100%;display:block}' +
    '.stratum-text{position:relative;z-index:2;padding:20px;background:rgba(0,0,0,.55);max-width:60ch}' +
    '.stratum-text h2{margin:0 0 .3rem;color:#fff;font-size:1.3rem}.stratum-text p{margin:0}' +
    '.dig .reveal{opacity:0;transition:opacity .8s}.dig .reveal.in{opacity:1}' +
    '.find{position:absolute;z-index:3;width:56px;height:56px;margin:-28px 0 0 -28px;border:0;border-radius:50%;background:transparent;padding:6px;cursor:pointer;opacity:.28;transition:opacity .4s,transform .4s}' +
    '.find svg{width:100%;height:100%}.find:hover,.find:focus-visible{opacity:.7}.find.dug{opacity:1;transform:scale(1.15);cursor:default}' +
    '.find:focus-visible,.dig button:focus-visible{outline:3px solid #ffb070;outline-offset:3px}' +
    '.dig-log{background:var(--surface,#eee);padding:18px 20px;margin-top:20px}.dig-log h2{margin:0 0 .4rem;font-size:1.2rem}.dig-log ul{margin:0;padding-left:1.1rem}' +
    '.dig-final{font-family:var(--head,serif);font-size:1.4rem;margin:28px 0 0}' +
    '.dig.detecting .stratum{cursor:none}.dig.detecting .find{cursor:none}' +
    '.dig-ring{position:fixed;width:64px;height:64px;margin:-32px 0 0 -32px;border:4px solid #ffcc00;border-radius:50%;pointer-events:none;z-index:60;display:none;box-shadow:0 0 0 2px #000}' +
    '.dig:not([hidden]).detecting~.dig-ring{display:block}' +
    '@media(prefers-reduced-motion:reduce){.dig .reveal{opacity:1;transition:none}.find{transition:none}}';

  var art = {
    paving: '<svg class="bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#8e8e8a"/><g fill="#a3a39e" stroke="#6c6c68" stroke-width="2"><rect x="0" y="0" width="100" height="50"/><rect x="100" y="0" width="100" height="50"/><rect x="200" y="0" width="100" height="50"/><rect x="300" y="0" width="100" height="50"/><rect x="-50" y="50" width="100" height="50"/><rect x="50" y="50" width="100" height="50"/><rect x="150" y="50" width="100" height="50"/><rect x="250" y="50" width="100" height="50"/><rect x="350" y="50" width="100" height="50"/></g><rect y="100" width="400" height="100" fill="#6a5a48"/></svg>',
    ducts: '<svg class="bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#6a5a48"/><g fill="#333" stroke="#e9a23b" stroke-width="5"><circle cx="70" cy="100" r="28"/><circle cx="140" cy="100" r="28"/><circle cx="210" cy="100" r="28"/></g><g fill="#222" stroke="#4fa3d1" stroke-width="5"><circle cx="300" cy="70" r="20"/><circle cx="350" cy="130" r="20"/></g></svg>',
    sewer: '<svg class="bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#7a4a3a"/><path d="M60 200 V110 A140 100 0 0 1 340 110 V200 Z" fill="#2c2420" stroke="#a65e49" stroke-width="14"/><g stroke="#5e362a" stroke-width="3"><path d="M0 40H400M0 80H400M0 120H400M0 160H400"/></g></svg>',
    fleet: '<svg class="bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#3d5c6b"/><g fill="none" stroke="#7fb8d1" stroke-width="4"><path d="M0 70 Q50 40 100 70 T200 70 T300 70 T400 70"/><path d="M0 110 Q50 80 100 110 T200 110 T300 110 T400 110"/><path d="M0 150 Q50 120 100 150 T200 150 T300 150 T400 150"/></g></svg>',
    tunnel: '<svg class="bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#3b3f43"/><circle cx="200" cy="100" r="85" fill="#15181b" stroke="#8a8f94" stroke-width="12"/><circle cx="200" cy="100" r="55" fill="none" stroke="#555" stroke-width="3" stroke-dasharray="8 8"/></svg>',
    clay: '<svg class="bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true"><rect width="400" height="200" fill="#4f5c66"/><g fill="none" stroke="#6b7a85" stroke-width="3"><path d="M0 40 Q100 20 200 40 T400 40"/><path d="M0 90 Q100 70 200 90 T400 90"/><path d="M0 140 Q100 120 200 140 T400 140"/><path d="M0 185 Q100 165 200 185 T400 185"/></g></svg>'
  };
  var icons = {
    ringpull: '<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="22" rx="12" ry="9" fill="none" stroke="#d8d8d8" stroke-width="4"/><rect x="14" y="8" width="12" height="7" rx="3" fill="#d8d8d8"/></svg>',
    penny: '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="15" fill="#b5733a" stroke="#6d4320" stroke-width="3"/><circle cx="20" cy="20" r="8" fill="none" stroke="#6d4320" stroke-width="2"/></svg>',
    roman: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4 L31 8 L36 19 L31 31 L19 36 L8 30 L4 19 L9 9 Z" fill="#c9a24b" stroke="#7a5f1e" stroke-width="2.5"/><path d="M15 24 L20 12 L25 24" fill="none" stroke="#7a5f1e" stroke-width="2.5"/></svg>',
    pipe: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M6 30 L26 30 L32 14 L28 12 L22 24 L6 24 Z" fill="#e8dfc9" stroke="#9c9178" stroke-width="2"/></svg>',
    usb: '<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="12" y="4" width="16" height="9" fill="#ccc" stroke="#555" stroke-width="2"/><rect x="9" y="13" width="22" height="24" rx="3" fill="#2f6fb0" stroke="#17406b" stroke-width="2"/><rect x="13" y="19" width="14" height="10" fill="#fff"/></svg>'
  };

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function toggleBtn(label, pressed, fn) {
    var b = el('button', 'chip'); b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', pressed ? 'true' : 'false');
    b.addEventListener('click', fn); return b;
  }

  function build() {
    var st = el('style'); st.textContent = css; document.head.appendChild(st);
    sec = el('section', 'dig'); sec.id = 'dig'; sec.setAttribute('aria-label', 'Beneath the street');
    var tools = el('div', 'dig-tools');
    var det = toggleBtn('Detector: off', false, function () {
      detector = !detector; det.textContent = 'Detector: ' + (detector ? 'on' : 'off'); det.setAttribute('aria-pressed', detector);
      sec.classList.toggle('detecting', detector);
      if (!detector) tone(0);
    });
    sndBtn = toggleBtn('Sound: off', false, function () {
      sound = !sound; sndBtn.textContent = 'Sound: ' + (sound ? 'on' : 'off'); sndBtn.setAttribute('aria-pressed', sound);
      if (sound) startAudio(); else stopAudio();
    });
    var hint = el('span', 'meta'); hint.textContent = 'Switch on the detector and move the pointer. Buried objects can also be reached with the keyboard.';
    tools.appendChild(det); tools.appendChild(sndBtn); tools.appendChild(hint);
    sec.appendChild(tools);

    var ol = el('ol', 'dig-strata');
    data.strata.forEach(function (s) {
      var li = el('li', 'stratum reveal'); li.dataset.id = s.id;
      var a = el('div', 'stratum-art'); a.innerHTML = art[s.id] || '';
      a.setAttribute('aria-hidden', 'true');
      var t = el('div', 'stratum-text'); t.innerHTML = '<h2></h2><p></p>';
      t.firstChild.textContent = s.label; t.lastChild.textContent = s.caption;
      li.appendChild(a);
      data.finds.filter(function (f) { return f.stratum === s.id; }).forEach(function (f) {
        var b = el('button', 'find'); b.type = 'button'; b.dataset.id = f.id;
        b.style.left = f.x + '%'; b.style.top = f.y + '%';
        b.setAttribute('aria-label', 'Buried object in ' + s.label + '. Activate to dig it up.');
        b.innerHTML = icons[f.id] || icons.penny;
        b.addEventListener('click', function () { dig(f, b); });
        li.appendChild(b);
      });
      li.appendChild(t); ol.appendChild(li);
    });
    sec.appendChild(ol);

    var log = el('div', 'dig-log'); log.innerHTML = '<h2>Finds log</h2><p class="meta" data-n></p><ul aria-live="polite"></ul>';
    sec.appendChild(log);
    var fin = el('p', 'dig-final'); fin.textContent = data.final_line; sec.appendChild(fin);
    document.body.appendChild(sec);
    document.body.appendChild(el('div', 'dig-ring'));
    countText();

    if ('IntersectionObserver' in window && !AW.reducedMotion()) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .15 });
      sec.querySelectorAll('.reveal').forEach(function (r) { io.observe(r); });
    } else sec.querySelectorAll('.reveal').forEach(function (r) { r.classList.add('in'); });

    sec.addEventListener('pointermove', onMove);
    sec.addEventListener('click', function (e) {
      if (!detector) return;
      var n = nearest(e.clientX, e.clientY, 44); if (n) dig(n.f, n.b);
    });
  }

  function countText() { sec.querySelector('[data-n]').textContent = Object.keys(dug).length + ' of ' + data.finds.length + ' found.'; }
  function dig(f, b) {
    if (dug[f.id]) return;
    dug[f.id] = true; b.classList.add('dug'); b.setAttribute('aria-label', f.name + ', dug up.');
    var li = el('li'); li.innerHTML = '<strong></strong> <span></span>';
    li.firstChild.textContent = f.name + '.'; li.lastChild.textContent = f.caption;
    sec.querySelector('.dig-log ul').appendChild(li); countText();
    AW.found('dig');
    if (sound) beep();
  }

  function centres() {
    return Array.prototype.map.call(sec.querySelectorAll('.find'), function (b) {
      var r = b.getBoundingClientRect(); return { b: b, f: data.finds.filter(function (f) { return f.id === b.dataset.id; })[0], x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }).filter(function (c) { return !dug[c.f.id]; });
  }
  function nearest(x, y, max) {
    var best = null, bd = max;
    centres().forEach(function (c) { var d = Math.hypot(c.x - x, c.y - y); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function onMove(e) {
    mx = e.clientX; my = e.clientY;
    var ring = document.querySelector('.dig-ring');
    if (detector && ring) { ring.style.left = mx + 'px'; ring.style.top = my + 'px'; }
    if (!detector || !sound) return;
    var n = nearest(mx, my, 130);
    tone(n ? 1 - Math.hypot(n.x - mx, n.y - my) / 130 : 0);
  }

  // Sound: opt-in, low volume, original tones only.
  function startAudio() {
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      osc = audio.createOscillator(); gain = audio.createGain(); gain.gain.value = 0;
      osc.type = 'sine'; osc.frequency.value = 220; osc.connect(gain); gain.connect(audio.destination); osc.start();
    } catch (e) { sound = false; }
  }
  function stopAudio() { try { if (osc) osc.stop(); } catch (e) {} osc = null; gain = null; }
  function tone(p) {
    if (!osc || !gain) return;
    osc.frequency.setTargetAtTime(220 + p * 880, audio.currentTime, .05);
    gain.gain.setTargetAtTime(p > 0 ? 0.04 * Math.min(1, p * 1.5) : 0, audio.currentTime, .05);
  }
  function beep() { if (!osc) return; tone(1); setTimeout(function () { tone(0); }, 250); }

  function load() { return fetch('/dig.json').then(function (r) { return r.json(); }).then(function (d) { data = d; }); }
  function open() {
    var go = function () {
      if (!sec) build();
      sec.hidden = false;
      if (sound && !osc) startAudio();
      if (btn) btn.setAttribute('aria-expanded', 'true');
      sec.scrollIntoView({ behavior: AW.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    };
    if (data) go(); else load().then(go);
  }
  function close() {
    if (sec) sec.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    tone(0); stopAudio();
  }
  AW.egg('dig', {
    toggle: function (b) { btn = b; if (sec && !sec.hidden) close(); else open(); },
    open: function () { btn = document.getElementById('dig-open'); open(); },
    stop: close
  });
})();
