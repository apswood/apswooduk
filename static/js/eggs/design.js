/* Design Museum: Less, But Better (The Dieter Rams Precision Extractor).
   Wire-buzzer / Operation style puzzle where you extract decorative clutter
   with a steady hand to reveal pure industrial design archetypes.
   Pure vanilla JS, responsive SVG graphics, Web Audio synthesis, no dependencies.
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
  var buzzerOsc = null;
  var buzzerGain = null;

  var currentLevelIdx = 0;
  var levelSolved = false;
  var allLevelsComplete = false;
  var activePiece = null; // piece currently hooked onto the tool
  var dragging = false;
  var DOCK = { x: 150, y: 372 };
  var tool = { x: DOCK.x, y: DOCK.y };
  var steadyMeter = 100;
  var isBuzzing = false;
  var piecesRemaining = [];

  // Each piece is a bit of applied decoration. `art` is drawn in the piece's
  // local coordinates (origin = the extraction loop) so it travels with it.
  var LEVELS = [
    {
      id: 1,
      name: 'The Pocket Radio',
      subtitle: 'Braun T3 (1958) - Dieter Rams',
      principle: 'Good design is as little design as possible.',
      pieces: [
        {
          id: 'trim',
          name: 'Faux-Wood Side Cheek',
          startX: 161,
          startY: 205,
          path: [[161, 205], [100, 205], [100, 320], [35, 320]],
          exitX: 35,
          exitY: 320,
          quote: 'Good design is honest: it does not make a product look more luxurious than it is.',
          art:
            '<rect x="-13" y="-87" width="24" height="174" rx="9" fill="url(#des-wood)" stroke="#3d2410" stroke-width="1.5"/>' +
            '<g fill="none" stroke="#4a2a12" stroke-width="0.9" opacity="0.6">' +
            '<path d="M -8 -82 C -4 -50 -10 -20 -6 10 S -9 60 -7 82"/>' +
            '<path d="M -2 -84 C 1 -40 -4 -10 0 20 S -3 70 -1 84"/>' +
            '<path d="M 5 -82 C 7 -60 3 -30 6 0 S 4 50 6 82"/>' +
            '<ellipse cx="-3" cy="-30" rx="3" ry="8"/>' +
            '</g>' +
            '<circle cx="-1" cy="-74" r="2.6" fill="#d9b44a" stroke="#7a5c12"/>' +
            '<circle cx="-1" cy="74" r="2.6" fill="#d9b44a" stroke="#7a5c12"/>'
        },
        {
          id: 'aerial',
          name: 'Chrome Telescopic Aerial',
          startX: 420,
          startY: 112,
          path: [[420, 112], [505, 112], [505, 55], [565, 55]],
          exitX: 565,
          exitY: 55,
          quote: 'Good design is unobtrusive: products are tools, not decorative trophies.',
          art:
            '<g stroke-linecap="round" fill="none">' +
            '<path d="M 0 -2 L -14 -38 L -26 -70 L -38 -100" stroke="#3b3f45" stroke-width="7"/>' +
            '<path d="M 0 -2 L -14 -38" stroke="#cfd4da" stroke-width="5.5"/>' +
            '<path d="M -14 -38 L -26 -70" stroke="#dde1e6" stroke-width="4"/>' +
            '<path d="M -26 -70 L -38 -100" stroke="#e8ebee" stroke-width="2.6"/>' +
            '<path d="M -1 -6 L -38 -100" stroke="#fff" stroke-width="0.8" opacity="0.7"/>' +
            '</g>' +
            '<circle cx="-14" cy="-38" r="3.4" fill="#aeb4bb" stroke="#3b3f45"/>' +
            '<circle cx="-26" cy="-70" r="2.8" fill="#aeb4bb" stroke="#3b3f45"/>' +
            '<circle cx="-38" cy="-100" r="4.5" fill="url(#des-chrome)" stroke="#3b3f45"/>' +
            '<rect x="-10" y="-4" width="20" height="11" rx="3" fill="url(#des-chrome)" stroke="#3b3f45"/>'
        },
        {
          id: 'stripe',
          name: 'Go-Faster Racing Stripe',
          startX: 360,
          startY: 268,
          path: [[360, 268], [360, 335], [470, 335], [470, 372], [565, 372]],
          exitX: 565,
          exitY: 372,
          quote: 'Good design is thorough down to the last detail: nothing is arbitrary.',
          art:
            '<polygon points="-204,-13 86,-13 78,-5 -204,-5" fill="#c8321f" stroke="#7d1a0e" stroke-width="0.8"/>' +
            '<polygon points="-204,-2 76,-2 70,4 -204,4" fill="url(#des-chrome)" stroke="#5b6168" stroke-width="0.8"/>' +
            '<text x="-150" y="-6.5" font-family="Georgia,serif" font-style="italic" font-size="7" fill="#ffe7b0">Super De Luxe</text>'
        }
      ]
    },
    {
      id: 2,
      name: 'The Articulated Task Lamp',
      subtitle: 'Inspired by the Anglepoise (1932) - George Carwardine',
      principle: 'Good design makes a product useful whilst disregarding the superfluous.',
      pieces: [
        {
          id: 'frill',
          name: 'Gilded Shade Tassels',
          startX: 380,
          startY: 148,
          path: [[380, 148], [470, 148], [470, 250], [565, 250]],
          exitX: 565,
          exitY: 250,
          quote: 'Good design is aesthetic: the visual quality of a product is integral to its utility.',
          art:
            '<path d="M 11 -18 Q 8 -8 4 -13 Q 1 -3 -3 -8 Q -6 2 -10 -3" fill="none" stroke="#d4af37" stroke-width="2.5"/>' +
            '<g stroke="#d4af37" stroke-width="1.2" fill="#e8c55a">' +
            '<line x1="8" y1="-12" x2="8" y2="2"/><circle cx="8" cy="4" r="2.3"/>' +
            '<line x1="1" y1="-6" x2="1" y2="8"/><circle cx="1" cy="10" r="2.3"/>' +
            '<line x1="-6" y1="-1" x2="-6" y2="13"/><circle cx="-6" cy="15" r="2.3"/>' +
            '</g>'
        },
        {
          id: 'finial',
          name: 'Baroque Finial Urn',
          startX: 340,
          startY: 78,
          path: [[340, 78], [340, 40], [450, 40], [565, 40]],
          exitX: 565,
          exitY: 40,
          quote: 'Good design is long-lasting: it avoids being fashionable and never becomes outdated.',
          art:
            '<path d="M -5 20 L 5 20 L 3 12 Q 13 5 8 -6 Q 4 -12 0 -13 Q -4 -12 -8 -6 Q -13 5 -3 12 Z" fill="#d4af37" stroke="#6b5318" stroke-width="1.2"/>' +
            '<path d="M -7 -2 Q 0 4 7 -2" fill="none" stroke="#6b5318" stroke-width="1"/>' +
            '<circle cx="0" cy="-17" r="3.5" fill="#e8c55a" stroke="#6b5318"/>'
        },
        {
          id: 'bracket',
          name: 'Twisted Iron Flourish',
          startX: 275,
          startY: 240,
          path: [[275, 240], [150, 240], [150, 150], [35, 150]],
          exitX: 35,
          exitY: 150,
          quote: 'Good design is understandable: it clarifies the structure of the product.',
          art:
            '<g fill="none" stroke="#a49685" stroke-width="3" stroke-linecap="round">' +
            '<path d="M -3 0 C -22 -8 -30 12 -16 14 C -7 15 -7 5 -12 5"/>' +
            '<path d="M 3 0 C 22 8 30 -12 16 -14 C 7 -15 7 -5 12 -5"/>' +
            '</g>'
        }
      ]
    },
    {
      id: 3,
      name: 'The Pocket Calculator',
      subtitle: 'Inspired by Braun ET66 (1987) - Dieter Rams & Dietrich Lubs',
      principle: 'Simplicity is the prerequisite for reliability.',
      pieces: [
        {
          id: 'flap',
          name: 'Faux-Leather Flip Cover',
          startX: 210,
          startY: 200,
          path: [[210, 200], [115, 200], [115, 90], [35, 90]],
          exitX: 35,
          exitY: 90,
          quote: 'Good design is intuitive: controls should be immediately self-explanatory.',
          art:
            '<rect x="-14" y="-138" width="26" height="276" rx="8" fill="#5a3a26" stroke="#2e1c10" stroke-width="1.5"/>' +
            '<rect x="-9" y="-132" width="16" height="264" rx="5" fill="none" stroke="#c9a27a" stroke-width="1" stroke-dasharray="3 2.5"/>'
        },
        {
          id: 'bezel',
          name: 'Gold Marketing Bezel',
          startX: 300,
          startY: 70,
          path: [[300, 70], [300, 30], [440, 30], [565, 30]],
          exitX: 565,
          exitY: 30,
          quote: 'Good design is quiet: an everyday tool should not demand unnecessary attention.',
          art:
            '<rect x="-74" y="1" width="148" height="50" rx="6" fill="none" stroke="#d4af37" stroke-width="5"/>' +
            '<text x="0" y="62" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="8" fill="#d4af37">Executive Deluxe</text>'
        },
        {
          id: 'sliders',
          name: 'Confusing Slide Switches',
          startX: 360,
          startY: 334,
          path: [[360, 334], [480, 334], [480, 220], [565, 220]],
          exitX: 565,
          exitY: 220,
          quote: 'Good design is innovative: new technology enables ever cleaner execution.',
          art:
            '<g stroke="#000" stroke-width="1">' +
            '<rect x="-108" y="-6" width="22" height="10" rx="2" fill="#111"/><rect x="-106" y="-5" width="9" height="8" rx="1" fill="#c0c4c8"/>' +
            '<rect x="-80" y="-6" width="22" height="10" rx="2" fill="#111"/><rect x="-69" y="-5" width="9" height="8" rx="1" fill="#c0c4c8"/>' +
            '<rect x="-52" y="-6" width="22" height="10" rx="2" fill="#111"/><rect x="-46" y="-5" width="9" height="8" rx="1" fill="#c0c4c8"/>' +
            '</g>'
        }
      ]
    }
  ];

  var css =
    '.des-backdrop{position:fixed;inset:0;background:rgba(12,16,20,0.8);backdrop-filter:blur(3px);z-index:900;display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto}' +
    '.des-backdrop[hidden]{display:none}' +
    '.des-modal{background:var(--bg,#f6f1e7);color:var(--ink,#26292b);border:2px solid var(--accent,#1f5f7a);border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);width:100%;max-width:880px;padding:20px;margin:auto;position:relative;display:flex;flex-direction:column;gap:14px;box-sizing:border-box}' +
    '.des-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid var(--muted);padding-bottom:12px}' +
    '.des-titles{flex:1;min-width:240px}' +
    '.des-kicker{font-size:.78rem;font-family:var(--head);text-transform:uppercase;letter-spacing:.08em;color:var(--accent,#1f5f7a);margin:0 0 2px;font-weight:600}' +
    '.des-title{font-size:1.35rem;margin:0;line-height:1.2;font-family:var(--head)}' +
    '.des-sub{font-size:.88rem;color:var(--muted);margin:2px 0 0}' +
    '.des-actions{display:flex;align-items:center;gap:8px}' +
    '.des-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;background:var(--surface,#ece4d3);padding:8px 14px;border-radius:8px;font-size:.9rem}' +
    '.des-stats{display:flex;align-items:center;gap:16px}' +
    '.des-stat{font-weight:600}' +
    '.des-stat span{font-weight:normal;color:var(--muted)}' +
    '.des-meter-wrap{display:flex;align-items:center;gap:8px}' +
    '.des-meter-bar{width:110px;height:10px;background:#38322c;border-radius:5px;overflow:hidden;border:1px solid var(--muted)}' +
    '.des-meter-fill{height:100%;background:#34c759;width:100%;transition:width .1s,background-color .2s}' +
    '.des-meter-fill.warning{background:#ff9500}' +
    '.des-meter-fill.danger{background:#ff3b30}' +
    '.des-arena-wrap{background:#1a1714;border:2px solid #3c342c;border-radius:10px;padding:10px;box-shadow:inset 0 0 16px rgba(0,0,0,0.8);position:relative;touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.des-arena{width:100%;height:auto;max-height:480px;display:block;margin:0 auto;overflow:visible}' +
    '.wire-shadow,.wire-base,.wire-twist,.wire-glint{fill:none;stroke-linecap:round;stroke-linejoin:round}' +
    '.wire-shadow{stroke:rgba(0,0,0,0.55);stroke-width:6}' +
    '.wire-base{stroke:#9c5a24;stroke-width:4.5;transition:stroke .15s}' +
    '.wire-twist{stroke:#e3a568;stroke-width:4.5;stroke-dasharray:1.6 2.8;stroke-linecap:butt}' +
    '.wire-glint{stroke:rgba(255,236,205,0.55);stroke-width:1}' +
    '.wire-base.buzz{stroke:#ff3b30;filter:drop-shadow(0 0 6px #ff3322)}' +
    '.wire-twist.buzz{stroke:#ffc2b8}' +
    '.wire-post{fill:#2a2522;stroke:#5a504a;stroke-width:1.5}' +
    '.wire-target{fill:rgba(52,199,89,0.14);stroke:#34c759;stroke-width:2;stroke-dasharray:3 3;cursor:default}' +
    '.tool-hit{cursor:grab;outline:none}' +
    '.des-arena:has(.des-tool.grabbed) .tool-hit{cursor:grabbing}' +
    '.tool-dock{fill:rgba(255,255,255,0.03);stroke:#3a332d;stroke-width:1.5;stroke-dasharray:4 4}' +
    '.piece-eye{fill:none;stroke:#c9ced4;stroke-width:2;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.7))}' +
    '.piece-handle{fill:none;stroke:#c9ced4;stroke-width:3.2;filter:drop-shadow(1px 2px 1px rgba(0,0,0,0.7));transition:stroke .15s}' +
    '.piece-stem{stroke:#c9ced4;stroke-width:3.2;stroke-linecap:round}' +
    '.piece-grip{stroke:#b3261e;stroke-width:9;stroke-linecap:round}' +
    '.des-arena:has(.tool-hit:hover) .piece-handle,.des-tool.grabbed .piece-handle{stroke:#fff}' +
    '.des-tool.buzz .piece-handle{stroke:#ff3b30}' +
    '.des-arena:has(.tool-hit:focus-visible) .piece-handle{stroke:var(--focus,#9a3b00);stroke-width:4.5}' +
    '.piece-art{pointer-events:none}' +
    '.product-chassis{filter:drop-shadow(0 6px 14px rgba(0,0,0,0.6))}' +
    '.product-chassis.pure{filter:drop-shadow(0 0 16px rgba(120,190,220,0.45))}' +
    '.des-banner{background:var(--surface,#ece4d3);border:2px solid var(--accent,#1f5f7a);border-radius:8px;padding:12px 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;width:100%;box-sizing:border-box}' +
    '.des-banner h3{margin:0;font-size:1.1rem;color:var(--ink)}' +
    '.des-banner p{margin:2px 0 0;font-size:.9rem;color:var(--muted)}' +
    '.des-banner-actions{display:flex;gap:8px}' +
    '.des-victory-card{text-align:center;padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;background:var(--surface,#ece4d3);border-radius:10px;border:2px solid var(--accent)}' +
    '.des-victory-card h3{font-size:1.4rem;margin:0}' +
    '.des-victory-card p{max-width:54ch;margin:0 auto;color:var(--ink)}' +
    '.des-victory-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}' +
    '.des-quote-bar{font-style:italic;font-size:.85rem;color:var(--muted);min-height:1.4em;text-align:center;padding:2px 8px}' +
    '.des-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}' +
    '@media(max-width:600px){.des-modal{padding:12px}}';

  var SVG_DEFS =
    '<defs>' +
    '<linearGradient id="des-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f2ed"/><stop offset="1" stop-color="#d9d5cd"/></linearGradient>' +
    '<radialGradient id="des-dial" cx="0.4" cy="0.35" r="0.75"><stop offset="0" stop-color="#fbfaf7"/><stop offset="1" stop-color="#dcd8d0"/></radialGradient>' +
    '<linearGradient id="des-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#6e4220"/><stop offset="0.45" stop-color="#a06a35"/><stop offset="1" stop-color="#7a4a24"/></linearGradient>' +
    '<linearGradient id="des-chrome" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7f9fb"/><stop offset="0.5" stop-color="#9aa1a9"/><stop offset="0.55" stop-color="#d6dbe0"/><stop offset="1" stop-color="#6c737b"/></linearGradient>' +
    '<linearGradient id="des-enamel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d0453a"/><stop offset="1" stop-color="#8a1f18"/></linearGradient>' +
    '<linearGradient id="des-shade" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a1914"/><stop offset="0.4" stop-color="#d24a3f"/><stop offset="1" stop-color="#6e1611"/></linearGradient>' +
    '<linearGradient id="des-cone" x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stop-color="#ffe9a8" stop-opacity="0.45"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></linearGradient>' +
    '<linearGradient id="des-et66" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3632"/><stop offset="1" stop-color="#1d1b19"/></linearGradient>' +
    '<pattern id="des-mat" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="#221d19" stroke-width="1"/></pattern>' +
    '</defs>';

  function wireSvg(d, buzz) {
    var b = buzz ? ' buzz' : '';
    return (
      '<path class="wire-shadow" d="' + d + '" transform="translate(2,3)"/>' +
      '<path class="wire-base' + b + '" d="' + d + '"/>' +
      '<path class="wire-twist' + b + '" d="' + d + '"/>' +
      '<path class="wire-glint" d="' + d + '" transform="translate(-0.6,-0.8)"/>'
    );
  }

  // Braun T3: off-white body, square-gridded speaker perforations on the left,
  // big flush tuning disc on the right.
  function t3Artwork(isPure) {
    var holes = '';
    for (var r = 0; r < 11; r++) {
      for (var c = 0; c < 11; c++) {
        holes += '<circle cx="' + (178 + c * 12) + '" cy="' + (146 + r * 12) + '" r="2.5"/>';
      }
    }
    var ticks = '';
    for (var i = 0; i < 40; i++) {
      var a = (i / 40) * Math.PI * 2;
      var r1 = i % 5 === 0 ? 43 : 47;
      ticks += '<line x1="' + (375 + Math.cos(a) * r1).toFixed(1) + '" y1="' + (200 + Math.sin(a) * r1).toFixed(1) +
        '" x2="' + (375 + Math.cos(a) * 51).toFixed(1) + '" y2="' + (200 + Math.sin(a) * 51).toFixed(1) + '"/>';
    }
    return (
      '<g id="product-art">' +
      '<rect class="product-chassis' + (isPure ? ' pure' : '') + '" x="150" y="120" width="300" height="170" rx="14" fill="url(#des-body)" stroke="#bdb8ae" stroke-width="1.5"/>' +
      '<rect x="153" y="122" width="294" height="4" rx="2" fill="#fff" opacity="0.6"/>' +
      '<g fill="#3d3a36">' + holes + '</g>' +
      '<circle cx="375" cy="200" r="60" fill="#c9c4bb"/>' +
      '<circle cx="375" cy="200" r="57" fill="url(#des-dial)" stroke="#b5b0a6"/>' +
      '<g stroke="#77736c" stroke-width="1">' + ticks + '</g>' +
      '<circle cx="375" cy="200" r="31" fill="none" stroke="#cbc6bd"/>' +
      '<circle cx="375" cy="200" r="15" fill="#e6e2da" stroke="#b5b0a6"/>' +
      '<path d="M 371 128 L 379 128 L 375 135 Z" fill="#3d3a36"/>' +
      '<text x="173" y="283" font-family="Helvetica,Arial,sans-serif" font-size="8" font-weight="bold" letter-spacing="0.5" fill="#8a857c">BRAUN</text>' +
      (isPure ? '<text x="300" y="312" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">LESS, BUT BETTER</text>' : '') +
      '</g>'
    );
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    var dx = x2 - x1;
    var dy = y2 - y1;
    var l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    var t = ((px - x1) * dx + (py - y1) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    var cx = x1 + t * dx;
    var cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  }

  function distToPath(px, py, points) {
    var minDist = Infinity;
    for (var i = 0; i < points.length - 1; i++) {
      var d = distToSegment(px, py, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
      if (d < minDist) minDist = d;
    }
    return minDist;
  }

  function ensureAudio() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.12;
      masterGain.connect(audioCtx.destination);
      return true;
    } catch (e) {
      return false;
    }
  }

  function startBuzzerSound() {
    if (!soundOn || !ensureAudio() || buzzerOsc) return;
    try {
      buzzerOsc = audioCtx.createOscillator();
      buzzerGain = audioCtx.createGain();
      buzzerOsc.type = 'sawtooth';
      buzzerOsc.frequency.setValueAtTime(135, audioCtx.currentTime);
      buzzerGain.gain.setValueAtTime(0.28, audioCtx.currentTime);
      buzzerOsc.connect(buzzerGain);
      buzzerGain.connect(masterGain);
      buzzerOsc.start();
    } catch (e) {}
  }

  function stopBuzzerSound() {
    if (buzzerOsc) {
      try {
        buzzerOsc.stop();
        buzzerOsc.disconnect();
      } catch (e) {}
      buzzerOsc = null;
      buzzerGain = null;
    }
  }

  function playClick() {
    if (!soundOn || !ensureAudio()) return;
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var g = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.03);
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.035);
  }

  function playExtractSuccess() {
    if (!soundOn || !ensureAudio()) return;
    var t = audioCtx.currentTime;
    [523.25, 659.25].forEach(function (f, idx) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      var delay = t + idx * 0.06;
      g.gain.setValueAtTime(0, delay);
      g.gain.linearRampToValueAtTime(0.3, delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, delay + 0.6);
      o.connect(g);
      g.connect(masterGain);
      o.start(delay);
      o.stop(delay + 0.65);
    });
  }

  function playLevelSuccess() {
    if (!soundOn || !ensureAudio()) return;
    var t = audioCtx.currentTime;
    [440, 554.37, 659.25, 880].forEach(function (f, idx) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      var delay = t + idx * 0.07;
      g.gain.setValueAtTime(0, delay);
      g.gain.linearRampToValueAtTime(0.35, delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, delay + 0.8);
      o.connect(g);
      g.connect(masterGain);
      o.start(delay);
      o.stop(delay + 0.85);
    });
  }

  // Pair of parallel rods between two points, like the Anglepoise arms
  function rodPair(x1, y1, x2, y2, off) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    var nx = (-dy / len) * off, ny = (dx / len) * off;
    return [-1, 1].map(function (s) {
      return '<line x1="' + (x1 + nx * s).toFixed(1) + '" y1="' + (y1 + ny * s).toFixed(1) +
        '" x2="' + (x2 + nx * s).toFixed(1) + '" y2="' + (y2 + ny * s).toFixed(1) + '"/>';
    }).join('');
  }

  function springPath(x1, y1, x2, y2, coils) {
    var dx = x2 - x1, dy = y2 - y1;
    var len = Math.hypot(dx, dy);
    var nx = -dy / len, ny = dx / len;
    var d = 'M ' + x1 + ' ' + y1;
    var steps = coils * 2;
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      var s = i % 2 ? 2.6 : -2.6;
      d += ' L ' + (x1 + dx * t + nx * s).toFixed(1) + ' ' + (y1 + dy * t + ny * s).toFixed(1);
    }
    return d + ' L ' + x2 + ' ' + y2;
  }

  // Anglepoise 1227: stepped base, twin-rod arms, three base springs and a
  // spun-metal bell shade. Lit once the clutter is gone.
  function lampArtwork(isPure) {
    var springs = '';
    [[279, 298, 261, 214], [285, 298, 265, 216], [291, 298, 269, 218]].forEach(function (s) {
      springs += '<path d="' + springPath(s[0], s[1], s[2], s[3], 9) + '"/>';
    });
    return (
      '<g id="product-art">' +
      // Warm light pool when the lamp is restored
      (isPure ? '<polygon points="397,118 358,157 380,392 560,392" fill="url(#des-cone)"/>' : '') +
      // Stepped cast base in red enamel
      '<rect class="product-chassis' + (isPure ? ' pure' : '') + '" x="228" y="306" width="144" height="22" rx="5" fill="url(#des-enamel)" stroke="#4a0f0b" stroke-width="1.5"/>' +
      '<rect x="252" y="294" width="96" height="14" rx="5" fill="url(#des-enamel)" stroke="#4a0f0b" stroke-width="1.2"/>' +
      '<rect x="232" y="308" width="136" height="2" rx="1" fill="#fff" opacity="0.25"/>' +
      // Pivot bracket
      '<path d="M 290 296 L 290 284 Q 300 276 310 284 L 310 296 Z" fill="#c9ced4" stroke="#5b6168"/>' +
      // Springs, then the arms
      '<g fill="none" stroke="#dfe3e7" stroke-width="1.2" stroke-linejoin="round">' + springs + '</g>' +
      '<g stroke="#c9ced4" stroke-width="2.6" stroke-linecap="round">' +
      rodPair(300, 288, 250, 180, 3.6) + rodPair(250, 180, 343, 103, 3) +
      '</g>' +
      '<g stroke="#ffffff" stroke-width="0.7" opacity="0.6">' + rodPair(300, 288, 250, 180, 4.6) + '</g>' +
      // Knuckles
      '<circle cx="300" cy="287" r="6" fill="#2b2b2b" stroke="#c9ced4" stroke-width="2"/>' +
      '<circle cx="250" cy="180" r="7" fill="#2b2b2b" stroke="#c9ced4" stroke-width="2"/>' +
      '<circle cx="343" cy="103" r="6" fill="#2b2b2b" stroke="#c9ced4" stroke-width="2"/>' +
      // Shade, drawn pointing down its own axis then turned to face down-right
      '<g transform="translate(345 105) rotate(-45)">' +
      '<rect x="-6" y="0" width="12" height="15" rx="2" fill="url(#des-enamel)" stroke="#4a0f0b"/>' +
      '<path d="M -8 14 Q -11 30 -28 46 L 28 46 Q 11 30 8 14 Z" fill="url(#des-shade)" stroke="#4a0f0b" stroke-width="1.2"/>' +
      '<path d="M -6 18 Q -8 30 -20 42" fill="none" stroke="#fff" stroke-width="1.6" opacity="0.35"/>' +
      '<ellipse cx="0" cy="46" rx="28" ry="5" fill="' + (isPure ? '#fff3c4' : '#3a1210') + '" stroke="#4a0f0b"/>' +
      (isPure ? '<ellipse cx="0" cy="45" rx="12" ry="3" fill="#ffffff"/>' : '') +
      '</g>' +
      (isPure ? '<text x="300" y="346" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">ANGLEPOISE ICON</text>' : '') +
      '</g>'
    );
  }

  // Braun ET66: dark case, inset display, convex round keys with the
  // famous yellow equals key.
  function et66Artwork(isPure) {
    var rows = [
      ['C', 'M', '%', '÷'],
      ['7', '8', '9', '×'],
      ['4', '5', '6', '−'],
      ['1', '2', '3', '+'],
      ['0', '.', '±', '=']
    ];
    var cols = [238, 278, 318, 360];
    var keys = '';
    rows.forEach(function (row, ri) {
      row.forEach(function (label, ci) {
        var x = cols[ci], y = 152 + ri * 38;
        var fill = '#3b3734', ink = '#f1ede6';
        if (ci === 3) fill = '#5d4a38';
        if (label === 'C') fill = '#c4441c';
        if (label === 'M' || label === '%') fill = '#68625c';
        if (label === '=') { fill = '#e8b10c'; ink = '#2b2006'; }
        keys +=
          '<circle cx="' + x + '" cy="' + (y + 1.6) + '" r="14.5" fill="#0d0c0b"/>' +
          '<circle cx="' + x + '" cy="' + y + '" r="14" fill="' + fill + '"/>' +
          '<circle cx="' + (x - 3) + '" cy="' + (y - 4) + '" r="9" fill="#fff" opacity="0.12"/>' +
          '<text x="' + x + '" y="' + (y + 3.6) + '" text-anchor="middle" font-family="Helvetica,Arial,sans-serif" font-size="10.5" font-weight="bold" fill="' + ink + '">' + label + '</text>';
      });
    });
    return (
      '<g id="product-art">' +
      '<rect class="product-chassis' + (isPure ? ' pure' : '') + '" x="210" y="55" width="180" height="290" rx="14" fill="url(#des-et66)" stroke="#0d0c0b" stroke-width="2"/>' +
      '<rect x="214" y="58" width="172" height="3" rx="1.5" fill="#fff" opacity="0.12"/>' +
      // Display window
      '<rect x="228" y="72" width="144" height="46" rx="4" fill="#111"/>' +
      '<rect x="234" y="78" width="132" height="34" rx="2" fill="#9aa38f"/>' +
      '<rect x="234" y="78" width="132" height="6" fill="#fff" opacity="0.12"/>' +
      '<text x="360" y="104" text-anchor="end" font-family="monospace" font-size="20" font-weight="bold" fill="#1b2416">0.</text>' +
      '<text x="232" y="134" font-family="Helvetica,Arial,sans-serif" font-size="7" font-weight="bold" letter-spacing="0.5" fill="#bcb6ac">BRAUN</text>' +
      '<text x="368" y="134" text-anchor="end" font-family="Helvetica,Arial,sans-serif" font-size="7" fill="#8f8a82">ET 66</text>' +
      keys +
      (isPure ? '<text x="300" y="362" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">ET66 ARCHETYPE</text>' : '') +
      '</g>'
    );
  }

  function getProductArtwork(levelIdx, isPure) {
    if (levelIdx === 0) {
      return t3Artwork(isPure);
    }
    if (levelIdx === 1) return lampArtwork(isPure);
    if (levelIdx === 2) return et66Artwork(isPure);
    return '';
  }

  function pathToD(points) {
    if (!points || points.length === 0) return '';
    var d = 'M ' + points[0][0] + ' ' + points[0][1];
    for (var i = 1; i < points.length; i++) {
      d += ' L ' + points[i][0] + ' ' + points[i][1];
    }
    return d;
  }

  function initLevel(levelIdx) {
    currentLevelIdx = levelIdx;
    levelSolved = false;
    activePiece = null;
    dragging = false;
    tool = { x: DOCK.x, y: DOCK.y };
    steadyMeter = 100;
    isBuzzing = false;
    var level = LEVELS[levelIdx];
    piecesRemaining = level.pieces.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        startX: p.startX,
        startY: p.startY,
        x: p.startX,
        y: p.startY,
        path: p.path,
        exitX: p.exitX,
        exitY: p.exitY,
        quote: p.quote,
        art: p.art,
        extracted: false
      };
    });
  }

  function toolSvg() {
    var cls = 'des-tool' + (dragging ? ' grabbed' : '') + (activePiece ? ' hooked' : '') + (isBuzzing ? ' buzz' : '');
    return (
      '<g class="' + cls + '" transform="translate(' + tool.x + ',' + tool.y + ')">' +
      '<line class="piece-stem" x1="15.5" y1="15.5" x2="30" y2="30"/>' +
      '<line class="piece-grip" x1="31" y1="31" x2="48" y2="48"/>' +
      '<circle class="piece-handle" cx="0" cy="0" r="22"/>' +
      '</g>'
    );
  }

  // The wire passes under the loop on one side and over it on the other. The
  // whole loop is drawn beneath the wires; this redraws the arc where the wire
  // exits (towards the bin) on top, giving the over-under depth cue.
  function toolFrontSvg() {
    if (!activePiece) return '';
    var pts = activePiece.path;
    var best = Infinity;
    var ang = 0;
    for (var i = 0; i < pts.length - 1; i++) {
      var d = distToSegment(tool.x, tool.y, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
      if (d < best) {
        best = d;
        ang = Math.atan2(pts[i + 1][1] - pts[i][1], pts[i + 1][0] - pts[i][0]);
      }
    }
    var r = 22;
    var span = 0.55;
    var x1 = (Math.cos(ang - span) * r).toFixed(2);
    var y1 = (Math.sin(ang - span) * r).toFixed(2);
    var x2 = (Math.cos(ang + span) * r).toFixed(2);
    var y2 = (Math.sin(ang + span) * r).toFixed(2);
    var cls = 'des-tool des-tool-front' + (dragging ? ' grabbed' : '') + (isBuzzing ? ' buzz' : '');
    return (
      '<g class="' + cls + '" transform="translate(' + tool.x + ',' + tool.y + ')">' +
      '<path class="piece-handle" d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 0 1 ' + x2 + ' ' + y2 + '"/>' +
      '</g>'
    );
  }

  function renderArena() {
    if (!modal) return;
    var level = LEVELS[currentLevelIdx];
    var arena = modal.querySelector('[data-des-arena]');
    var statClutter = modal.querySelector('[data-des-stat-clutter]');
    var statPurity = modal.querySelector('[data-des-stat-purity]');
    var meterFill = modal.querySelector('[data-des-meter-fill]');
    var levelTitle = modal.querySelector('[data-des-level-title]');
    var levelSub = modal.querySelector('[data-des-level-sub]');
    var quoteBar = modal.querySelector('[data-des-quote-bar]');

    var extractedCount = level.pieces.length - piecesRemaining.filter(function (p) { return !p.extracted; }).length;
    var purity = Math.round((extractedCount / level.pieces.length) * 100);

    if (levelTitle) levelTitle.textContent = 'Level ' + (currentLevelIdx + 1) + ': ' + level.name;
    if (levelSub) levelSub.textContent = level.subtitle;
    if (statClutter) statClutter.textContent = (level.pieces.length - extractedCount) + ' items';
    if (statPurity) statPurity.textContent = purity + '%';

    if (meterFill) {
      meterFill.style.width = steadyMeter + '%';
      meterFill.classList.toggle('warning', steadyMeter < 60 && steadyMeter >= 30);
      meterFill.classList.toggle('danger', steadyMeter < 30);
    }

    var isPure = extractedCount === level.pieces.length;

    var svgContent = SVG_DEFS;
    // Workbench cutting mat
    svgContent += '<rect width="600" height="400" fill="#151210" rx="8"/>';
    svgContent += '<rect width="600" height="400" fill="url(#des-mat)" rx="8"/>';

    // Tool rest, where the hook waits between pieces
    svgContent += '<circle class="tool-dock" cx="' + DOCK.x + '" cy="' + DOCK.y + '" r="26"/>';

    // Central Product Chassis
    svgContent += getProductArtwork(currentLevelIdx, isPure);

    // Clutter still attached to the product, each with an eyelet to hook
    piecesRemaining.forEach(function (p) {
      if (p.extracted) return;
      svgContent +=
        '<g class="piece-art" transform="translate(' + p.x + ',' + p.y + ')">' + p.art +
        '<circle class="piece-eye" cx="0" cy="0" r="5"/>' +
        '</g>';
    });

    // The loop sits under the wires so the wire reads as threaded through it
    svgContent += toolSvg();

    // Buzz wires and recycling bins for unextracted pieces
    piecesRemaining.forEach(function (p) {
      if (p.extracted) return;
      var isPieceActive = activePiece && activePiece.id === p.id;
      svgContent += '<circle class="wire-target" cx="' + p.exitX + '" cy="' + p.exitY + '" r="22"/>';
      svgContent += wireSvg(pathToD(p.path), isPieceActive && isBuzzing);
      svgContent += '<circle class="wire-post" cx="' + p.exitX + '" cy="' + p.exitY + '" r="5"/>';
      svgContent += '<text x="' + p.exitX + '" y="' + (p.exitY + 34) + '" text-anchor="middle" font-family="sans-serif" font-size="7.5" font-weight="bold" letter-spacing="0.5" fill="#34c759">RECYCLE</text>';
    });

    // Near side of the loop, drawn over the wire so it reads as threaded through
    svgContent += toolFrontSvg();

    // Invisible grab target on top of everything, matching the tool's shape
    svgContent +=
      '<g class="tool-hit" data-des-tool transform="translate(' + tool.x + ',' + tool.y + ')" role="button" tabindex="0" aria-label="' +
      (activePiece ? 'Hook attached to ' + activePiece.name + '. Use arrow keys to guide it along the wire to the recycling bin.' : 'Hook tool. Move it onto a piece of clutter to attach it, or press Enter to hook the next piece.') + '">' +
      '<circle cx="0" cy="0" r="25" fill="transparent"/>' +
      '<line x1="12" y1="12" x2="48" y2="48" stroke="transparent" stroke-width="16" stroke-linecap="round"/>' +
      '</g>';

    var hadFocus = arena.contains(document.activeElement);
    arena.innerHTML = svgContent;

    var toolEl = arena.querySelector('[data-des-tool]');
    toolEl.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      grabTool(e);
    });
    toolEl.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!activePiece) hookNext();
      } else {
        handleKeyNudge(e);
      }
    });
    // innerHTML rebuild drops focus; restore it so keyboard play continues
    if (hadFocus) toolEl.focus();

    // Check if level just won
    if (isPure && !levelSolved) {
      levelSolved = true;
      playLevelSuccess();
      if (quoteBar) quoteBar.textContent = '"' + level.principle + '"';

      if (currentLevelIdx === LEVELS.length - 1) {
        allLevelsComplete = true;
        AW.found('design');
        renderVictory();
      } else {
        renderLevelWinBanner(level);
      }
    }
  }

  function hookPiece(p) {
    activePiece = p;
    tool.x = p.x;
    tool.y = p.y;
    playClick();
    var announce = modal.querySelector('[data-des-announce]');
    if (announce) announce.textContent = 'Hooked ' + p.name + '. Guide the loop along the wire to the recycling bin without touching it.';
    var quoteBar = modal.querySelector('[data-des-quote-bar]');
    if (quoteBar) quoteBar.textContent = 'Hooked: ' + p.name + '. Now run it along the wire to the recycling bin.';
  }

  function hookNext() {
    var next = piecesRemaining.filter(function (p) { return !p.extracted; })[0];
    if (!next) return;
    hookPiece(next);
    renderArena();
  }

  function grabTool(pointerEvt) {
    dragging = true;
    renderArena();

    var arena = modal.querySelector('[data-des-arena]');
    var svgW = 600, svgH = 400;

    function toSvg(e) {
      var r = arena.getBoundingClientRect();
      if (!r.width || !r.height) return [tool.x, tool.y];
      return [(e.clientX - r.left) * (svgW / r.width), (e.clientY - r.top) * (svgH / r.height)];
    }

    // Keep the tool where it was grabbed rather than snapping its centre to the pointer
    var start = toSvg(pointerEvt);
    var offX = tool.x - start[0];
    var offY = tool.y - start[1];

    function onPointerMove(e) {
      if (!dragging) return;
      var pt = toSvg(e);
      moveTool(pt[0] + offX, pt[1] + offY);
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dropTool();
    }

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  function handleKeyNudge(e) {
    var step = 8;
    var nx = tool.x;
    var ny = tool.y;

    if (e.key === 'ArrowUp') ny -= step;
    else if (e.key === 'ArrowDown') ny += step;
    else if (e.key === 'ArrowLeft') nx -= step;
    else if (e.key === 'ArrowRight') nx += step;
    else return;

    e.preventDefault();
    moveTool(nx, ny);
  }

  function moveTool(nx, ny) {
    tool.x = Math.max(10, Math.min(590, nx));
    tool.y = Math.max(10, Math.min(390, ny));

    if (!activePiece) {
      // Free movement until the loop reaches an eyelet, then it hooks on
      var hit = piecesRemaining.filter(function (p) {
        return !p.extracted && Math.hypot(tool.x - p.x, tool.y - p.y) < 16;
      })[0];
      if (hit) hookPiece(hit);
      renderArena();
      return;
    }

    activePiece.x = tool.x;
    activePiece.y = tool.y;

    // Collision check: Distance to path centerline
    var dist = distToPath(activePiece.x, activePiece.y, activePiece.path);
    var tolerance = 18; // clearance tolerance in SVG units

    if (dist > tolerance) {
      // Touching the wire boundary!
      if (!isBuzzing) {
        isBuzzing = true;
        startBuzzerSound();
        if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
      }
      steadyMeter = Math.max(0, steadyMeter - 1.6);
      if (steadyMeter <= 0) {
        // Reset piece back to its socket, still hooked, and let go of the drag
        stopBuzzerSound();
        isBuzzing = false;
        dragging = false;
        activePiece.x = tool.x = activePiece.startX;
        activePiece.y = tool.y = activePiece.startY;
        steadyMeter = 100;
        playClick();
        var announce = modal.querySelector('[data-des-announce]');
        if (announce) announce.textContent = 'Unsteady hand. Piece reset to socket. Steady yourself and try again.';
      }
    } else {
      if (isBuzzing) {
        isBuzzing = false;
        stopBuzzerSound();
      }
      steadyMeter = Math.min(100, steadyMeter + 0.3);
    }

    // Check exit target reached
    var distToExit = Math.hypot(activePiece.x - activePiece.exitX, activePiece.y - activePiece.exitY);
    if (distToExit < 24) {
      // Extracted cleanly!
      stopBuzzerSound();
      isBuzzing = false;
      activePiece.extracted = true;
      var q = activePiece.quote;
      playExtractSuccess();
      var quoteBar = modal.querySelector('[data-des-quote-bar]');
      if (quoteBar && q) quoteBar.textContent = '"' + q + '"';
      activePiece = null;
    }

    renderArena();
  }

  function dropTool() {
    stopBuzzerSound();
    isBuzzing = false;
    dragging = false;
    renderArena();
  }

  function renderLevelWinBanner(level) {
    var bannerWrap = modal.querySelector('[data-des-banner-wrap]');
    if (!bannerWrap) return;
    bannerWrap.innerHTML =
      '<div class="des-banner" role="status">' +
      '<div>' +
      '<h3>Level Complete: ' + level.name + ' Restored!</h3>' +
      '<p>All decorative clutter extracted cleanly. Purity: 100%.</p>' +
      '</div>' +
      '<div class="des-banner-actions">' +
      '<button type="button" class="btn" data-des-next>Next Design Icon &rarr;</button>' +
      '</div>' +
      '</div>';

    var nextBtn = bannerWrap.querySelector('[data-des-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        initLevel(currentLevelIdx + 1);
        renderArena();
        bannerWrap.innerHTML = '';
      });
      nextBtn.focus();
    }
  }

  function renderVictory() {
    var bannerWrap = modal.querySelector('[data-des-banner-wrap]');
    if (!bannerWrap) return;

    bannerWrap.innerHTML =
      '<div class="des-victory-card" role="status">' +
      '<h3>All Objects Reduced to Pure Functional Elegance</h3>' +
      '<p>Less, but better. You have extracted all the decorative clutter without damaging the functional core. Dieter Rams would approve.</p>' +
      '<div class="des-victory-btns">' +
      '<a href="https://designmuseum.org/" class="btn" target="_blank" rel="noopener noreferrer">Visit the Design Museum</a>' +
      '<button type="button" class="chip" data-des-close-win>Close</button>' +
      '<button type="button" class="chip" data-des-replay>Play again</button>' +
      '</div>' +
      '</div>';

    var closeWinBtn = bannerWrap.querySelector('[data-des-close-win]');
    if (closeWinBtn) closeWinBtn.addEventListener('click', close);

    var replayBtn = bannerWrap.querySelector('[data-des-replay]');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        initLevel(0);
        bannerWrap.innerHTML = '';
        renderArena();
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
    backdrop.className = 'des-backdrop';
    backdrop.hidden = true;

    modal = document.createElement('div');
    modal.className = 'des-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'des-modal-title');

    modal.innerHTML =
      '<div class="des-head">' +
      '<div class="des-titles">' +
      '<p class="des-kicker">Design Museum Mini-Game</p>' +
      '<h2 id="des-modal-title" class="des-title">Less, But Better</h2>' +
      '<p class="des-sub" data-des-level-title>Level 1</p>' +
      '</div>' +
      '<div class="des-actions">' +
      '<button type="button" class="chip" data-des-sound aria-pressed="false">Sound: off</button>' +
      '<button type="button" class="chip" data-des-reset aria-label="Reset current level">Reset</button>' +
      '<button type="button" class="chip" data-des-close aria-label="Close puzzle">&times; Close</button>' +
      '</div>' +
      '</div>' +
      '<div class="des-bar">' +
      '<div class="des-stats">' +
      '<div class="des-stat">Superfluous clutter: <span data-des-stat-clutter>3 items</span></div>' +
      '<div class="des-stat">Purity: <span data-des-stat-purity>0%</span></div>' +
      '</div>' +
      '<div class="des-meter-wrap">' +
      '<span class="meta">Steady Hand:</span>' +
      '<div class="des-meter-bar"><div class="des-meter-fill" data-des-meter-fill></div></div>' +
      '</div>' +
      '</div>' +
      '<div class="des-arena-wrap">' +
      '<svg class="des-arena" data-des-arena viewBox="0 0 600 400" preserveAspectRatio="xMidYMid meet" role="application" aria-label="Precision extraction workbench"></svg>' +
      '</div>' +
      '<div class="des-quote-bar" data-des-quote-bar>Drag the hook onto a piece of clutter, then guide it along the wire to the recycling bin.</div>' +
      '<div class="des-sr" data-des-announce role="status" aria-live="polite"></div>' +
      '<div class="des-banner-wrap" data-des-banner-wrap></div>';

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // Event handlers
    var closeBtn = modal.querySelector('[data-des-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    var soundBtn = modal.querySelector('[data-des-sound]');
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

    var resetBtn = modal.querySelector('[data-des-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        initLevel(currentLevelIdx);
        renderArena();
      });
    }

    backdrop.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });
  }

  function open(btn) {
    opener = btn;
    if (!modal) buildModal();
    initLevel(0);
    renderArena();

    var backdrop = modal.parentNode;
    backdrop.hidden = false;

    var firstFocusable = modal.querySelector('button, a');
    if (firstFocusable) firstFocusable.focus();
  }

  function close() {
    stopBuzzerSound();
    if (!modal) return;
    var backdrop = modal.parentNode;
    backdrop.hidden = true;
    if (opener && opener.focus) opener.focus();
  }

  AW.egg('design', {
    toggle: function (btn) {
      if (modal && !modal.parentNode.hidden) close();
      else open(btn);
    },
    start: function () {},
    stop: close
  });
})();
