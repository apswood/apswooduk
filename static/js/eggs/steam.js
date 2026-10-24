/* London Museum of Water & Steam: Cornish Engine Pipe Puzzle.
   Connect all pipes to allow steam to travel from the boiler and turn the pump wheel.
   Pure vanilla JS, SVG rendering, Web Audio synthesis, no dependencies.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var AW = window.AW;
  var opener = null;
  var modal = null;
  var soundOn = false;
  var audioCtx = null;
  var masterGain = null;
  var noiseBuffer = null;

  var currentLevelIdx = 0;
  var gridState = []; // current rotation and steam status for each cell
  var levelSolved = false;
  var allLevelsComplete = false;

  var N = 1, E = 2, S = 4, W = 8;
  var DIRS = [
    { bit: N, dr: -1, dc: 0, opp: S, name: 'North' },
    { bit: E, dr: 0, dc: 1, opp: W, name: 'East' },
    { bit: S, dr: 1, dc: 0, opp: N, name: 'South' },
    { bit: W, dr: 0, dc: -1, opp: E, name: 'West' }
  ];

  var LEVELS = [
    {
      id: 1,
      name: 'Boulton & Watt Engine',
      subtitle: '3x3 Boiler Feed Circuit',
      psi: 35,
      rows: 3,
      cols: 3,
      inlet: { r: 0, c: 0, from: W },
      outlet: { r: 2, c: 2, to: E },
      grid: [
        [
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'elbow', base: N | E, solvedRot: 2 }
        ],
        [
          { type: 'elbow', base: N | E, solvedRot: 1 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'elbow', base: N | E, solvedRot: 3 }
        ],
        [
          { type: 'elbow', base: N | E, solvedRot: 0 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'straight', base: N | S, solvedRot: 1 }
        ]
      ]
    },
    {
      id: 2,
      name: 'Kew Standpipe Conduit',
      subtitle: '4x3 Distribution Manifold',
      psi: 65,
      rows: 3,
      cols: 4,
      inlet: { r: 0, c: 0, from: W },
      outlet: { r: 2, c: 3, to: E },
      grid: [
        [
          { type: 'elbow', base: N | E, solvedRot: 2 },
          { type: 'elbow', base: N | E, solvedRot: 1 },
          { type: 'tee', base: N | E | S, solvedRot: 1 },
          { type: 'elbow', base: N | E, solvedRot: 2 }
        ],
        [
          { type: 'straight', base: N | S, solvedRot: 0 },
          { type: 'tee', base: N | E | S, solvedRot: 0 },
          { type: 'elbow', base: N | E, solvedRot: 3 },
          { type: 'straight', base: N | S, solvedRot: 0 }
        ],
        [
          { type: 'elbow', base: N | E, solvedRot: 0 },
          { type: 'tee', base: N | E | S, solvedRot: 3 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'tee', base: N | E | S, solvedRot: 3 }
        ]
      ]
    },
    {
      id: 3,
      name: 'The 100-inch Cornish Beam Engine',
      subtitle: '4x4 High-Pressure Steam Main',
      psi: 100,
      rows: 4,
      cols: 4,
      inlet: { r: 0, c: 0, from: W },
      outlet: { r: 3, c: 3, to: E },
      grid: [
        [
          { type: 'tee', base: N | E | S, solvedRot: 1 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'elbow', base: N | E, solvedRot: 2 }
        ],
        [
          { type: 'tee', base: N | E | S, solvedRot: 0 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'straight', base: N | S, solvedRot: 1 },
          { type: 'elbow', base: N | E, solvedRot: 3 }
        ],
        [
          { type: 'tee', base: N | E | S, solvedRot: 0 },
          { type: 'tee', base: N | E | S, solvedRot: 1 },
          { type: 'tee', base: N | E | S, solvedRot: 1 },
          { type: 'elbow', base: N | E, solvedRot: 2 }
        ],
        [
          { type: 'elbow', base: N | E, solvedRot: 0 },
          { type: 'elbow', base: N | E, solvedRot: 3 },
          { type: 'elbow', base: N | E, solvedRot: 0 },
          { type: 'tee', base: N | E | S, solvedRot: 3 }
        ]
      ]
    }
  ];

  var css =
    '.steam-backdrop{position:fixed;inset:0;background:rgba(10,14,18,0.78);backdrop-filter:blur(3px);z-index:900;display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto}' +
    '.steam-backdrop[hidden]{display:none}' +
    '.steam-modal{background:var(--bg,#f6f1e7);color:var(--ink,#26292b);border:2px solid var(--accent,#1f5f7a);border-radius:12px;box-shadow:0 18px 48px rgba(0,0,0,0.45);width:100%;max-width:880px;padding:20px;margin:auto;position:relative;display:flex;flex-direction:column;gap:14px;box-sizing:border-box}' +
    '.steam-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--muted);padding-bottom:12px}' +
    '.steam-titles{flex:1;min-width:220px}' +
    '.steam-kicker{font-size:.78rem;font-family:var(--head);text-transform:uppercase;letter-spacing:.08em;color:var(--accent,#1f5f7a);margin:0 0 2px;font-weight:600}' +
    '.steam-title{font-size:1.35rem;margin:0;line-height:1.2;font-family:var(--head)}' +
    '.steam-sub{font-size:.88rem;color:var(--muted);margin:2px 0 0}' +
    '.steam-actions{display:flex;align-items:center;gap:8px}' +
    '.steam-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;background:var(--surface,#ece4d3);padding:8px 14px;border-radius:8px;font-size:.9rem}' +
    '.steam-stats{display:flex;align-items:center;gap:16px}' +
    '.steam-stat{font-weight:600}' +
    '.steam-stat span{font-weight:normal;color:var(--muted)}' +
    '.steam-stage{display:flex;flex-direction:column;align-items:center;gap:14px;position:relative}' +
    '.steam-machine{display:flex;align-items:flex-start;justify-content:center;gap:12px;width:100%;max-width:820px;margin:0 auto;overflow-x:auto;padding:8px 2px}' +
    '.steam-boiler,.steam-pump{flex:0 0 auto;width:120px;display:flex;flex-direction:column;align-items:center;text-align:center}' +
    '.steam-boiler svg,.steam-pump svg{width:100%;height:auto;display:block;overflow:visible}' +
    '.steam-grid-wrap{position:relative;flex:0 0 auto;background:linear-gradient(#2a2622,#1b1815);padding:8px;border-radius:10px;box-shadow:inset 0 0 12px rgba(0,0,0,0.8),0 2px 6px rgba(0,0,0,0.2);border:2px solid #3d352e}' +
    '.steam-grid{display:grid;gap:0;justify-content:center}' +
    '.steam-port{position:absolute;width:26px;background:linear-gradient(#2a2d31,#7b8188 35%,#25282c);pointer-events:none;z-index:1;transition:background .3s}' +
    '.steam-port.hot{background:linear-gradient(#4a220c,#e0965a 35%,#4a220c)}' +
    '.steam-port-in{left:-18px}.steam-port-out{right:-18px}' +
    '.pipe-tile{width:72px;height:72px;min-width:44px;min-height:44px;padding:0;border:0;background:transparent;border-radius:6px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;outline:none;transition:transform .18s cubic-bezier(.2,.8,.3,1),filter .15s}' +
    '.pipe-tile:hover{filter:brightness(1.18)}' +
    '.pipe-tile:focus-visible{outline:3px solid var(--focus,#9a3b00);outline-offset:-1px;z-index:2}' +
    '.pipe-tile svg{width:100%;height:100%;display:block;pointer-events:none;overflow:visible}' +
    '@media(max-width:680px){.pipe-tile{width:56px;height:56px}.steam-boiler,.steam-pump{width:86px}.steam-modal{padding:14px}}' +
    '@media(max-width:480px){.pipe-tile{width:46px;height:46px}.steam-boiler,.steam-pump{width:70px}}' +
    '.p-plate{fill:#2c2824;stroke:#3d362f;stroke-width:1.5}' +
    '.p-rivet{fill:#4a4239}' +
    '.p-edge{stroke:#15171a;stroke-width:32}' +
    '.p-body{stroke:#5d636a;stroke-width:27;transition:stroke .3s}' +
    '.p-sheen{stroke:#a3aab1;stroke-width:6;opacity:.5;transition:stroke .3s}' +
    '.p-flow{stroke:#fff3d6;stroke-width:5;stroke-dasharray:4 12;stroke-linecap:round;opacity:0}' +
    '.p-flange{fill:#3d4247;stroke:#15171a;stroke-width:1;transition:fill .3s}' +
    '.p-bolt{fill:#c29238}' +
    '.p-cast{fill:#4d5359;stroke:#15171a;stroke-width:1.5;transition:fill .3s}' +
    '.p-cast-ring{fill:none;stroke:#c29238;stroke-width:2}' +
    '.pipe-tile.steamed .p-body{stroke:#b5622a}' +
    '.pipe-tile.steamed .p-sheen{stroke:#f3b47c;opacity:.7}' +
    '.pipe-tile.steamed .p-flange{fill:#7a3d18}' +
    '.pipe-tile.steamed .p-cast{fill:#9c5222}' +
    '.pipe-tile.steamed .p-flow{opacity:.85;animation:steam-flow .7s linear infinite}' +
    '.steam-leak circle{fill:rgba(255,255,255,0.8)}' +
    '.steam-leak{transform-box:fill-box;transform-origin:center;animation:steam-leak 1.1s ease-out infinite}' +
    '.steam-smoke circle{fill:rgba(205,205,205,0.75)}' +
    '.steam-smoke{opacity:0;transform-box:fill-box;transform-origin:center}' +
    '.steam-lit .steam-smoke{animation:steam-smoke 2.4s ease-out infinite}' +
    '.steam-fire{animation:steam-fire 1.3s ease-in-out infinite alternate}' +
    '.steam-beam{transform-box:view-box;transform-origin:60px 40px;transform:rotate(-8deg)}' +
    '.steam-rod-l{transform:translateY(5.3px)}.steam-rod-r{transform:translateY(-5.3px)}' +
    '.steam-running .steam-beam{animation:steam-beam 1.6s ease-in-out infinite alternate}' +
    '.steam-running .steam-rod-l{animation:steam-rod-l 1.6s ease-in-out infinite alternate}' +
    '.steam-running .steam-rod-r{animation:steam-rod-r 1.6s ease-in-out infinite alternate}' +
    '.steam-water{opacity:0}' +
    '.steam-running .steam-water{opacity:1;stroke-dasharray:4 4;animation:steam-water .4s linear infinite}' +
    '.steam-running .steam-trough{fill:#5fb3e6}' +
    '@keyframes steam-flow{to{stroke-dashoffset:-16}}' +
    '@keyframes steam-leak{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(1.7)}}' +
    '@keyframes steam-smoke{0%{opacity:.85;transform:translate(0,0) scale(.6)}100%{opacity:0;transform:translate(8px,-34px) scale(1.9)}}' +
    '@keyframes steam-fire{from{opacity:.6}to{opacity:1}}' +
    '@keyframes steam-beam{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}' +
    '@keyframes steam-rod-l{from{transform:translateY(5.3px)}to{transform:translateY(-5.3px)}}' +
    '@keyframes steam-rod-r{from{transform:translateY(-5.3px)}to{transform:translateY(5.3px)}}' +
    '@keyframes steam-water{to{stroke-dashoffset:-8}}' +
    '.steam-banner{background:var(--surface,#ece4d3);border:2px solid var(--accent,#1f5f7a);border-radius:8px;padding:12px 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;width:100%;box-sizing:border-box}' +
    '.steam-banner h3{margin:0;font-size:1.1rem;color:var(--ink)}' +
    '.steam-banner p{margin:2px 0 0;font-size:.9rem;color:var(--muted)}' +
    '.steam-banner-actions{display:flex;gap:8px}' +
    '.steam-victory-card{text-align:center;padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;background:var(--surface,#ece4d3);border-radius:10px;border:2px solid var(--accent)}' +
    '.steam-victory-card h3{font-size:1.4rem;margin:0}' +
    '.steam-victory-card p{max-width:54ch;margin:0 auto;color:var(--ink)}' +
    '.steam-victory-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}' +
    '.steam-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}' +
    '@media(prefers-reduced-motion:reduce){.pipe-tile{transition:none}.pipe-tile.steamed .p-flow,.steam-leak,.steam-lit .steam-smoke,.steam-fire,.steam-running .steam-beam,.steam-running .steam-rod-l,.steam-running .steam-rod-r,.steam-running .steam-water{animation:none}}';

  function rotMask(mask, r) {
    var m = mask;
    for (var i = 0; i < (r % 4); i++) {
      m = ((m << 1) & 14) | ((m >> 3) & 1);
    }
    return m;
  }

  function ensureAudio() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.14;
      masterGain.connect(audioCtx.destination);

      var sampleLen = audioCtx.sampleRate * 1.5;
      var buf = audioCtx.createBuffer(1, sampleLen, audioCtx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < sampleLen; i++) d[i] = Math.random() * 2 - 1;
      noiseBuffer = buf;
      return true;
    } catch (e) {
      return false;
    }
  }

  function playRatchet() {
    if (!soundOn || !audioCtx) return;
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.03);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  function playSteamSound() {
    if (!soundOn || !audioCtx || !noiseBuffer) return;
    var t = audioCtx.currentTime;
    var src = audioCtx.createBufferSource();
    src.buffer = noiseBuffer;
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, t);
    filter.Q.value = 1.8;
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start(t);
    src.stop(t + 0.55);
  }

  function playChime() {
    if (!soundOn || !audioCtx) return;
    var t = audioCtx.currentTime;
    var notes = [440, 554.37, 659.25, 880];
    notes.forEach(function (f, idx) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      var delay = t + idx * 0.08;
      g.gain.setValueAtTime(0, delay);
      g.gain.linearRampToValueAtTime(0.35, delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, delay + 0.9);
      o.connect(g);
      g.connect(masterGain);
      o.start(delay);
      o.stop(delay + 1.0);
    });
  }

  // Pipe ends sit on the tile edges, in the tile's unrotated frame
  var END_POS = {};
  END_POS[N] = { x: 50, y: 0 };
  END_POS[E] = { x: 100, y: 50 };
  END_POS[S] = { x: 50, y: 100 };
  END_POS[W] = { x: 0, y: 50 };

  function pipePaths(type) {
    if (type === 'straight') return ['M 50 0 L 50 100'];
    if (type === 'elbow') return ['M 50 0 A 50 50 0 0 0 100 50'];
    if (type === 'tee') return ['M 50 0 L 50 100', 'M 50 50 L 100 50'];
    return [];
  }

  function flangeSvg(bit) {
    var p = END_POS[bit];
    var vertical = bit === N || bit === S;
    var w = vertical ? 40 : 8;
    var h = vertical ? 8 : 40;
    var x = p.x - w / 2;
    var y = p.y - h / 2;
    // Keep the flange inside the tile so neighbours butt up flange to flange
    if (bit === N) y = 0;
    if (bit === S) y = 92;
    if (bit === W) x = 0;
    if (bit === E) x = 92;
    var bolts = vertical
      ? [[x + 5, y + 4], [x + w - 5, y + 4]]
      : [[x + 4, y + 5], [x + 4, y + h - 5]];
    return (
      '<rect class="p-flange" x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="1.5"/>' +
      bolts.map(function (b) { return '<circle class="p-bolt" cx="' + b[0] + '" cy="' + b[1] + '" r="1.8"/>'; }).join('')
    );
  }

  // leakMask is in the tile's own (unrotated) frame
  function createTileSvg(type, base, leakMask) {
    var paths = pipePaths(type);
    var layer = function (cls) {
      return paths.map(function (d) { return '<path class="' + cls + '" d="' + d + '"/>'; }).join('');
    };
    var svg =
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      // Riveted floor plate
      '<rect class="p-plate" x="1" y="1" width="98" height="98" rx="5"/>' +
      '<g class="p-rivet"><circle cx="9" cy="9" r="2"/><circle cx="91" cy="9" r="2"/><circle cx="9" cy="91" r="2"/><circle cx="91" cy="91" r="2"/></g>' +
      '<g fill="none">' +
      layer('p-edge') + layer('p-body') + layer('p-sheen') + layer('p-flow') +
      '</g>';
    if (type === 'tee') {
      svg += '<circle class="p-cast" cx="50" cy="50" r="19"/><circle class="p-cast-ring" cx="50" cy="50" r="12"/>';
    }
    DIRS.forEach(function (d) {
      if (base & d.bit) svg += flangeSvg(d.bit);
    });
    DIRS.forEach(function (d) {
      if (!(leakMask & d.bit)) return;
      var p = END_POS[d.bit];
      svg +=
        '<g class="steam-leak">' +
        '<circle cx="' + p.x + '" cy="' + p.y + '" r="9"/>' +
        '<circle cx="' + (p.x + (d.dc * 8)) + '" cy="' + (p.y + (d.dr * 8)) + '" r="6"/>' +
        '</g>';
    });
    return svg + '</svg>';
  }

  function getBoilerSvg(psi, steamed) {
    var dialAngle = steamed ? (psi / 120) * 240 - 120 : -120;
    var ticks = '';
    for (var i = 0; i <= 12; i++) {
      var a = (-120 + i * 20 - 90) * Math.PI / 180;
      var r1 = i % 3 === 0 ? 11.5 : 13.5;
      ticks += '<line x1="' + (57 + Math.cos(a) * r1).toFixed(1) + '" y1="' + (94 + Math.sin(a) * r1).toFixed(1) +
        '" x2="' + (57 + Math.cos(a) * 16).toFixed(1) + '" y2="' + (94 + Math.sin(a) * 16).toFixed(1) + '"/>';
    }
    var rivets = '';
    for (var x = 22; x <= 92; x += 10) {
      rivets += '<circle cx="' + x + '" cy="42" r="1.4"/><circle cx="' + x + '" cy="134" r="1.4"/>';
    }
    return (
      '<svg viewBox="0 0 120 180" aria-label="Victorian steam boiler">' +
      '<defs>' +
      '<linearGradient id="stm-boiler" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#142a1f"/><stop offset="0.38" stop-color="#3f6d53"/><stop offset="0.55" stop-color="#2f5541"/><stop offset="1" stop-color="#11241a"/></linearGradient>' +
      '<linearGradient id="stm-pipe-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2d31"/><stop offset="0.35" stop-color="#7b8188"/><stop offset="1" stop-color="#25282c"/></linearGradient>' +
      '<linearGradient id="stm-brick" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3324"/><stop offset="1" stop-color="#4f2016"/></linearGradient>' +
      '<radialGradient id="stm-glow" cx="0.5" cy="0.6" r="0.6"><stop offset="0" stop-color="#ffd27a"/><stop offset="0.5" stop-color="#ff7a1a"/><stop offset="1" stop-color="#7a1d05"/></radialGradient>' +
      '</defs>' +
      // Smoke from the stack once the boiler is feeding pipes
      '<g class="steam-smoke"><circle cx="58" cy="-2" r="6"/><circle cx="62" cy="-2" r="8"/><circle cx="55" cy="-2" r="7"/></g>' +
      // Chimney stack
      '<rect x="50" y="4" width="15" height="28" fill="#26292d" stroke="#141618" stroke-width="1"/>' +
      '<rect x="47" y="2" width="21" height="5" rx="1" fill="#3a3e43"/>' +
      '<rect x="50" y="18" width="15" height="3" fill="#c29238"/>' +
      // Boiler shell in Victorian green with brass bands
      '<rect x="14" y="28" width="86" height="118" rx="22" fill="url(#stm-boiler)" stroke="#0c1a12" stroke-width="1.5"/>' +
      '<rect x="14" y="39" width="86" height="6" fill="#c29238"/>' +
      '<rect x="14" y="131" width="86" height="6" fill="#c29238"/>' +
      '<rect x="14" y="39" width="86" height="1.5" fill="#f2cf7a" opacity="0.7"/>' +
      '<rect x="14" y="131" width="86" height="1.5" fill="#f2cf7a" opacity="0.7"/>' +
      '<g fill="#6b4f15">' + rivets + '</g>' +
      // Brass nameplate
      '<rect x="27" y="52" width="60" height="16" rx="8" fill="#c29238" stroke="#7a5818" stroke-width="1.2"/>' +
      '<text x="57" y="63" text-anchor="middle" font-family="Georgia,serif" font-size="7.5" font-weight="bold" fill="#2b1d06">KEW BRIDGE</text>' +
      // Pressure gauge
      '<circle cx="57" cy="94" r="21" fill="#c29238" stroke="#6b4f15" stroke-width="1"/>' +
      '<circle cx="57" cy="94" r="18" fill="#fbf6e6"/>' +
      '<path d="M ' + (57 + Math.cos(40 * Math.PI / 180) * 15).toFixed(1) + ' ' + (94 - Math.sin(40 * Math.PI / 180) * 15).toFixed(1) +
      ' A 15 15 0 0 1 ' + (57 + Math.cos(-30 * Math.PI / 180) * 15).toFixed(1) + ' ' + (94 - Math.sin(-30 * Math.PI / 180) * 15).toFixed(1) +
      '" fill="none" stroke="#c0392b" stroke-width="3"/>' +
      '<g stroke="#2b2b2b" stroke-width="1">' + ticks + '</g>' +
      '<line class="steam-needle" x1="57" y1="94" x2="57" y2="79" stroke="#1b1b1b" stroke-width="1.8" stroke-linecap="round" transform="rotate(' + dialAngle + ' 57 94)"/>' +
      '<circle cx="57" cy="94" r="2.6" fill="#c29238" stroke="#2b2b2b" stroke-width="0.8"/>' +
      // Steam take-off with stop valve, running out to the pipe grid
      '<rect x="96" y="35" width="24" height="18" fill="url(#stm-pipe-h)"/>' +
      '<rect x="113" y="31" width="7" height="26" rx="1.5" fill="#3b3f44"/>' +
      '<circle cx="116.5" cy="35" r="1.4" fill="#c29238"/><circle cx="116.5" cy="53" r="1.4" fill="#c29238"/>' +
      '<rect x="103" y="24" width="4" height="12" fill="#3b3f44"/>' +
      '<ellipse cx="105" cy="23" rx="9" ry="2.6" fill="none" stroke="#b01f14" stroke-width="2"/>' +
      // Brick firebox with glowing door
      '<rect x="22" y="146" width="70" height="24" fill="url(#stm-brick)"/>' +
      '<g stroke="#3a150d" stroke-width="0.7" opacity="0.8">' +
      '<line x1="22" y1="154" x2="92" y2="154"/><line x1="22" y1="162" x2="92" y2="162"/>' +
      '<line x1="34" y1="146" x2="34" y2="154"/><line x1="58" y1="146" x2="58" y2="154"/><line x1="82" y1="146" x2="82" y2="154"/>' +
      '<line x1="46" y1="162" x2="46" y2="170"/><line x1="70" y1="162" x2="70" y2="170"/>' +
      '</g>' +
      '<rect x="40" y="149" width="34" height="18" rx="3" fill="#1b1714" stroke="#c29238" stroke-width="1.2"/>' +
      '<g class="steam-fire"><rect x="44" y="153" width="26" height="3" rx="1.5" fill="url(#stm-glow)"/><rect x="44" y="158.5" width="26" height="3" rx="1.5" fill="url(#stm-glow)"/></g>' +
      // Stone plinth
      '<rect x="6" y="170" width="108" height="9" rx="1.5" fill="#8b857a"/>' +
      '<rect x="6" y="170" width="108" height="2" fill="#a9a397"/>' +
      '</svg>'
    );
  }

  // A Cornish beam engine: steam cylinder on the left lifts one end of the
  // rocking beam; the pump rod on the right draws water up to the trough.
  function getPumpWheelSvg(psi, isRunning) {
    return (
      '<svg viewBox="0 0 120 180" aria-label="Cornish beam pumping engine">' +
      '<defs>' +
      '<linearGradient id="stm-cyl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#25282c"/><stop offset="0.4" stop-color="#6f757c"/><stop offset="1" stop-color="#202326"/></linearGradient>' +
      '<linearGradient id="stm-col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1d3a2b"/><stop offset="0.45" stop-color="#4a7a5f"/><stop offset="1" stop-color="#16301f"/></linearGradient>' +
      '<linearGradient id="stm-pipe-h2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a2d31"/><stop offset="0.35" stop-color="#7b8188"/><stop offset="1" stop-color="#25282c"/></linearGradient>' +
      '</defs>' +
      // Engine-house floor
      '<rect x="0" y="168" width="120" height="11" rx="1.5" fill="#8b857a"/>' +
      '<rect x="0" y="168" width="120" height="2" fill="#a9a397"/>' +
      // Beam column (bob wall stand-in), painted green with brass capital
      '<rect x="54" y="44" width="12" height="124" fill="url(#stm-col)"/>' +
      '<rect x="50" y="160" width="20" height="8" fill="#3b3f44"/>' +
      '<rect x="51" y="44" width="18" height="6" rx="1" fill="#c29238"/>' +
      // Steam cylinder fed from the pipe grid
      '<rect x="8" y="104" width="28" height="56" rx="3" fill="url(#stm-cyl)" stroke="#141618" stroke-width="1"/>' +
      '<rect x="6" y="104" width="32" height="5" rx="1" fill="#c29238"/>' +
      '<rect x="6" y="155" width="32" height="5" rx="1" fill="#c29238"/>' +
      '<rect x="0" y="141" width="10" height="18" fill="url(#stm-pipe-h2)"/>' +
      '<rect x="0" y="137" width="5" height="26" rx="1.2" fill="#3b3f44"/>' +
      // Piston rod, rising and falling with the beam
      '<g class="steam-rod-l"><rect x="19.5" y="36" width="5" height="70" fill="#b8bdc2" stroke="#5b6168" stroke-width="0.6"/><rect x="16" y="34" width="12" height="5" rx="1" fill="#3b3f44"/></g>' +
      // Pump barrel and rod on the right
      '<g class="steam-rod-r"><rect x="97.5" y="36" width="5" height="92" fill="#8f7a5a" stroke="#4d3f2b" stroke-width="0.6"/><rect x="94" y="34" width="12" height="5" rx="1" fill="#3b3f44"/></g>' +
      '<rect x="91" y="122" width="18" height="40" rx="2" fill="#3b3f44" stroke="#141618" stroke-width="1"/>' +
      '<rect x="89" y="122" width="22" height="4" rx="1" fill="#c29238"/>' +
      // Discharge spout and trough
      '<path d="M 109 132 L 117 132 L 117 138 L 109 138 Z" fill="#3b3f44"/>' +
      '<path class="steam-water" d="M 116 138 Q 118 150 116 164" fill="none" stroke="#5fb3e6" stroke-width="3" stroke-linecap="round"/>' +
      '<rect x="104" y="160" width="16" height="8" rx="1.5" fill="#5a4a3a"/>' +
      '<rect class="steam-trough" x="106" y="161.5" width="12" height="3" fill="#2f6f99"/>' +
      // Rocking beam with brass bosses, pivoting on the column
      '<g class="steam-beam">' +
      '<path d="M 10 34 L 110 34 L 110 40 Q 60 54 10 40 Z" fill="#2b2f33" stroke="#141618" stroke-width="1"/>' +
      '<path d="M 14 36 L 106 36" stroke="#6f757c" stroke-width="1.2"/>' +
      '<circle cx="22" cy="37" r="4" fill="#c29238" stroke="#6b4f15"/>' +
      '<circle cx="100" cy="37" r="4" fill="#c29238" stroke="#6b4f15"/>' +
      '<circle cx="60" cy="40" r="6" fill="#c29238" stroke="#6b4f15"/>' +
      '<circle cx="60" cy="40" r="2" fill="#2b2f33"/>' +
      '</g>' +
      '</svg>'
    );
  }

  function initLevelState(level) {
    gridState = [];
    for (var r = 0; r < level.rows; r++) {
      var row = [];
      for (var c = 0; c < level.cols; c++) {
        var cell = level.grid[r][c];
        // Scramble rotation by adding random offset 1..3
        var scrambleOffset = Math.floor(Math.random() * 3) + 1;
        var initRot = (cell.solvedRot + scrambleOffset) % 4;
        row.push({
          type: cell.type,
          base: cell.base,
          solvedRot: cell.solvedRot,
          rot: initRot,
          steamed: false
        });
      }
      gridState.push(row);
    }
    levelSolved = false;
  }

  function evaluateSteam(level) {
    var rows = level.rows;
    var cols = level.cols;
    var totalTiles = rows * cols;

    // Reset steam on all cells
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        gridState[r][c].steamed = false;
        gridState[r][c].leak = 0;
      }
    }

    // Check inlet connection
    var inCell = gridState[level.inlet.r][level.inlet.c];
    var inMask = rotMask(inCell.base, inCell.rot);
    if (!(inMask & level.inlet.from)) {
      return { pumpConnected: false, allConnected: false, connectedCount: 0, totalTiles: totalTiles };
    }

    // BFS steam propagation
    var queue = [{ r: level.inlet.r, c: level.inlet.c }];
    inCell.steamed = true;
    var connectedCount = 1;

    while (queue.length > 0) {
      var curr = queue.shift();
      var cr = curr.r, cc = curr.c;
      var curCell = gridState[cr][cc];
      var curMask = rotMask(curCell.base, curCell.rot);

      for (var i = 0; i < DIRS.length; i++) {
        var d = DIRS[i];
        if (curMask & d.bit) {
          var nr = cr + d.dr;
          var nc = cc + d.dc;

          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
            var nbr = gridState[nr][nc];
            var nbrMask = rotMask(nbr.base, nbr.rot);
            if (nbrMask & d.opp) {
              if (!nbr.steamed) {
                nbr.steamed = true;
                connectedCount++;
                queue.push({ r: nr, c: nc });
              }
            }
          }
        }
      }
    }

    // Check if pump outlet is connected
    var outCell = gridState[level.outlet.r][level.outlet.c];
    var outMask = rotMask(outCell.base, outCell.rot);
    var pumpConnected = outCell.steamed && !!(outMask & level.outlet.to);

    // Open ends on live pipes vent steam, except at the boiler and pump connections
    for (var lr = 0; lr < rows; lr++) {
      for (var lc = 0; lc < cols; lc++) {
        var lcell = gridState[lr][lc];
        if (!lcell.steamed) continue;
        var lmask = rotMask(lcell.base, lcell.rot);
        DIRS.forEach(function (d) {
          if (!(lmask & d.bit)) return;
          var nr2 = lr + d.dr, nc2 = lc + d.dc;
          if (nr2 >= 0 && nr2 < rows && nc2 >= 0 && nc2 < cols) {
            var nb = gridState[nr2][nc2];
            if (rotMask(nb.base, nb.rot) & d.opp) return;
          } else if ((lr === level.inlet.r && lc === level.inlet.c && d.bit === level.inlet.from) ||
                     (lr === level.outlet.r && lc === level.outlet.c && d.bit === level.outlet.to)) {
            return;
          }
          lcell.leak |= d.bit;
        });
      }
    }

    var allConnected = connectedCount === totalTiles;

    return {
      pumpConnected: pumpConnected,
      allConnected: allConnected,
      connectedCount: connectedCount,
      totalTiles: totalTiles
    };
  }

  function renderBoard() {
    if (!modal) return;
    var level = LEVELS[currentLevelIdx];
    var evalRes = evaluateSteam(level);
    var isRunning = evalRes.pumpConnected && evalRes.allConnected;

    var levelTitle = modal.querySelector('[data-steam-level-title]');
    var levelSub = modal.querySelector('[data-steam-level-sub]');
    var statConn = modal.querySelector('[data-steam-stat-conn]');
    var statPsi = modal.querySelector('[data-steam-stat-psi]');
    var boilerWrap = modal.querySelector('[data-steam-boiler]');
    var pumpWrap = modal.querySelector('[data-steam-pump]');
    var gridEl = modal.querySelector('[data-steam-grid]');
    var bannerWrap = modal.querySelector('[data-steam-banner-wrap]');
    var announce = modal.querySelector('[data-steam-announce]');

    if (levelTitle) levelTitle.textContent = 'Level ' + (currentLevelIdx + 1) + ': ' + level.name;
    if (levelSub) levelSub.textContent = level.subtitle;
    if (statConn) statConn.textContent = evalRes.connectedCount + ' / ' + evalRes.totalTiles;
    if (statPsi) statPsi.textContent = (isRunning ? level.psi : Math.round((evalRes.connectedCount / evalRes.totalTiles) * (level.psi * 0.7))) + ' PSI';

    if (boilerWrap) {
      boilerWrap.innerHTML = getBoilerSvg(level.psi, evalRes.connectedCount > 0);
      boilerWrap.classList.toggle('steam-lit', evalRes.connectedCount > 0);
    }
    if (pumpWrap) {
      pumpWrap.innerHTML = getPumpWheelSvg(level.psi, isRunning);
      pumpWrap.classList.toggle('steam-running', isRunning);
    }

    gridEl.style.gridTemplateColumns = 'repeat(' + level.cols + ', 1fr)';
    gridEl.innerHTML = '';

    for (var r = 0; r < level.rows; r++) {
      for (var c = 0; c < level.cols; c++) {
        var cell = gridState[r][c];
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pipe-tile' + (cell.steamed ? ' steamed' : '');
        btn.setAttribute('data-r', r);
        btn.setAttribute('data-c', c);
        btn.style.transform = 'rotate(' + (cell.rot * 90) + 'deg)';
        btn.setAttribute(
          'aria-label',
          'Pipe row ' + (r + 1) + ' col ' + (c + 1) + ', ' + cell.type + ', rotated ' + (cell.rot * 90) + ' degrees. ' +
          (cell.steamed ? 'Steam flowing.' : 'No steam.') + ' Click to rotate.'
        );
        btn.innerHTML = createTileSvg(cell.type, cell.base, rotMask(cell.leak, (4 - cell.rot % 4) % 4));

        (function (rowIdx, colIdx, btnEl) {
          btnEl.addEventListener('click', function () {
            rotateTile(rowIdx, colIdx);
          });
        })(r, c, btn);

        gridEl.appendChild(btn);
      }
    }

    var gridWrap = gridEl.parentNode;
    gridWrap.querySelectorAll('.steam-port').forEach(function (el) { el.remove(); });
    var inCell = gridState[level.inlet.r][level.inlet.c];
    var portIn = document.createElement('span');
    portIn.className = 'steam-port steam-port-in' + (evalRes.connectedCount > 0 ? ' hot' : '');
    portIn.setAttribute('data-row', level.inlet.r);
    var portOut = document.createElement('span');
    portOut.className = 'steam-port steam-port-out' + (isRunning || gridState[level.outlet.r][level.outlet.c].steamed ? ' hot' : '');
    portOut.setAttribute('data-row', level.outlet.r);
    gridWrap.appendChild(portIn);
    gridWrap.appendChild(portOut);
    alignMachine();

    // Check if level was just completed
    if (isRunning && !levelSolved) {
      levelSolved = true;
      playSteamSound();
      playChime();
      if (announce) {
        announce.textContent = 'Level complete! All pipes connected. Steam pressure reached ' + level.psi + ' PSI and the pump is running.';
      }

      if (currentLevelIdx === LEVELS.length - 1) {
        // All levels completed
        allLevelsComplete = true;
        AW.found('steam');
        renderVictory();
      } else {
        renderLevelWinBanner(level);
      }
    } else if (!isRunning) {
      bannerWrap.innerHTML = '';
    }
  }

  // Line the boiler outlet and the engine inlet up with the grid rows they feed
  function alignMachine() {
    if (!modal) return;
    var level = LEVELS[currentLevelIdx];
    var gridWrap = modal.querySelector('.steam-grid-wrap');
    var wrapRect = gridWrap.getBoundingClientRect();
    if (!wrapRect.height) return;
    var rowMid = function (r) {
      var t = modal.querySelector('[data-r="' + r + '"][data-c="0"]');
      var tr = t.getBoundingClientRect();
      return { y: tr.top + tr.height / 2 - wrapRect.top, h: tr.height };
    };
    var inRow = rowMid(level.inlet.r);
    var outRow = rowMid(level.outlet.r);
    var boiler = modal.querySelector('[data-steam-boiler]');
    var pump = modal.querySelector('[data-steam-pump]');
    var scale = boiler.getBoundingClientRect().width / 120;
    boiler.style.marginTop = Math.max(0, inRow.y - 44 * scale) + 'px';
    pump.style.marginTop = Math.max(0, outRow.y - 150 * scale) + 'px';
    gridWrap.querySelectorAll('.steam-port').forEach(function (el) {
      var row = +el.getAttribute('data-row') === level.inlet.r && el.classList.contains('steam-port-in') ? inRow : outRow;
      var ph = row.h * 0.27;
      el.style.height = ph + 'px';
      el.style.top = (row.y - ph / 2 - 2) + 'px';
    });
  }

  function rotateTile(r, c) {
    var cell = gridState[r][c];
    cell.rot = (cell.rot + 1) % 4;
    playRatchet();
    renderBoard();

    // Keep focus on the clicked tile
    var updatedBtn = modal.querySelector('[data-r="' + r + '"][data-c="' + c + '"]');
    if (updatedBtn) updatedBtn.focus();
  }

  function renderLevelWinBanner(level) {
    var bannerWrap = modal.querySelector('[data-steam-banner-wrap]');
    if (!bannerWrap) return;
    bannerWrap.innerHTML =
      '<div class="steam-banner" role="status">' +
      '<div>' +
      '<h3>Level Complete: ' + level.name + ' Running!</h3>' +
      '<p>All pipes connected with no leaks. Working pressure: ' + level.psi + ' PSI.</p>' +
      '</div>' +
      '<div class="steam-banner-actions">' +
      '<button type="button" class="btn" data-steam-next>Next Engine Level &rarr;</button>' +
      '</div>' +
      '</div>';

    var nextBtn = bannerWrap.querySelector('[data-steam-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        currentLevelIdx++;
        initLevelState(LEVELS[currentLevelIdx]);
        renderBoard();
        var firstTile = modal.querySelector('.pipe-tile');
        if (firstTile) firstTile.focus();
      });
      nextBtn.focus();
    }
  }

  function renderVictory() {
    var bannerWrap = modal.querySelector('[data-steam-banner-wrap]');
    if (!bannerWrap) return;

    bannerWrap.innerHTML =
      '<div class="steam-victory-card" role="status">' +
      '<h3>All Pumping Engines Operational!</h3>' +
      '<p>Every pipe circuit is sealed and steam pressure is fully connected across the Kew Bridge pumping station. The historic Cornish Beam Engines are pumping clean water across London.</p>' +
      '<div class="steam-victory-btns">' +
      '<a href="https://waterandsteam.org.uk/" class="btn" target="_blank" rel="noopener noreferrer">Visit London Museum of Water &amp; Steam</a>' +
      '<button type="button" class="chip" data-steam-close-win>Close</button>' +
      '<button type="button" class="chip" data-steam-replay>Play again</button>' +
      '</div>' +
      '</div>';

    var closeWinBtn = bannerWrap.querySelector('[data-steam-close-win]');
    if (closeWinBtn) {
      closeWinBtn.addEventListener('click', close);
    }

    var replayBtn = bannerWrap.querySelector('[data-steam-replay]');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        currentLevelIdx = 0;
        allLevelsComplete = false;
        initLevelState(LEVELS[currentLevelIdx]);
        renderBoard();
        var firstTile = modal.querySelector('.pipe-tile');
        if (firstTile) firstTile.focus();
      });
    }

    var visitLink = bannerWrap.querySelector('a');
    if (visitLink) visitLink.focus();
  }

  function buildModal() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var backdrop = document.createElement('div');
    backdrop.className = 'steam-backdrop';
    backdrop.hidden = true;

    modal = document.createElement('div');
    modal.className = 'steam-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'steam-modal-title');

    modal.innerHTML =
      '<div class="steam-head">' +
      '<div class="steam-titles">' +
      '<p class="steam-kicker">Interactive Heritage Mini-Game</p>' +
      '<h2 id="steam-modal-title" class="steam-title">London Museum of Water &amp; Steam</h2>' +
      '<p class="steam-sub" data-steam-level-title>Level 1</p>' +
      '</div>' +
      '<div class="steam-actions">' +
      '<button type="button" class="chip" data-steam-sound aria-pressed="false">Sound: off</button>' +
      '<button type="button" class="chip" data-steam-reset aria-label="Scramble current puzzle">Reset</button>' +
      '<button type="button" class="chip" data-steam-close aria-label="Close puzzle">&times; Close</button>' +
      '</div>' +
      '</div>' +
      '<div class="steam-bar">' +
      '<div class="steam-stats">' +
      '<div class="steam-stat">Pipes connected: <span data-steam-stat-conn>0 / 0</span></div>' +
      '<div class="steam-stat">Steam pressure: <span data-steam-stat-psi>0 PSI</span></div>' +
      '</div>' +
      '<div class="meta" data-steam-level-sub>Connect the boiler to the pump wheel</div>' +
      '</div>' +
      '<div class="steam-stage">' +
      '<div class="steam-machine">' +
      '<div class="steam-boiler" data-steam-boiler></div>' +
      '<div class="steam-grid-wrap">' +
      '<div class="steam-grid" data-steam-grid role="group" aria-label="Pipe network grid. Use arrow keys to navigate, Space or Enter to rotate."></div>' +
      '</div>' +
      '<div class="steam-pump" data-steam-pump></div>' +
      '</div>' +
      '<div class="steam-sr" data-steam-announce role="status" aria-live="polite"></div>' +
      '<div class="steam-banner-wrap" data-steam-banner-wrap></div>' +
      '</div>';

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    window.addEventListener('resize', alignMachine);

    // Event handlers
    var closeBtn = modal.querySelector('[data-steam-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    var soundBtn = modal.querySelector('[data-steam-sound]');
    if (soundBtn) {
      soundBtn.addEventListener('click', function () {
        if (!soundOn && !ensureAudio()) return;
        soundOn = !soundOn;
        soundBtn.textContent = 'Sound: ' + (soundOn ? 'on' : 'off');
        soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
        if (soundOn && audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      });
    }

    var resetBtn = modal.querySelector('[data-steam-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        initLevelState(LEVELS[currentLevelIdx]);
        renderBoard();
        var firstTile = modal.querySelector('.pipe-tile');
        if (firstTile) firstTile.focus();
      });
    }

    // Keyboard navigation
    backdrop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }

      // Arrow keys navigation between tiles
      var target = e.target;
      if (target && target.classList.contains('pipe-tile')) {
        var r = parseInt(target.getAttribute('data-r'), 10);
        var c = parseInt(target.getAttribute('data-c'), 10);
        var level = LEVELS[currentLevelIdx];
        var nr = r, nc = c;

        if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
        else if (e.key === 'ArrowDown') nr = Math.min(level.rows - 1, r + 1);
        else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
        else if (e.key === 'ArrowRight') nc = Math.min(level.cols - 1, c + 1);
        else return;

        e.preventDefault();
        var nextTile = modal.querySelector('[data-r="' + nr + '"][data-c="' + nc + '"]');
        if (nextTile) nextTile.focus();
      }
    });
  }

  function open(btn) {
    opener = btn;
    if (!modal) buildModal();
    currentLevelIdx = 0;
    allLevelsComplete = false;
    initLevelState(LEVELS[currentLevelIdx]);
    renderBoard();

    var backdrop = modal.parentNode;
    backdrop.hidden = false;
    alignMachine();

    // Trap focus inside modal
    var firstFocusable = modal.querySelector('button, a');
    if (firstFocusable) firstFocusable.focus();
  }

  function close() {
    if (!modal) return;
    var backdrop = modal.parentNode;
    backdrop.hidden = true;
    if (opener && opener.focus) opener.focus();
  }

  AW.egg('steam', {
    toggle: function (btn) {
      if (modal && !modal.parentNode.hidden) close();
      else open(btn);
    },
    start: function () {},
    stop: close
  });
})();
