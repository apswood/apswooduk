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
    '.steam-machine{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:820px;margin:0 auto;overflow-x:auto;padding:8px 2px}' +
    '.steam-boiler,.steam-pump{flex:0 0 auto;width:120px;display:flex;flex-direction:column;align-items:center;text-align:center}' +
    '.steam-boiler svg,.steam-pump svg{width:100%;height:auto;display:block}' +
    '.steam-grid-wrap{flex:0 0 auto;background:#181614;padding:8px;border-radius:10px;box-shadow:inset 0 0 12px rgba(0,0,0,0.8),0 2px 6px rgba(0,0,0,0.2);border:2px solid #3d352e}' +
    '.steam-grid{display:grid;gap:5px;justify-content:center}' +
    '.pipe-tile{width:68px;height:68px;min-width:44px;min-height:44px;padding:0;border:0;background:#24201c;border-radius:6px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center;outline:none;box-shadow:inset 0 0 0 1px #3a3229,0 2px 4px rgba(0,0,0,0.4);transition:transform .18s cubic-bezier(.2,.8,.3,1),filter .15s}' +
    '.pipe-tile:hover{filter:brightness(1.15)}' +
    '.pipe-tile:focus-visible{outline:3px solid var(--focus,#9a3b00);outline-offset:2px;z-index:2}' +
    '.pipe-tile svg{width:100%;height:100%;display:block;pointer-events:none}' +
    '@media(max-width:680px){.pipe-tile{width:54px;height:54px}.steam-boiler,.steam-pump{width:86px}.steam-modal{padding:14px}}' +
    '@media(max-width:480px){.pipe-tile{width:46px;height:46px}.steam-boiler,.steam-pump{width:70px}}' +
    '.steam-flow-core{transition:stroke .2s,fill .2s}' +
    '.pipe-tile.steamed .steam-flow-core{stroke:#ffba42;filter:drop-shadow(0 0 3px #ffa200)}' +
    '.pipe-tile.steamed .steam-flow-inner{stroke:#fff6d6}' +
    '.steam-banner{background:var(--surface,#ece4d3);border:2px solid var(--accent,#1f5f7a);border-radius:8px;padding:12px 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;width:100%;box-sizing:border-box}' +
    '.steam-banner h3{margin:0;font-size:1.1rem;color:var(--ink)}' +
    '.steam-banner p{margin:2px 0 0;font-size:.9rem;color:var(--muted)}' +
    '.steam-banner-actions{display:flex;gap:8px}' +
    '.steam-victory-card{text-align:center;padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;background:var(--surface,#ece4d3);border-radius:10px;border:2px solid var(--accent)}' +
    '.steam-victory-card h3{font-size:1.4rem;margin:0}' +
    '.steam-victory-card p{max-width:54ch;margin:0 auto;color:var(--ink)}' +
    '.steam-victory-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}' +
    '.steam-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}' +
    '.steam-wheel{transform-origin:50px 50px}' +
    '.steam-running .steam-wheel{animation:steam-wheel-turn 2.4s linear infinite}' +
    '.steam-running .steam-piston{animation:steam-piston-bob 1.2s ease-in-out infinite alternate}' +
    '@keyframes steam-wheel-turn{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' +
    '@keyframes steam-piston-bob{from{transform:translateY(0)}to{transform:translateY(8px)}}' +
    '@media(prefers-reduced-motion:reduce){.pipe-tile{transition:none}.steam-running .steam-wheel,.steam-running .steam-piston{animation:none}}';

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

  function createTileSvg(type) {
    var outerCast = '#383028';
    var brassFlange = '#c29238';
    var emptyCore = '#1c1815';

    if (type === 'straight') {
      return (
        '<svg viewBox="0 0 100 100" aria-hidden="true">' +
        '<line x1="50" y1="0" x2="50" y2="100" stroke="' + outerCast + '" stroke-width="28" stroke-linecap="square"/>' +
        '<line class="steam-flow-core" x1="50" y1="0" x2="50" y2="100" stroke="' + emptyCore + '" stroke-width="16"/>' +
        '<line class="steam-flow-inner" x1="50" y1="0" x2="50" y2="100" stroke="transparent" stroke-width="5"/>' +
        '<rect x="31" y="0" width="38" height="6" fill="' + brassFlange + '" rx="2"/>' +
        '<rect x="31" y="94" width="38" height="6" fill="' + brassFlange + '" rx="2"/>' +
        '<circle cx="36" cy="3" r="1.5" fill="#1b1612"/>' +
        '<circle cx="64" cy="3" r="1.5" fill="#1b1612"/>' +
        '<circle cx="36" cy="97" r="1.5" fill="#1b1612"/>' +
        '<circle cx="64" cy="97" r="1.5" fill="#1b1612"/>' +
        '<rect x="32" y="47" width="36" height="6" fill="' + brassFlange + '" rx="1" opacity="0.8"/>' +
        '</svg>'
      );
    }
    if (type === 'elbow') {
      return (
        '<svg viewBox="0 0 100 100" aria-hidden="true">' +
        '<path d="M 50,0 Q 50,50 100,50" fill="none" stroke="' + outerCast + '" stroke-width="28" stroke-linecap="square"/>' +
        '<path class="steam-flow-core" d="M 50,0 Q 50,50 100,50" fill="none" stroke="' + emptyCore + '" stroke-width="16"/>' +
        '<path class="steam-flow-inner" d="M 50,0 Q 50,50 100,50" fill="none" stroke="transparent" stroke-width="5"/>' +
        '<rect x="31" y="0" width="38" height="6" fill="' + brassFlange + '" rx="2"/>' +
        '<rect x="94" y="31" width="6" height="38" fill="' + brassFlange + '" rx="2"/>' +
        '<circle cx="36" cy="3" r="1.5" fill="#1b1612"/>' +
        '<circle cx="64" cy="3" r="1.5" fill="#1b1612"/>' +
        '<circle cx="97" cy="36" r="1.5" fill="#1b1612"/>' +
        '<circle cx="97" cy="64" r="1.5" fill="#1b1612"/>' +
        '<circle cx="50" cy="50" r="12" fill="' + brassFlange + '" opacity="0.9"/>' +
        '<circle cx="50" cy="50" r="5" fill="#1b1612"/>' +
        '</svg>'
      );
    }
    if (type === 'tee') {
      return (
        '<svg viewBox="0 0 100 100" aria-hidden="true">' +
        '<line x1="50" y1="0" x2="50" y2="100" stroke="' + outerCast + '" stroke-width="28" stroke-linecap="square"/>' +
        '<line x1="50" y1="50" x2="100" y2="50" stroke="' + outerCast + '" stroke-width="28" stroke-linecap="square"/>' +
        '<line class="steam-flow-core" x1="50" y1="0" x2="50" y2="100" stroke="' + emptyCore + '" stroke-width="16"/>' +
        '<line class="steam-flow-core" x1="50" y1="50" x2="100" y2="50" stroke="' + emptyCore + '" stroke-width="16"/>' +
        '<line class="steam-flow-inner" x1="50" y1="0" x2="50" y2="100" stroke="transparent" stroke-width="5"/>' +
        '<line class="steam-flow-inner" x1="50" y1="50" x2="100" y2="50" stroke="transparent" stroke-width="5"/>' +
        '<rect x="31" y="0" width="38" height="6" fill="' + brassFlange + '" rx="2"/>' +
        '<rect x="31" y="94" width="38" height="6" fill="' + brassFlange + '" rx="2"/>' +
        '<rect x="94" y="31" width="6" height="38" fill="' + brassFlange + '" rx="2"/>' +
        '<circle cx="36" cy="3" r="1.5" fill="#1b1612"/>' +
        '<circle cx="64" cy="3" r="1.5" fill="#1b1612"/>' +
        '<circle cx="36" cy="97" r="1.5" fill="#1b1612"/>' +
        '<circle cx="64" cy="97" r="1.5" fill="#1b1612"/>' +
        '<circle cx="97" cy="36" r="1.5" fill="#1b1612"/>' +
        '<circle cx="97" cy="64" r="1.5" fill="#1b1612"/>' +
        '<circle cx="50" cy="50" r="14" fill="' + brassFlange + '"/>' +
        '<circle cx="50" cy="50" r="6" fill="#1b1612"/>' +
        '</svg>'
      );
    }
    return '';
  }

  function getBoilerSvg(psi, steamed) {
    var dialAngle = steamed ? (psi / 120) * 220 - 110 : -110;
    return (
      '<svg viewBox="0 0 120 180" aria-label="Victorian Steam Boiler">' +
      // Chimney & vent
      '<rect x="48" y="10" width="24" height="24" fill="#2d2824" stroke="#4a4038" stroke-width="2"/>' +
      '<polygon points="44,10 76,10 70,2 50,2" fill="#3a322c"/>' +
      // Main boiler tank
      '<rect x="15" y="30" width="90" height="110" rx="20" fill="#3a332d" stroke="#5a4f45" stroke-width="3"/>' +
      // Rivets
      '<g fill="#c29238">' +
      '<circle cx="25" cy="40" r="2.5"/><circle cx="95" cy="40" r="2.5"/>' +
      '<circle cx="25" cy="130" r="2.5"/><circle cx="95" cy="130" r="2.5"/>' +
      '<circle cx="60" cy="36" r="2.5"/>' +
      '</g>' +
      // Boiler brass nameplate
      '<rect x="28" y="52" width="64" height="18" rx="3" fill="#c29238" stroke="#7a5818" stroke-width="1.5"/>' +
      '<text x="60" y="64" text-anchor="middle" font-family="sans-serif" font-size="7.5" font-weight="bold" fill="#261b07">KEW STEAM</text>' +
      // Pressure gauge dial
      '<circle cx="60" cy="94" r="20" fill="#fffef7" stroke="#c29238" stroke-width="3.5"/>' +
      '<circle cx="60" cy="94" r="17" fill="none" stroke="#222" stroke-width="1" stroke-dasharray="2 3"/>' +
      '<line x1="60" y1="94" x2="60" y2="80" stroke="#b01f14" stroke-width="2" stroke-linecap="round" transform="rotate(' + dialAngle + ' 60 94)"/>' +
      '<circle cx="60" cy="94" r="3" fill="#222"/>' +
      // Firebox door
      '<rect x="36" y="122" width="48" height="18" rx="4" fill="#1b1714" stroke="#54483e" stroke-width="2"/>' +
      '<circle cx="48" cy="131" r="3" fill="#ff6a00"/>' +
      '<circle cx="60" cy="131" r="3.5" fill="#ff9900"/>' +
      '<circle cx="72" cy="131" r="3" fill="#ff6a00"/>' +
      // Outlet pipe on the right leading into grid
      '<rect x="104" y="37" width="16" height="18" fill="#4d4239" stroke="#6b5c4f" stroke-width="2"/>' +
      '<rect x="114" y="34" width="6" height="24" fill="#c29238" rx="1"/>' +
      '</svg>'
    );
  }

  function getPumpWheelSvg(psi, isRunning) {
    var dialAngle = isRunning ? (psi / 120) * 220 - 110 : -110;
    return (
      '<svg viewBox="0 0 120 180" aria-label="Cornish Pump Engine and Flywheel">' +
      // Beam pivot column
      '<rect x="18" y="130" width="84" height="42" fill="#26221f" stroke="#4a4038" stroke-width="2"/>' +
      '<rect x="35" y="80" width="14" height="55" fill="#38322c" stroke="#594d42" stroke-width="2"/>' +
      // Pump cylinder & piston rod
      '<g class="steam-piston">' +
      '<rect x="38" y="58" width="8" height="34" fill="#a89a8c" stroke="#594f45" stroke-width="1.5"/>' +
      '<rect x="32" y="90" width="20" height="8" rx="2" fill="#c29238"/>' +
      '</g>' +
      // Grand Flywheel (rotates when running)
      '<g class="steam-wheel" transform-origin="78 78">' +
      '<circle cx="78" cy="78" r="36" fill="none" stroke="#3d352e" stroke-width="9"/>' +
      '<circle cx="78" cy="78" r="36" fill="none" stroke="#c29238" stroke-width="2"/>' +
      '<circle cx="78" cy="78" r="10" fill="#c29238" stroke="#5a4212" stroke-width="2"/>' +
      // 6 Spokes
      '<line x1="78" y1="42" x2="78" y2="114" stroke="#706254" stroke-width="3"/>' +
      '<line x1="47" y1="60" x2="109" y2="96" stroke="#706254" stroke-width="3"/>' +
      '<line x1="47" y1="96" x2="109" y2="60" stroke="#706254" stroke-width="3"/>' +
      // Counterweight
      '<path d="M 94,52 A 36 36 0 0 1 114,78 L 100,78 A 22 22 0 0 0 88,60 Z" fill="#b08428"/>' +
      '<circle cx="78" cy="78" r="4" fill="#1b1714"/>' +
      '</g>' +
      // Inlet pipe connection on left
      '<rect x="0" y="145" width="18" height="18" fill="#4d4239" stroke="#6b5c4f" stroke-width="2"/>' +
      '<rect x="0" y="142" width="6" height="24" fill="#c29238" rx="1"/>' +
      // Gauge
      '<circle cx="35" cy="30" r="16" fill="#fffef7" stroke="#c29238" stroke-width="3"/>' +
      '<line x1="35" y1="30" x2="35" y2="18" stroke="#b01f14" stroke-width="2" stroke-linecap="round" transform="rotate(' + dialAngle + ' 35 30)"/>' +
      '<circle cx="35" cy="30" r="2.5" fill="#222"/>' +
      '<text x="35" y="42" text-anchor="middle" font-family="sans-serif" font-size="5.5" font-weight="bold" fill="#333">PUMP PSI</text>' +
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

    // Reset steam on all cells
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        gridState[r][c].steamed = false;
      }
    }

    // Check inlet connection
    var inCell = gridState[level.inlet.r][level.inlet.c];
    var inMask = rotMask(inCell.base, inCell.rot);
    if (!(inMask & level.inlet.from)) {
      return { pumpConnected: false, allConnected: false, connectedCount: 0 };
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

    var totalTiles = rows * cols;
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

    if (boilerWrap) boilerWrap.innerHTML = getBoilerSvg(level.psi, evalRes.connectedCount > 0);
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
        btn.innerHTML = createTileSvg(cell.type);

        (function (rowIdx, colIdx, btnEl) {
          btnEl.addEventListener('click', function () {
            rotateTile(rowIdx, colIdx);
          });
        })(r, c, btn);

        gridEl.appendChild(btn);
      }
    }

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
