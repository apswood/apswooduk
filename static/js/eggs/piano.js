/* The keyboard: one octave, computer keys map to notes. Sound is opt-in. An original ii-V-I phrase unlocks a tenor voice. */
(function () {
  'use strict';
  var el = null, opener = null, ctx = null, master = null, soundOn = false, voice = 'piano', recent = [], noise = null;
  var KEYS = [
    ['a', 'C', 0], ['w', 'C sharp', 1], ['s', 'D', 2], ['e', 'D sharp', 3], ['d', 'E', 4], ['f', 'F', 5],
    ['t', 'F sharp', 6], ['g', 'G', 7], ['y', 'G sharp', 8], ['h', 'A', 9], ['u', 'A sharp', 10], ['j', 'B', 11], ['k', 'High C', 12]
  ];
  // D F A C (the ii), B G (the V), E C (the I)
  var PHRASE = ['s', 'f', 'h', 'k', 'j', 'g', 'd', 'a'];

  var css = '.aw-piano{position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--surface,#eee);color:var(--ink,#222);padding:12px 16px 16px;border-top:3px solid var(--accent,#1f5f7a)}.aw-piano[hidden]{display:none}' +
    '.aw-piano-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:10px}' +
    '.aw-keys{display:flex;gap:3px;overflow-x:auto;padding-bottom:4px}' +
    '.aw-key{flex:1 0 44px;min-width:44px;height:92px;border:1px solid #555;border-radius:0 0 6px 6px;background:#fff;color:#222;font:12px/1 var(--head,sans-serif);display:flex;align-items:flex-end;justify-content:center;padding-bottom:8px;cursor:pointer}' +
    '.aw-key.black{background:#222;color:#fff;height:64px}.aw-key.on{background:var(--accent,#1f5f7a);color:var(--accent-ink,#fff)}' +
    '.aw-key:focus-visible,.aw-piano button:focus-visible{outline:3px solid var(--focus,#9a3b00);outline-offset:2px}';

  function ensureAudio() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = 0.12; master.connect(ctx.destination);
      var len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noise = buf;
      return true;
    } catch (e) { return false; }
  }

  function play(n) {
    var f = 261.63 * Math.pow(2, n / 12), t = ctx.currentTime;
    if (voice === 'piano') {
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.3);
    } else {
      // Breathy tenor: sawtooth through a low-pass filter, a little filtered noise, gentle vibrato. An octave lower.
      var tf = f / 2, o2 = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g2 = ctx.createGain();
      o2.type = 'sawtooth'; o2.frequency.value = tf; lp.type = 'lowpass'; lp.frequency.value = 1400; lp.Q.value = 2;
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 5.5; lg.gain.value = 0;
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(tf * 0.012, t + 0.4);
      lfo.connect(lg); lg.connect(o2.frequency);
      g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(0.7, t + 0.06); g2.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
      var ns = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), ng = ctx.createGain();
      ns.buffer = noise; bp.type = 'bandpass'; bp.frequency.value = tf * 4; bp.Q.value = 1; ng.gain.value = 0.12;
      ns.connect(bp); bp.connect(ng); ng.connect(g2);
      o2.connect(lp); lp.connect(g2); g2.connect(master);
      o2.start(t); lfo.start(t); ns.start(t); o2.stop(t + 1.1); lfo.stop(t + 1.1); ns.stop(t + 1.1);
    }
  }

  function press(k, btn) {
    AW.found('piano');
    if (btn) { btn.classList.add('on'); setTimeout(function () { btn.classList.remove('on'); }, 160); }
    var cap = el.querySelector('[data-cap]');
    if (soundOn && ctx) play(k[2]);
    else if (!soundOn) cap.textContent = 'Sound is off. Switch it on to hear the notes.';
    recent.push(k[0]); if (recent.length > PHRASE.length) recent.shift();
    if (recent.join('') === PHRASE.join('') && voice !== 'tenor') { voice = 'tenor'; cap.textContent = 'Switching to tenor.'; recent = []; }
  }

  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.className = 'aw-piano'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Keyboard');
    var row = document.createElement('div'); row.className = 'aw-piano-row';
    var snd = document.createElement('button'); snd.type = 'button'; snd.className = 'chip'; snd.textContent = 'Sound: off'; snd.setAttribute('aria-pressed', 'false');
    snd.addEventListener('click', function () {
      if (!soundOn && !ensureAudio()) return;
      soundOn = !soundOn; snd.textContent = 'Sound: ' + (soundOn ? 'on' : 'off'); snd.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      if (soundOn && ctx.state === 'suspended') ctx.resume();
    });
    var cl = document.createElement('button'); cl.type = 'button'; cl.className = 'chip'; cl.textContent = 'Close'; cl.addEventListener('click', close);
    var hint = document.createElement('span'); hint.className = 'meta'; hint.textContent = 'Keys A to K play one octave. Sound starts off.';
    var cap = document.createElement('span'); cap.setAttribute('data-cap', ''); cap.setAttribute('role', 'status'); cap.setAttribute('aria-live', 'polite'); cap.style.fontFamily = 'var(--head)';
    row.appendChild(snd); row.appendChild(cl); row.appendChild(hint); row.appendChild(cap);
    var keys = document.createElement('div'); keys.className = 'aw-keys';
    KEYS.forEach(function (k) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'aw-key' + (k[1].indexOf('sharp') > -1 ? ' black' : '');
      b.setAttribute('aria-label', k[1] + ' (key ' + k[0].toUpperCase() + ')'); b.textContent = k[0].toUpperCase();
      b.addEventListener('click', function () { press(k, b); });
      keys.appendChild(b);
    });
    el.appendChild(row); el.appendChild(keys); document.body.appendChild(el);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } });
    document.addEventListener('keydown', function (e) {
      if (el.hidden || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
      var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      for (var i = 0; i < KEYS.length; i++) if (KEYS[i][0] === e.key.toLowerCase()) { press(KEYS[i], keys.children[i]); return; }
    });
  }

  function open(btn) { opener = btn; if (!el) build(); el.hidden = false; el.querySelector('.chip').focus(); }
  function close() { if (!el) return; el.hidden = true; if (opener && opener.focus) opener.focus(); }
  AW.egg('piano', { toggle: function (b) { if (el && !el.hidden) close(); else open(b); }, stop: close });
})();
