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
  var activePiece = null;
  var steadyMeter = 100;
  var isBuzzing = false;
  var piecesRemaining = [];

  var LEVELS = [
    {
      id: 1,
      name: 'The Transistor Radio',
      subtitle: 'Inspired by Braun T3 (1958) - Dieter Rams',
      principle: 'Good design is as little design as possible.',
      pieces: [
        {
          id: 'trim',
          name: 'Faux-Wood Side Trim',
          startX: 175,
          startY: 230,
          path: [[175, 230], [110, 230], [110, 140], [35, 140]],
          exitX: 35,
          exitY: 140,
          quote: 'Good design is honest: it does not make a product look more luxurious than it is.'
        },
        {
          id: 'aerial',
          name: 'Chrome Telescopic Aerial',
          startX: 220,
          startY: 110,
          path: [[220, 110], [220, 45], [110, 45], [35, 45]],
          exitX: 35,
          exitY: 45,
          quote: 'Good design is unobtrusive: products are tools, not decorative trophies.'
        },
        {
          id: 'stripe',
          name: 'Metallic Racing Stripe',
          startX: 425,
          startY: 260,
          path: [[425, 260], [485, 260], [485, 160], [565, 160]],
          exitX: 565,
          exitY: 160,
          quote: 'Good design is thorough down to the last detail: nothing is arbitrary.'
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
          name: 'Gilded Shade Frills',
          startX: 400,
          startY: 280,
          path: [[400, 280], [400, 355], [260, 355], [35, 355]],
          exitX: 35,
          exitY: 355,
          quote: 'Good design is aesthetic: the visual quality of a product is integral to its utility.'
        },
        {
          id: 'finial',
          name: 'Baroque Finial Urn',
          startX: 275,
          startY: 105,
          path: [[275, 105], [275, 40], [430, 40], [565, 40]],
          exitX: 565,
          exitY: 40,
          quote: 'Good design is long-lasting: it avoids being fashionable and never becomes outdated.'
        },
        {
          id: 'bracket',
          name: 'Twisted Iron Flourish',
          startX: 215,
          startY: 220,
          path: [[215, 220], [130, 220], [130, 150], [35, 150]],
          exitX: 35,
          exitY: 150,
          quote: 'Good design is understandable: it clarifies the structure of the product.'
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
          startX: 180,
          startY: 190,
          path: [[180, 190], [115, 190], [115, 90], [35, 90]],
          exitX: 35,
          exitY: 90,
          quote: 'Good design is intuitive: controls should be immediately self-explanatory.'
        },
        {
          id: 'bezel',
          name: 'Gold Marketing Bezel',
          startX: 300,
          startY: 75,
          path: [[300, 75], [300, 35], [440, 35], [565, 35]],
          exitX: 565,
          exitY: 35,
          quote: 'Good design is quiet: an everyday tool should not demand unnecessary attention.'
        },
        {
          id: 'sliders',
          name: 'Confusing Slide Switches',
          startX: 420,
          startY: 310,
          path: [[420, 310], [500, 310], [500, 220], [565, 220]],
          exitX: 565,
          exitY: 220,
          quote: 'Good design is innovative: new technology enables ever cleaner execution.'
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
    '.wire-channel{stroke:#383028;stroke-width:32;fill:none;stroke-linecap:round;stroke-linejoin:round;transition:stroke .15s}' +
    '.wire-channel.buzz{stroke:#992211;filter:drop-shadow(0 0 8px #ff3322)}' +
    '.wire-core{stroke:#6b5a4a;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:4 4}' +
    '.wire-target{fill:rgba(52,199,89,0.2);stroke:#34c759;stroke-width:2.5;stroke-dasharray:3 3;cursor:default}' +
    '.wire-piece{cursor:grab;outline:none}' +
    '.wire-piece:focus-visible .piece-handle{stroke:var(--focus,#9a3b00);stroke-width:4}' +
    '.wire-piece.grabbed{cursor:grabbing}' +
    '.piece-handle{fill:#d4af37;stroke:#6b5318;stroke-width:2.5;transition:transform .1s}' +
    '.piece-label{font-family:var(--head,sans-serif);font-size:10px;font-weight:bold;fill:#1a140b;text-anchor:middle;pointer-events:none}' +
    '.product-chassis{fill:#2b2622;stroke:#473e36;stroke-width:3;filter:drop-shadow(0 6px 14px rgba(0,0,0,0.6))}' +
    '.product-chassis.pure{fill:#36302a;stroke:var(--accent,#1f5f7a);stroke-width:4;filter:drop-shadow(0 0 14px rgba(31,95,122,0.4))}' +
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
    '@media(max-width:600px){.des-modal{padding:12px}.wire-channel{stroke-width:38}}';

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

  function getProductArtwork(levelIdx, isPure) {
    if (levelIdx === 0) {
      // Braun T3 Radio
      return (
        '<g id="product-art">' +
        '<rect class="product-chassis' + (isPure ? ' pure' : '') + '" x="180" y="70" width="240" height="260" rx="16"/>' +
        // Speaker grille
        '<g fill="' + (isPure ? '#201b17' : '#181412') + '">' +
        '<circle cx="300" cy="225" r="54" fill="' + (isPure ? '#201b17' : '#181412') + '"/>' +
        '<circle cx="300" cy="225" r="52" fill="none" stroke="' + (isPure ? '#4a4037' : '#302822') + '" stroke-width="1.5"/>' +
        '</g>' +
        // Perforations in speaker
        '<g fill="' + (isPure ? '#fff' : '#6b5c4f') + '" opacity="0.75">' +
        '<circle cx="280" cy="210" r="2.5"/><circle cx="300" cy="210" r="2.5"/><circle cx="320" cy="210" r="2.5"/>' +
        '<circle cx="270" cy="225" r="2.5"/><circle cx="290" cy="225" r="2.5"/><circle cx="310" cy="225" r="2.5"/><circle cx="330" cy="225" r="2.5"/>' +
        '<circle cx="280" cy="240" r="2.5"/><circle cx="300" cy="240" r="2.5"/><circle cx="320" cy="240" r="2.5"/>' +
        '</g>' +
        // Tuning Dial
        '<circle cx="300" cy="125" r="36" fill="' + (isPure ? '#e8e2d8' : '#736658') + '" stroke="#1a1613" stroke-width="2"/>' +
        '<circle cx="300" cy="125" r="32" fill="none" stroke="#2b231d" stroke-width="1" stroke-dasharray="2 3"/>' +
        '<line x1="300" y1="125" x2="300" y2="94" stroke="#c9382b" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="300" cy="125" r="4" fill="#222"/>' +
        '<text x="300" y="148" text-anchor="middle" font-family="sans-serif" font-size="7" font-weight="bold" fill="#222">BRAUN</text>' +
        // Pure status badge
        (isPure ? '<text x="300" y="318" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">LESS, BUT BETTER</text>' : '') +
        '</g>'
      );
    }
    if (levelIdx === 1) {
      // Anglepoise Lamp
      return (
        '<g id="product-art">' +
        // Heavy base
        '<rect class="product-chassis' + (isPure ? ' pure' : '') + '" x="220" y="300" width="160" height="30" rx="6"/>' +
        '<circle cx="300" cy="300" r="10" fill="#1b1714"/>' +
        // Articulated cantilever arm
        '<line x1="300" y1="300" x2="250" y2="180" stroke="' + (isPure ? '#d4af37' : '#52453a') + '" stroke-width="5" stroke-linecap="round"/>' +
        '<line x1="250" y1="180" x2="340" y2="100" stroke="' + (isPure ? '#d4af37' : '#52453a') + '" stroke-width="5" stroke-linecap="round"/>' +
        // Pivot joints & tension springs
        '<circle cx="300" cy="300" r="6" fill="#c29238"/>' +
        '<circle cx="250" cy="180" r="7" fill="#c29238"/>' +
        '<circle cx="340" cy="100" r="6" fill="#c29238"/>' +
        // Tension spring line
        '<line x1="290" y1="285" x2="255" y2="195" stroke="#99836a" stroke-width="2" stroke-dasharray="2 3"/>' +
        // Spun aluminium lampshade
        '<path d="M 330,85 L 390,130 L 370,145 L 315,100 Z" fill="' + (isPure ? '#dcd6cb' : '#5c5044') + '" stroke="#26201b" stroke-width="2"/>' +
        (isPure ? '<text x="300" y="320" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">ANGLEPOISE ICON</text>' : '') +
        '</g>'
      );
    }
    if (levelIdx === 2) {
      // Braun ET66 Calculator
      return (
        '<g id="product-art">' +
        '<rect class="product-chassis' + (isPure ? ' pure' : '') + '" x="210" y="55" width="180" height="290" rx="14"/>' +
        // LCD window
        '<rect x="230" y="75" width="140" height="42" rx="4" fill="#8f9985" stroke="#1c1815" stroke-width="2"/>' +
        '<text x="360" y="104" text-anchor="end" font-family="monospace" font-size="20" font-weight="bold" fill="#1b2416">0.</text>' +
        // Round key grid (4 rows of 4 circular convex buttons)
        '<g fill="' + (isPure ? '#3a332d' : '#221e1a') + '">' +
        '<circle cx="245" cy="145" r="11"/><circle cx="282" cy="145" r="11"/><circle cx="318" cy="145" r="11"/>' +
        '<circle cx="245" cy="180" r="11"/><circle cx="282" cy="180" r="11"/><circle cx="318" cy="180" r="11"/>' +
        '<circle cx="245" cy="215" r="11"/><circle cx="282" cy="215" r="11"/><circle cx="318" cy="215" r="11"/>' +
        '<circle cx="245" cy="250" r="11"/><circle cx="282" cy="250" r="11"/><circle cx="318" cy="250" r="11"/>' +
        '</g>' +
        // Operational keys (Yellow/Brown/Orange)
        '<circle cx="355" cy="145" r="11" fill="#a85828"/>' +
        '<circle cx="355" cy="180" r="11" fill="#a85828"/>' +
        '<circle cx="355" cy="215" r="11" fill="#a85828"/>' +
        '<circle cx="355" cy="250" r="11" fill="#c96024"/>' +
        '<circle cx="245" cy="285" r="11" fill="#246e42"/>' +
        (isPure ? '<text x="300" y="325" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">ET66 ARCHETYPE</text>' : '') +
        '</g>'
      );
    }
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
        extracted: false
      };
    });
  }

  function renderArena() {
    if (!modal) return;
    var level = LEVELS[currentLevelIdx];
    var arena = modal.querySelector('[data-des-arena]');
    var bannerWrap = modal.querySelector('[data-des-banner-wrap]');
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

    var svgContent = '';
    // Background glow / drop zones
    svgContent += '<rect width="600" height="400" fill="#151210" rx="8"/>';

    // Extraction Channels for unextracted pieces
    piecesRemaining.forEach(function (p) {
      if (p.extracted) return;
      var d = pathToD(p.path);
      var isPieceActive = activePiece && activePiece.id === p.id;
      var channelCls = 'wire-channel' + (isPieceActive && isBuzzing ? ' buzz' : '');
      svgContent += '<path class="' + channelCls + '" d="' + d + '"/>';
      svgContent += '<path class="wire-core" d="' + d + '"/>';
      // Scrap Drop Target at exit
      svgContent += '<circle class="wire-target" cx="' + p.exitX + '" cy="' + p.exitY + '" r="22"/>';
      svgContent += '<text x="' + p.exitX + '" y="' + (p.exitY + 4) + '" text-anchor="middle" font-family="sans-serif" font-size="8" font-weight="bold" fill="#34c759">RECYCLE</text>';
    });

    // Central Product Chassis
    svgContent += getProductArtwork(currentLevelIdx, isPure);

    // Draggable / Grab-able Pieces
    piecesRemaining.forEach(function (p) {
      if (p.extracted) return;
      var isPieceActive = activePiece && activePiece.id === p.id;
      svgContent +=
        '<g class="wire-piece' + (isPieceActive ? ' grabbed' : '') + '" data-piece-id="' + p.id + '" transform="translate(' + p.x + ',' + p.y + ')" role="button" tabindex="0" aria-label="Grab ' + p.name + '. Use mouse, touch, or arrow keys to extract along the channel.">' +
        // Precision Extraction Ring
        '<circle class="piece-handle" cx="0" cy="0" r="18"/>' +
        '<circle cx="0" cy="0" r="12" fill="' + (isPieceActive ? '#ff3b30' : '#1b1612') + '" stroke="#fff" stroke-width="1.5"/>' +
        '<text class="piece-label" x="0" y="3">&#9986;</text>' +
        '</g>';
    });

    arena.innerHTML = svgContent;

    // Attach Pointer and Keyboard handlers to pieces
    var pieceEls = arena.querySelectorAll('.wire-piece');
    pieceEls.forEach(function (el) {
      var pid = el.getAttribute('data-piece-id');
      var pObj = piecesRemaining.find(function (p) { return p.id === pid; });
      if (!pObj) return;

      el.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        grabPiece(pObj, e);
      });

      el.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          if (activePiece && activePiece.id === pObj.id) dropPiece();
          else grabPiece(pObj, null);
        } else if (activePiece && activePiece.id === pObj.id) {
          handleKeyNudge(e);
        }
      });
    });

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

  function grabPiece(pObj, pointerEvt) {
    activePiece = pObj;
    playClick();
    renderArena();

    var announce = modal.querySelector('[data-des-announce]');
    if (announce) {
      announce.textContent = 'Grabbed ' + pObj.name + '. Guide it along the extraction wire without buzzing the borders.';
    }

    if (pointerEvt) {
      var arena = modal.querySelector('[data-des-arena]');
      var rect = arena.getBoundingClientRect();
      var svgW = 600, svgH = 400;

      function onPointerMove(e) {
        if (!activePiece) return;
        var r = arena.getBoundingClientRect();
        var scaleX = svgW / r.width;
        var scaleY = svgH / r.height;
        var svgX = (e.clientX - r.left) * scaleX;
        var svgY = (e.clientY - r.top) * scaleY;
        updatePiecePos(svgX, svgY);
      }

      function onPointerUp() {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        dropPiece();
      }

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    }
  }

  function handleKeyNudge(e) {
    if (!activePiece) return;
    var step = 8;
    var nx = activePiece.x;
    var ny = activePiece.y;

    if (e.key === 'ArrowUp') ny -= step;
    else if (e.key === 'ArrowDown') ny += step;
    else if (e.key === 'ArrowLeft') nx -= step;
    else if (e.key === 'ArrowRight') nx += step;
    else return;

    e.preventDefault();
    updatePiecePos(nx, ny);
  }

  function updatePiecePos(nx, ny) {
    if (!activePiece) return;
    activePiece.x = Math.max(10, Math.min(590, nx));
    activePiece.y = Math.max(10, Math.min(390, ny));

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
        // Reset piece back to starting socket
        stopBuzzerSound();
        isBuzzing = false;
        activePiece.x = activePiece.startX;
        activePiece.y = activePiece.startY;
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

  function dropPiece() {
    stopBuzzerSound();
    isBuzzing = false;
    activePiece = null;
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
      '<div class="des-quote-bar" data-des-quote-bar>Extract the decorative clutter without buzzing the functional core.</div>' +
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
