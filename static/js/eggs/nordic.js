/* Scandinavian and Nordic Design: Nordic Lines Ski Game.
   Downhill slalom ski game inspired by classic retro ski games,
   featuring Nordic pine forests, design cameos, and a friendly Yeti chase.
   Pure vanilla JS, HTML5 Canvas 60fps rendering, Web Audio synthesis, no dependencies.
*/
(function () {
  'use strict';

  var root = document.documentElement;
  var AW = window.AW;
  var opener = null;
  var modal = null;
  var animFrameId = null;

  var soundOn = false;
  var audioCtx = null;
  var masterGain = null;
  var noiseBuf = null;

  var canvas = null;
  var ctx = null;

  var currentLevelIdx = 0;
  var gameState = 'ready'; // ready, playing, won, finished
  var skier = {
    x: 320,
    y: 120, // screen position
    dist: 0, // total distance traveled down slope
    vx: 0,
    speed: 4.2,
    angle: 0,
    isJumping: false,
    jumpZ: 0,
    jumpVz: 0,
    tumbleTimer: 0
  };

  var input = { left: false, right: false, jump: false, touchX: null };
  var tracks = []; // ski trail points
  var sprays = []; // snow kicked up by carving and falls
  var gates = [];
  var obstacles = [];
  var ramps = [];
  var cabin = null;
  var yeti = { active: false, x: 320, dist: -200, frame: 0, waving: false };
  var courseLength = 3200;
  var gatesPassed = 0;
  var totalGates = 0;

  var LEVELS = [
    {
      id: 1,
      name: 'Holmenkollen Slalom',
      country: 'Oslo, Norway',
      speed: 4.0,
      length: 2800,
      gateCount: 8,
      density: 1.0,
      hasJumps: false,
      hasYeti: false
    },
    {
      id: 2,
      name: 'Lapland Cross-Country & Jumps',
      country: 'Rovaniemi, Finland',
      speed: 4.6,
      length: 3200,
      gateCount: 10,
      density: 1.3,
      hasJumps: true,
      hasYeti: false
    },
    {
      id: 3,
      name: 'Are Alpine & The Yeti Chase',
      country: 'Are, Sweden',
      speed: 5.2,
      length: 3600,
      gateCount: 12,
      density: 1.4,
      hasJumps: true,
      hasYeti: true
    }
  ];

  var css =
    '.nordic-backdrop{position:fixed;inset:0;background:rgba(10,14,18,0.8);backdrop-filter:blur(3px);z-index:900;display:flex;align-items:center;justify-content:center;padding:12px;overflow-y:auto}' +
    '.nordic-backdrop[hidden]{display:none}' +
    '.nordic-modal{background:var(--bg,#f6f1e7);color:var(--ink,#26292b);border:2px solid var(--accent,#1f5f7a);border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,0.5);width:100%;max-width:760px;padding:18px;margin:auto;position:relative;display:flex;flex-direction:column;gap:12px;box-sizing:border-box}' +
    '.nordic-head{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;border-bottom:1px solid var(--muted);padding-bottom:10px}' +
    '.nordic-titles{flex:1;min-width:220px}' +
    '.nordic-kicker{font-size:.78rem;font-family:var(--head);text-transform:uppercase;letter-spacing:.08em;color:var(--accent,#1f5f7a);margin:0 0 2px;font-weight:600}' +
    '.nordic-title{font-size:1.35rem;margin:0;line-height:1.2;font-family:var(--head)}' +
    '.nordic-sub{font-size:.88rem;color:var(--muted);margin:2px 0 0}' +
    '.nordic-actions{display:flex;align-items:center;gap:8px}' +
    '.nordic-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;background:var(--surface,#ece4d3);padding:8px 14px;border-radius:8px;font-size:.9rem}' +
    '.nordic-stats{display:flex;align-items:center;gap:16px}' +
    '.nordic-stat{font-weight:600}' +
    '.nordic-stat span{font-weight:normal;color:var(--muted)}' +
    '.nordic-canvas-wrap{position:relative;background:#f3f6f9;border:2px solid #3c444c;border-radius:10px;overflow:hidden;box-shadow:inset 0 0 16px rgba(0,0,0,0.15);touch-action:none;user-select:none;-webkit-user-select:none}' +
    '.nordic-canvas{display:block;width:100%;height:auto;max-height:460px;background:#f5f7fa;cursor:crosshair}' +
    '.nordic-touch-ctls{position:absolute;inset:0;display:flex;pointer-events:none}' +
    '.nordic-touch-side{flex:1;pointer-events:auto;opacity:0}' +
    '.nordic-jump-btn{position:absolute;right:14px;bottom:14px;width:56px;height:56px;border-radius:50%;background:var(--accent,#1f5f7a);color:#fff;border:2px solid #fff;font:bold .85rem var(--head);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);pointer-events:auto;cursor:pointer}' +
    '.nordic-jump-btn:active{transform:scale(.94)}' +
    '.nordic-banner{background:var(--surface,#ece4d3);border:2px solid var(--accent,#1f5f7a);border-radius:8px;padding:12px 16px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;width:100%;box-sizing:border-box}' +
    '.nordic-banner h3{margin:0;font-size:1.1rem;color:var(--ink)}' +
    '.nordic-banner p{margin:2px 0 0;font-size:.9rem;color:var(--muted)}' +
    '.nordic-banner-actions{display:flex;gap:8px}' +
    '.nordic-victory-card{text-align:center;padding:24px 16px;display:flex;flex-direction:column;align-items:center;gap:14px;background:var(--surface,#ece4d3);border-radius:10px;border:2px solid var(--accent)}' +
    '.nordic-victory-card h3{font-size:1.4rem;margin:0}' +
    '.nordic-victory-card p{max-width:54ch;margin:0 auto;color:var(--ink)}' +
    '.nordic-victory-btns{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:8px}' +
    '.nordic-hint{font-size:.82rem;color:var(--muted);text-align:center;margin:0}' +
    '.nordic-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);border:0}';

  function ensureAudio() {
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0.12;
      masterGain.connect(audioCtx.destination);

      var len = audioCtx.sampleRate * 1.0;
      var b = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
      var d = b.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      noiseBuf = b;
      return true;
    } catch (e) {
      return false;
    }
  }

  function playSwoosh() {
    if (!soundOn || !ensureAudio() || !noiseBuf) return;
    var t = audioCtx.currentTime;
    var src = audioCtx.createBufferSource();
    src.buffer = noiseBuf;
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(650, t);
    filter.Q.value = 2.0;
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.18, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start(t);
    src.stop(t + 0.2);
  }

  function playGateBell() {
    if (!soundOn || !ensureAudio()) return;
    var t = audioCtx.currentTime;
    [783.99, 1046.5].forEach(function (f, idx) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.25, t + idx * 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.4);
      o.connect(g);
      g.connect(masterGain);
      o.start(t + idx * 0.03);
      o.stop(t + idx * 0.03 + 0.45);
    });
  }

  function playJumpSound() {
    if (!soundOn || !ensureAudio() || !noiseBuf) return;
    var t = audioCtx.currentTime;
    var src = audioCtx.createBufferSource();
    src.buffer = noiseBuf;
    var filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.linearRampToValueAtTime(1200, t + 0.15);
    var g = audioCtx.createGain();
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    src.connect(filter);
    filter.connect(g);
    g.connect(masterGain);
    src.start(t);
    src.stop(t + 0.38);
  }

  function playFinishFanfare() {
    if (!soundOn || !ensureAudio()) return;
    var t = audioCtx.currentTime;
    var notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function (f, idx) {
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      var delay = t + idx * 0.09;
      g.gain.setValueAtTime(0, delay);
      g.gain.linearRampToValueAtTime(0.3, delay + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, delay + 0.7);
      o.connect(g);
      g.connect(masterGain);
      o.start(delay);
      o.stop(delay + 0.75);
    });
  }

  function buildCourse(level) {
    gates = [];
    obstacles = [];
    ramps = [];
    tracks = [];
    sprays = [];
    gatesPassed = 0;
    totalGates = level.gateCount;
    courseLength = level.length;

    var gateSpacing = (courseLength - 600) / (level.gateCount + 1);
    var curDist = 400;

    for (var i = 0; i < level.gateCount; i++) {
      curDist += gateSpacing;
      var gateWidth = 110;
      var centerX = 160 + Math.random() * 320;
      gates.push({
        dist: curDist,
        x1: centerX - gateWidth / 2,
        x2: centerX + gateWidth / 2,
        color: i % 2 ? 'blue' : 'red',
        passed: false,
        missed: false
      });
    }

    // Populate trees, rocks, and design cameos
    var count = Math.round((courseLength / 70) * level.density);
    var cameoTypes = ['pine', 'pine', 'birch', 'rock', 'aalto_stool', 'egg_chair'];

    for (var j = 0; j < count; j++) {
      var obsDist = 200 + Math.random() * (courseLength - 400);
      var obsX = 30 + Math.random() * 580;

      // Avoid putting obstacles directly inside gate spans
      var nearGate = gates.some(function (g) {
        return Math.abs(g.dist - obsDist) < 80 && obsX > g.x1 - 20 && obsX < g.x2 + 20;
      });
      if (nearGate) continue;

      var type = 'pine';
      var r = Math.random();
      if (r < 0.50) type = 'pine';
      else if (r < 0.72) type = 'birch';
      else if (r < 0.88) type = 'rock';
      else if (r < 0.95) type = 'aalto_stool';
      else type = 'egg_chair';

      obstacles.push({
        dist: obsDist,
        x: obsX,
        type: type,
        r: type === 'pine' ? 22 : type === 'birch' ? 14 : type === 'rock' ? 16 : 18
      });
    }

    // Jumps
    if (level.hasJumps) {
      for (var k = 0; k < 4; k++) {
        var rampDist = 700 + k * 650 + Math.random() * 150;
        ramps.push({
          dist: rampDist,
          x: 200 + Math.random() * 240,
          w: 64,
          h: 24,
          used: false
        });
      }
    }

    // Finish Cabin (Falu red Nordic timber lodge)
    cabin = {
      dist: courseLength + 120,
      x: 320,
      w: 160,
      h: 110
    };

    // Yeti setup
    yeti.active = level.hasYeti;
    yeti.dist = -300;
    yeti.x = 320;
    yeti.frame = 0;
    yeti.waving = false;

    skier.x = 320;
    skier.y = 120;
    skier.dist = 0;
    skier.vx = 0;
    skier.speed = level.speed;
    skier.angle = 0;
    skier.isJumping = false;
    skier.jumpZ = 0;
    skier.jumpVz = 0;
    skier.tumbleTimer = 0;

    gameState = 'playing';
  }

  function update() {
    if (gameState !== 'playing') return;

    // Movement & steering
    var turnRate = 0.55;
    var maxAngle = 0.85;

    if (input.touchX !== null) {
      var dx = input.touchX - skier.x;
      if (Math.abs(dx) > 12) {
        skier.vx = Math.sign(dx) * Math.min(Math.abs(dx) * 0.1, 4.5);
        skier.angle = Math.sign(dx) * Math.min(Math.abs(dx) * 0.02, maxAngle);
      } else {
        skier.vx *= 0.7;
        skier.angle *= 0.6;
      }
    } else {
      if (input.left) {
        skier.vx = Math.max(-4.2, skier.vx - turnRate);
        skier.angle = Math.max(-maxAngle, skier.angle - 0.12);
        playSwoosh();
      } else if (input.right) {
        skier.vx = Math.min(4.2, skier.vx + turnRate);
        skier.angle = Math.min(maxAngle, skier.angle + 0.12);
        playSwoosh();
      } else {
        skier.vx *= 0.82;
        skier.angle *= 0.75;
      }
    }

    // Tumble recovery
    if (skier.tumbleTimer > 0) {
      skier.tumbleTimer--;
      skier.speed = 1.8;
      skier.angle += 0.4;
    } else {
      skier.speed = LEVELS[currentLevelIdx].speed;
    }

    skier.x = Math.max(30, Math.min(610, skier.x + skier.vx));
    skier.dist += skier.speed;

    // Jump physics
    if (skier.isJumping) {
      skier.jumpZ += skier.jumpVz;
      skier.jumpVz -= 0.35;
      if (skier.jumpZ <= 0) {
        skier.jumpZ = 0;
        skier.isJumping = false;
        playSwoosh();
      }
    } else if (input.jump) {
      skier.isJumping = true;
      skier.jumpVz = 5.2;
      playJumpSound();
    }

    // Ski tracks behind skier
    if (!skier.isJumping) {
      tracks.push({
        x: skier.x,
        dist: skier.dist,
        angle: skier.angle
      });
      if (tracks.length > 250) tracks.shift();
    }

    if (!skier.isJumping && (Math.abs(skier.vx) > 1.6 || skier.tumbleTimer > 0)) {
      var dir = Math.sign(skier.vx) || 1;
      var n = skier.tumbleTimer > 0 ? 3 : 2;
      for (var s = 0; s < n; s++) {
        var life = 16 + Math.random() * 14;
        sprays.push({
          x: skier.x + dir * (4 + Math.random() * 6),
          dist: skier.dist + 8 + Math.random() * 10,
          vx: dir * (0.6 + Math.random() * 1.6) + (Math.random() - 0.5),
          vd: skier.speed * (0.55 + Math.random() * 0.3),
          r: 1 + Math.random() * 2,
          life: life,
          max: life
        });
      }
    }
    sprays = sprays.filter(function (p) {
      p.x += p.vx;
      p.dist += p.vd;
      p.vx *= 0.92;
      p.life--;
      return p.life > 0;
    });

    // Check Ramps
    ramps.forEach(function (rmp) {
      if (!rmp.used && Math.abs(skier.dist - rmp.dist) < 18 && Math.abs(skier.x - rmp.x) < rmp.w / 2) {
        rmp.used = true;
        skier.isJumping = true;
        skier.jumpVz = 6.8;
        playJumpSound();
      }
    });

    // Check Slalom Gates
    gates.forEach(function (g) {
      if (!g.passed && !g.missed && skier.dist >= g.dist - 10 && skier.dist <= g.dist + 20) {
        if (skier.x >= g.x1 && skier.x <= g.x2) {
          g.passed = true;
          gatesPassed++;
          playGateBell();
          updateStats();
        } else if (skier.dist > g.dist + 15) {
          g.missed = true;
        }
      }
    });

    // Check Obstacles collision (only when grounded)
    if (!skier.isJumping && skier.tumbleTimer === 0) {
      obstacles.forEach(function (obs) {
        var dy = Math.abs(skier.dist - obs.dist);
        var dx = Math.abs(skier.x - obs.x);
        if (dy < 14 && dx < obs.r) {
          skier.tumbleTimer = 22;
          playSwoosh();
        }
      });
    }

    // Yeti Chase Logic (Level 3)
    if (yeti.active) {
      if (skier.dist > 2300 && yeti.dist < -50) {
        yeti.dist = skier.dist - 350;
        yeti.x = skier.x;
        var ann = modal.querySelector('[data-nordic-announce]');
        if (ann) ann.textContent = 'A friendly Nordic Yeti joins the run! Ski to the finish cabin!';
      }
      if (yeti.dist > 0) {
        // Yeti runs toward skier at slight speed advantage
        var yetiTargetX = skier.x;
        yeti.x += (yetiTargetX - yeti.x) * 0.04;
        yeti.dist += skier.speed * 1.05;
        yeti.frame++;

        // Don't let Yeti overtake until finish
        if (yeti.dist > skier.dist - 65 && skier.dist < courseLength) {
          yeti.dist = skier.dist - 65;
        }
      }
    }

    // Check Finish Line
    if (skier.dist >= courseLength) {
      gameState = 'won';
      skier.speed = 0;
      skier.vx = 0;
      skier.angle = 1.4; // Stylish hockey stop!
      playFinishFanfare();

      if (yeti.active) {
        yeti.dist = courseLength + 40;
        yeti.x = 210;
        yeti.waving = true;
      }

      if (currentLevelIdx === LEVELS.length - 1) {
        AW.found('nordic');
        renderVictory();
      } else {
        renderLevelWinBanner();
      }
    }
  }

  function updateStats() {
    if (!modal) return;
    var statGates = modal.querySelector('[data-nordic-stat-gates]');
    var statDist = modal.querySelector('[data-nordic-stat-dist]');
    if (statGates) statGates.textContent = gatesPassed + ' / ' + totalGates;
    if (statDist) {
      var pct = Math.min(100, Math.round((skier.dist / courseLength) * 100));
      statDist.textContent = pct + '%';
    }
  }

  function render() {
    if (!ctx) return;
    ctx.clearRect(0, 0, 640, 440);

    // Snow base with soft gradient
    var snowGrad = ctx.createLinearGradient(0, 0, 0, 440);
    snowGrad.addColorStop(0, '#f9fbfd');
    snowGrad.addColorStop(1, '#e6eef6');
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, 0, 640, 440);

    var camY = skier.dist - skier.y;

    drawSnowTexture(ctx, camY);

    // Draw Ski Tracks in snow
    drawTracks(ctx, camY);

    // Draw Ramps
    ramps.forEach(function (rmp) {
      var sy = rmp.dist - camY;
      if (sy >= -50 && sy <= 490) {
        drawRamp(ctx, rmp.x, sy, rmp.w, rmp.h);
      }
    });

    // Draw Slalom Gates
    gates.forEach(function (g) {
      var sy = g.dist - camY;
      if (sy >= -60 && sy <= 500) {
        drawGate(ctx, g, sy);
      }
    });

    // Draw Obstacles & Cameos
    obstacles.forEach(function (obs) {
      var sy = obs.dist - camY;
      if (sy >= -60 && sy <= 500) {
        if (obs.type === 'pine') drawPine(ctx, obs.x, sy);
        else if (obs.type === 'birch') drawBirch(ctx, obs.x, sy);
        else if (obs.type === 'rock') drawRock(ctx, obs.x, sy);
        else if (obs.type === 'aalto_stool') drawAaltoStool(ctx, obs.x, sy);
        else if (obs.type === 'egg_chair') drawEggChair(ctx, obs.x, sy);
      }
    });

    // Draw Finish Line & Falu Red Sauna Cabin
    if (cabin) {
      var cy = cabin.dist - camY;
      if (cy >= -160 && cy <= 600) {
        drawFinishBanner(ctx, cabin.dist - 100 - camY);
        drawNordicCabin(ctx, cabin.x, cy);
      }
    }

    // Draw Yeti (if active and on screen)
    if (yeti.active && yeti.dist > 0) {
      var yscreenY = yeti.dist - camY;
      if (yscreenY >= -80 && yscreenY <= 520) {
        drawYeti(ctx, yeti.x, yscreenY, yeti.frame, yeti.waving);
      }
    }

    drawSpray(ctx, camY);

    // Draw Skier
    drawSkier(ctx, skier.x, skier.y, skier.angle, skier.isJumping, skier.jumpZ);

    updateStats();
  }

  // Seeded 0..1 value so snow texture stays put as the slope scrolls
  function hash(n) {
    var s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return s - Math.floor(s);
  }

  function drawSnowTexture(c, camY) {
    // Wind ripples and soft hollows, fixed to the slope
    var band = 36;
    var k0 = Math.floor(camY / band) - 1;
    var k1 = Math.floor((camY + 440) / band) + 1;
    c.lineCap = 'round';
    for (var k = k0; k <= k1; k++) {
      for (var j = 0; j < 2; j++) {
        var seed = k * 7 + j * 3;
        var x = hash(seed) * 640;
        var y = k * band + hash(seed + 1) * band - camY;
        var len = 30 + hash(seed + 2) * 70;
        c.strokeStyle = 'rgba(160, 184, 208, 0.22)';
        c.lineWidth = 1.4;
        c.beginPath();
        c.moveTo(x - len / 2, y);
        c.quadraticCurveTo(x, y - 5, x + len / 2, y + 1);
        c.stroke();
        c.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(x - len / 2 + 2, y - 1.6);
        c.quadraticCurveTo(x, y - 6.6, x + len / 2 - 2, y - 0.6);
        c.stroke();
      }
    }

    // Piste edges fall away into shade
    var edgeL = c.createLinearGradient(0, 0, 60, 0);
    edgeL.addColorStop(0, 'rgba(120, 150, 180, 0.28)');
    edgeL.addColorStop(1, 'rgba(120, 150, 180, 0)');
    c.fillStyle = edgeL;
    c.fillRect(0, 0, 60, 440);
    var edgeR = c.createLinearGradient(640, 0, 580, 0);
    edgeR.addColorStop(0, 'rgba(120, 150, 180, 0.28)');
    edgeR.addColorStop(1, 'rgba(120, 150, 180, 0)');
    c.fillStyle = edgeR;
    c.fillRect(580, 0, 60, 440);
  }

  function drawTracks(c, camY) {
    // Two continuous carved grooves, broken wherever the skier was airborne
    [-4, 4].forEach(function (off) {
      [['rgba(150, 178, 204, 0.55)', 2.2, 0], ['rgba(255, 255, 255, 0.95)', 1, 1.1]].forEach(function (pass) {
        c.strokeStyle = pass[0];
        c.lineWidth = pass[1];
        c.lineJoin = 'round';
        c.beginPath();
        var prev = null;
        tracks.forEach(function (pt) {
          var sy = pt.dist - camY;
          var sx = pt.x + off * Math.cos(pt.angle) + pass[2];
          if (!prev || pt.dist - prev.dist > 12) c.moveTo(sx, sy);
          else c.lineTo(sx, sy);
          prev = pt;
        });
        c.stroke();
      });
    });
  }

  function drawSpray(c, camY) {
    sprays.forEach(function (p) {
      var a = Math.max(0, p.life / p.max);
      c.fillStyle = 'rgba(255, 255, 255, ' + (0.95 * a) + ')';
      c.strokeStyle = 'rgba(150, 178, 204, ' + (0.6 * a) + ')';
      c.lineWidth = 0.8;
      c.beginPath();
      c.arc(p.x, p.dist - camY, p.r, 0, Math.PI * 2);
      c.fill();
      c.stroke();
    });
  }

  function snowShadow(c, x, y, rx, ry) {
    c.fillStyle = 'rgba(120, 150, 185, 0.28)';
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Skier seen from behind and above, heading down the screen. Skis follow
  // the steering angle; the body counter-rotates a little, like a real carve.
  function drawSkier(c, x, y, angle, jumping, jz) {
    c.save();
    c.translate(x, y);
    snowShadow(c, 3, 14, 14 + jz * 0.15, 6);
    c.translate(0, -jz);
    var lift = 1 + jz * 0.012;
    c.scale(lift, lift);

    // Skis
    c.save();
    c.rotate(-angle * 0.85);
    [-5, 5].forEach(function (sx) {
      c.fillStyle = '#16384a';
      c.beginPath();
      c.moveTo(sx - 2, -14);
      c.lineTo(sx + 2, -14);
      c.lineTo(sx + 2, 20);
      c.quadraticCurveTo(sx + 2, 25, sx, 26);
      c.quadraticCurveTo(sx - 2, 25, sx - 2, 20);
      c.closePath();
      c.fill();
      c.fillStyle = '#e8ecef';
      c.fillRect(sx - 0.6, -12, 1.2, 30);
      c.fillStyle = '#ff6b4a';
      c.beginPath();
      c.moveTo(sx - 2, 19);
      c.lineTo(sx + 2, 19);
      c.quadraticCurveTo(sx + 2, 25, sx, 26);
      c.quadraticCurveTo(sx - 2, 25, sx - 2, 19);
      c.fill();
    });
    // Boots
    c.fillStyle = '#222b33';
    c.fillRect(-7.5, -2, 5, 7);
    c.fillRect(2.5, -2, 5, 7);
    c.restore();

    c.rotate(-angle * 0.35);

    // Poles, planted beside the skis
    c.strokeStyle = '#3b4249';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-13, -14);
    c.lineTo(-16, 8);
    c.moveTo(13, -14);
    c.lineTo(16, 8);
    c.stroke();
    c.strokeStyle = '#3b4249';
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(-16, 7, 3, 1.4, 0, 0, Math.PI * 2);
    c.ellipse(16, 7, 3, 1.4, 0, 0, Math.PI * 2);
    c.stroke();

    // Legs
    c.strokeStyle = '#1f2f4a';
    c.lineWidth = 4.5;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-3.5, -14);
    c.lineTo(-5, 0);
    c.moveTo(3.5, -14);
    c.lineTo(5, 0);
    c.stroke();

    // Arms
    c.strokeStyle = '#b81f1a';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(-7, -24);
    c.lineTo(-13, -14);
    c.moveTo(7, -24);
    c.lineTo(13, -14);
    c.stroke();
    c.fillStyle = '#1b1f24';
    c.beginPath();
    c.arc(-13, -14, 2.2, 0, Math.PI * 2);
    c.arc(13, -14, 2.2, 0, Math.PI * 2);
    c.fill();

    // Jacket with a Nordic knit yoke
    c.fillStyle = '#d4251f';
    c.beginPath();
    c.ellipse(0, -20, 8.5, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f4f1ea';
    c.fillRect(-8, -26, 16, 3.5);
    c.fillStyle = '#d4251f';
    for (var i = -6; i <= 6; i += 4) {
      c.beginPath();
      c.moveTo(i - 1.5, -26);
      c.lineTo(i, -23.8);
      c.lineTo(i + 1.5, -26);
      c.fill();
    }

    // Beanie with pom-pom
    c.fillStyle = '#2b3a4a';
    c.beginPath();
    c.arc(0, -31, 5.6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#f4f1ea';
    c.fillRect(-5.6, -30, 11.2, 2.4);
    c.fillStyle = '#d4251f';
    c.beginPath();
    c.arc(0, -37, 2.8, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  // Spruce tier with drooping, snow-laden branch tips
  function spruceTier(c, apexY, baseY, half, lobes) {
    var step = (half * 2) / lobes;
    c.beginPath();
    c.moveTo(0, apexY);
    c.lineTo(-half, baseY);
    for (var i = 0; i < lobes; i++) {
      var x0 = -half + i * step;
      c.quadraticCurveTo(x0 + step / 2, baseY - 5, x0 + step, baseY);
    }
    c.closePath();
  }

  function drawPine(c, x, y) {
    c.save();
    c.translate(x, y);
    snowShadow(c, 8, 20, 22, 7);

    c.fillStyle = '#4a3b32';
    c.fillRect(-2.5, 12, 5, 9);

    var tiers = [
      { a: 2, b: 16, w: 21, n: 4 },
      { a: -10, b: 5, w: 17, n: 4 },
      { a: -21, b: -6, w: 13, n: 3 },
      { a: -31, b: -17, w: 8, n: 2 }
    ];
    tiers.forEach(function (t) {
      spruceTier(c, t.a, t.b, t.w, t.n);
      c.fillStyle = '#183526';
      c.fill();
      // Lit side
      c.save();
      c.clip();
      c.fillStyle = '#25503a';
      c.fillRect(0, t.a - 2, t.w + 2, t.b - t.a + 4);
      c.restore();
      // Snow settled along the branch tips
      var step = (t.w * 2) / t.n;
      c.strokeStyle = '#f4f8fb';
      c.lineWidth = 2;
      c.lineCap = 'round';
      c.beginPath();
      for (var i = 0; i < t.n; i += 2) {
        var x0 = -t.w + i * step;
        c.moveTo(x0 + 1.5, t.b - 2.5);
        c.quadraticCurveTo(x0 + step / 2, t.b - 7, x0 + step - 1.5, t.b - 2.5);
      }
      c.stroke();
    });
    // Snow cap
    c.fillStyle = '#f4f8fb';
    c.beginPath();
    c.moveTo(0, -33);
    c.lineTo(-4, -25);
    c.quadraticCurveTo(0, -27, 4, -25);
    c.closePath();
    c.fill();

    c.restore();
  }

  function drawBirch(c, x, y) {
    c.save();
    c.translate(x, y);
    // Long low-sun shadow
    c.fillStyle = 'rgba(120, 150, 185, 0.22)';
    c.beginPath();
    c.moveTo(-2, 14);
    c.lineTo(26, 22);
    c.lineTo(28, 19);
    c.lineTo(2, 12);
    c.fill();

    // Bare winter branches
    c.strokeStyle = '#6b5a50';
    c.lineCap = 'round';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -18); c.lineTo(-11, -32); c.lineTo(-14, -40);
    c.moveTo(-8, -28); c.lineTo(-4, -36);
    c.moveTo(0, -24); c.lineTo(10, -38); c.lineTo(11, -46);
    c.moveTo(7, -34); c.lineTo(14, -38);
    c.moveTo(0, -36); c.lineTo(-5, -48);
    c.moveTo(0, -38); c.lineTo(4, -50);
    c.stroke();
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(-14, -40); c.lineTo(-17, -44);
    c.moveTo(-14, -40); c.lineTo(-12, -46);
    c.moveTo(11, -46); c.lineTo(15, -49);
    c.moveTo(11, -46); c.lineTo(9, -51);
    c.moveTo(-5, -48); c.lineTo(-8, -52);
    c.moveTo(4, -50); c.lineTo(7, -54);
    c.stroke();

    // Paper-white tapered trunk
    c.fillStyle = '#f2efe7';
    c.beginPath();
    c.moveTo(-3.2, 14);
    c.lineTo(-1.4, -40);
    c.lineTo(1.4, -40);
    c.lineTo(3.2, 14);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(150, 160, 175, 0.45)';
    c.beginPath();
    c.moveTo(-3.2, 14);
    c.lineTo(-1.4, -40);
    c.lineTo(-0.4, -40);
    c.lineTo(-1.6, 14);
    c.closePath();
    c.fill();
    // Dark lenticels
    c.fillStyle = '#1e1e1e';
    [[-3, 9, 3.4], [0, 3, 2.6], [-2.5, -4, 2.2], [0.2, -11, 2.6], [-2, -18, 2], [0, -25, 1.8], [-1, -31, 1.5]].forEach(function (m) {
      c.fillRect(m[0], m[1], m[2], 1.2);
    });
    // Snow at the foot
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(0, 14, 6, 2.4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawRock(c, x, y) {
    c.save();
    c.translate(x, y);
    snowShadow(c, 4, 7, 17, 6);

    c.fillStyle = '#56616c';
    c.beginPath();
    c.moveTo(-15, 4);
    c.lineTo(-11, -6);
    c.lineTo(-2, -10);
    c.lineTo(9, -8);
    c.lineTo(15, 0);
    c.lineTo(12, 7);
    c.lineTo(-8, 8);
    c.closePath();
    c.fill();
    // Lit facet
    c.fillStyle = '#7b8792';
    c.beginPath();
    c.moveTo(-2, -10);
    c.lineTo(9, -8);
    c.lineTo(15, 0);
    c.lineTo(3, 1);
    c.closePath();
    c.fill();
    // Shadow facet
    c.fillStyle = '#434c55';
    c.beginPath();
    c.moveTo(-15, 4);
    c.lineTo(-8, 8);
    c.lineTo(3, 1);
    c.lineTo(-6, -2);
    c.closePath();
    c.fill();
    // Drifted snow cap
    c.fillStyle = '#f7fafc';
    c.beginPath();
    c.moveTo(-12, -5);
    c.quadraticCurveTo(-6, -12, 2, -11);
    c.quadraticCurveTo(10, -10, 12, -4);
    c.quadraticCurveTo(6, -6, 2, -4);
    c.quadraticCurveTo(-4, -2, -12, -5);
    c.fill();
    c.restore();
  }

  function drawAaltoStool(c, x, y) {
    // Alvar Aalto Stool 60: three L-bent birch legs under a round seat
    c.save();
    c.translate(x, y);
    snowShadow(c, 3, 9, 15, 5);

    c.strokeStyle = '#c99a63';
    c.lineWidth = 3.2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-10, -2); c.quadraticCurveTo(-12, 0, -11, 9);
    c.moveTo(10, -2); c.quadraticCurveTo(12, 0, 11, 9);
    c.moveTo(0, 2); c.quadraticCurveTo(0, 4, 0, 11);
    c.stroke();

    var top = c.createLinearGradient(0, -10, 0, 2);
    top.addColorStop(0, '#f1d9b0');
    top.addColorStop(1, '#d9b37f');
    c.fillStyle = '#b8864f';
    c.beginPath();
    c.ellipse(0, -2, 13.5, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = top;
    c.beginPath();
    c.ellipse(0, -4, 13.5, 6.5, 0, 0, Math.PI * 2);
    c.fill();
    // A dusting of snow on the seat
    c.fillStyle = 'rgba(255, 255, 255, 0.9)';
    c.beginPath();
    c.ellipse(-3, -5.5, 6, 2.6, -0.2, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawEggChair(c, x, y) {
    // Arne Jacobsen Egg Chair: wrap-around shell on a swivel star base
    c.save();
    c.translate(x, y);
    snowShadow(c, 3, 16, 18, 6);

    c.strokeStyle = '#a7adb3';
    c.lineWidth = 2;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(0, 6); c.lineTo(0, 14);
    c.moveTo(-11, 16); c.lineTo(11, 12);
    c.moveTo(-9, 12); c.lineTo(9, 16);
    c.stroke();

    // Outer shell with its swept-back wings
    c.fillStyle = '#1f5f7a';
    c.beginPath();
    c.moveTo(0, -20);
    c.bezierCurveTo(12, -20, 17, -10, 16, -2);
    c.bezierCurveTo(15, 4, 11, 8, 6, 9);
    c.lineTo(-6, 9);
    c.bezierCurveTo(-11, 8, -15, 4, -16, -2);
    c.bezierCurveTo(-17, -10, -12, -20, 0, -20);
    c.fill();
    // Inner seat and back
    c.fillStyle = '#174a60';
    c.beginPath();
    c.moveTo(0, -14);
    c.bezierCurveTo(8, -14, 10, -6, 9, 0);
    c.lineTo(9, 6);
    c.lineTo(-9, 6);
    c.lineTo(-9, 0);
    c.bezierCurveTo(-10, -6, -8, -14, 0, -14);
    c.fill();
    c.fillStyle = '#2b7896';
    c.beginPath();
    c.ellipse(0, 4, 8, 3, 0, 0, Math.PI * 2);
    c.fill();
    // Snow on the crown
    c.fillStyle = '#f7fafc';
    c.beginPath();
    c.ellipse(0, -18.5, 8, 2.4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawRamp(c, x, y, w, h) {
    // Snow kicker: shaded take-off face, blue lip line, landing shadow
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(110, 145, 185, 0.35)';
    c.beginPath();
    c.ellipse(0, h / 2 + 6, w / 2 + 4, 7, 0, 0, Math.PI * 2);
    c.fill();

    var face = c.createLinearGradient(0, -h / 2, 0, h / 2);
    face.addColorStop(0, '#ffffff');
    face.addColorStop(1, '#cfdeec');
    c.fillStyle = face;
    c.beginPath();
    c.moveTo(-w / 2 + 6, -h / 2);
    c.lineTo(w / 2 - 6, -h / 2);
    c.lineTo(w / 2, h / 2);
    c.lineTo(-w / 2, h / 2);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(140, 170, 200, 0.6)';
    c.lineWidth = 1;
    c.stroke();
    c.strokeStyle = '#1f5f7a';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-w / 2, h / 2);
    c.lineTo(w / 2, h / 2);
    c.stroke();

    // Chevrons pointing downhill
    c.strokeStyle = '#ff6b4a';
    c.lineWidth = 2.5;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    [-5, 3].forEach(function (cy) {
      c.beginPath();
      c.moveTo(-9, cy - 4);
      c.lineTo(0, cy + 2);
      c.lineTo(9, cy - 4);
      c.stroke();
    });
    // Marker poles
    [-w / 2, w / 2].forEach(function (px) {
      c.fillStyle = '#ff6b4a';
      c.fillRect(px - 1.5, h / 2 - 18, 3, 18);
      c.fillStyle = '#fff';
      c.fillRect(px - 1.5, h / 2 - 12, 3, 4);
    });
    c.restore();
  }

  // Giant-slalom style gate: a pair of poles with a panel either side of the
  // opening. Gates alternate red and blue down the course.
  function drawGate(c, g, y) {
    var panel = g.color === 'blue' ? '#1f4fb8' : '#d4251f';
    [[g.x1 - 16, g.x1], [g.x2, g.x2 + 16]].forEach(function (pair) {
      // Pole shadows
      c.strokeStyle = 'rgba(120, 150, 185, 0.35)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(pair[0], y); c.lineTo(pair[0] + 12, y + 6);
      c.moveTo(pair[1], y); c.lineTo(pair[1] + 12, y + 6);
      c.stroke();
      // Panel
      c.fillStyle = panel;
      c.fillRect(pair[0], y - 26, pair[1] - pair[0], 15);
      c.fillStyle = 'rgba(255, 255, 255, 0.85)';
      c.fillRect(pair[0], y - 20, pair[1] - pair[0], 2.5);
      // Poles
      c.fillStyle = panel;
      c.fillRect(pair[0] - 1.5, y - 30, 3, 31);
      c.fillRect(pair[1] - 1.5, y - 30, 3, 31);
      c.fillStyle = '#ffffff';
      c.fillRect(pair[0] - 1.5, y - 8, 3, 3);
      c.fillRect(pair[1] - 1.5, y - 8, 3, 3);
    });
    if (g.passed) {
      c.strokeStyle = '#2e9e4f';
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      var cx = (g.x1 + g.x2) / 2;
      c.beginPath();
      c.moveTo(cx - 6, y - 16);
      c.lineTo(cx - 1, y - 11);
      c.lineTo(cx + 8, y - 21);
      c.stroke();
    }
  }

  function drawFinishBanner(c, y) {
    c.save();
    c.translate(320, y);
    // Post shadows
    c.fillStyle = 'rgba(120, 150, 185, 0.3)';
    c.beginPath();
    c.ellipse(-214, 2, 10, 3, 0, 0, Math.PI * 2);
    c.ellipse(220, 2, 10, 3, 0, 0, Math.PI * 2);
    c.fill();
    // Timber posts
    c.fillStyle = '#6b4a32';
    c.fillRect(-222, -46, 8, 48);
    c.fillRect(214, -46, 8, 48);
    // Banner with chequered trim
    c.fillStyle = '#d4251f';
    c.fillRect(-214, -44, 428, 24);
    for (var i = 0; i < 428 / 6; i++) {
      c.fillStyle = i % 2 ? '#ffffff' : '#1b1f24';
      c.fillRect(-214 + i * 6, -44, 6, 3);
      c.fillStyle = i % 2 ? '#1b1f24' : '#ffffff';
      c.fillRect(-214 + i * 6, -23, 6, 3);
    }
    c.fillStyle = '#fff';
    c.font = 'bold 12px sans-serif';
    c.textAlign = 'center';
    c.fillText('MÅL  ·  FINISH', 0, -28);
    c.restore();
  }

  function drawNordicCabin(c, x, y) {
    c.save();
    c.translate(x, y);

    snowShadow(c, 10, 48, 96, 22);

    // Falu red board-and-batten walls
    c.fillStyle = '#8b251e';
    c.fillRect(-75, -20, 150, 65);
    c.strokeStyle = 'rgba(60, 14, 10, 0.45)';
    c.lineWidth = 1;
    c.beginPath();
    for (var bx = -69; bx < 75; bx += 8) {
      c.moveTo(bx, -18);
      c.lineTo(bx, 45);
    }
    c.stroke();
    // White corner boards
    c.fillStyle = '#f4f1ea';
    c.fillRect(-77, -20, 5, 65);
    c.fillRect(72, -20, 5, 65);

    // Glowing windows in white frames with glazing bars
    [[-57, 2], [25, 2]].forEach(function (w) {
      c.fillStyle = '#f4f1ea';
      c.fillRect(w[0] - 3, w[1] - 3, 38, 32);
      c.fillStyle = '#ffd36b';
      c.fillRect(w[0], w[1], 32, 26);
      c.fillStyle = '#ffeaa8';
      c.fillRect(w[0], w[1], 32, 10);
      c.fillStyle = '#f4f1ea';
      c.fillRect(w[0] + 15, w[1], 2, 26);
      c.fillRect(w[0], w[1] + 12, 32, 2);
    });

    // Door with white frame
    c.fillStyle = '#f4f1ea';
    c.fillRect(-15, 7, 30, 38);
    c.fillStyle = '#2f4f5f';
    c.fillRect(-12, 10, 24, 35);
    c.fillStyle = '#d9b44a';
    c.beginPath();
    c.arc(7, 28, 1.6, 0, Math.PI * 2);
    c.fill();

    // Dark timber roof under a thick blanket of snow
    c.fillStyle = '#3a241e';
    c.beginPath();
    c.moveTo(0, -60);
    c.lineTo(-90, -20);
    c.lineTo(90, -20);
    c.closePath();
    c.fill();
    c.fillStyle = '#f7fafc';
    c.beginPath();
    c.moveTo(0, -66);
    c.lineTo(-96, -21);
    c.quadraticCurveTo(-90, -14, -84, -18);
    c.quadraticCurveTo(-60, -14, -50, -24);
    c.lineTo(0, -50);
    c.lineTo(50, -24);
    c.quadraticCurveTo(64, -14, 84, -18);
    c.quadraticCurveTo(90, -14, 96, -21);
    c.closePath();
    c.fill();
    c.strokeStyle = 'rgba(150, 178, 204, 0.6)';
    c.lineWidth = 1;
    c.stroke();

    // Chimney and drifting sauna steam
    c.fillStyle = '#5a5552';
    c.fillRect(40, -62, 16, 26);
    c.fillStyle = '#f7fafc';
    c.fillRect(38, -64, 20, 4);
    c.fillStyle = 'rgba(255, 255, 255, 0.75)';
    c.beginPath();
    c.arc(48, -74, 7, 0, Math.PI * 2);
    c.arc(53, -88, 10, 0, Math.PI * 2);
    c.arc(60, -106, 13, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = 'rgba(150, 170, 190, 0.35)';
    c.stroke();

    // Sign
    c.fillStyle = '#e8c99b';
    c.fillRect(-30, -16, 60, 14);
    c.strokeStyle = '#6b4a32';
    c.strokeRect(-30, -16, 60, 14);
    c.fillStyle = '#222';
    c.font = 'bold 8px sans-serif';
    c.textAlign = 'center';
    c.fillText('SAUNA LODGE', 0, -6);

    c.restore();
  }

  function drawYeti(c, x, y, frame, waving) {
    c.save();
    c.translate(x, y);

    // Shadow
    c.fillStyle = 'rgba(180, 195, 210, 0.45)';
    c.beginPath();
    c.ellipse(0, 22, 24, 10, 0, 0, Math.PI * 2);
    c.fill();

    // Fluffy White Yeti body
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(0, 0, 22, 26, 0, 0, Math.PI * 2);
    c.fill();

    // Fur tufts
    c.fillStyle = '#eef3f8';
    c.beginPath();
    c.arc(-14, 6, 6, 0, Math.PI * 2);
    c.arc(14, 6, 6, 0, Math.PI * 2);
    c.fill();

    // Yeti Head
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(0, -18, 16, 0, Math.PI * 2);
    c.fill();

    // Friendly face (light ice-blue face mask)
    c.fillStyle = '#cbe4f2';
    c.beginPath();
    c.ellipse(0, -17, 10, 9, 0, 0, Math.PI * 2);
    c.fill();

    // Friendly eyes & warm smile
    c.fillStyle = '#1a2936';
    c.beginPath();
    c.arc(-4, -18, 2, 0, Math.PI * 2);
    c.arc(4, -18, 2, 0, Math.PI * 2);
    c.fill();

    // Smile
    c.strokeStyle = '#1a2936';
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(0, -15, 5, 0.2, Math.PI - 0.2);
    c.stroke();

    // Nordic patterned knitted scarf
    c.fillStyle = '#d4251f';
    c.fillRect(-14, -8, 28, 7);
    c.fillStyle = '#ffe082';
    c.fillRect(-10, -8, 4, 7);
    c.fillRect(6, -8, 4, 7);

    // Arms
    if (waving) {
      // Waving friendly arm with steaming mug
      c.strokeStyle = '#ffffff';
      c.lineWidth = 8;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-16, -4);
      c.lineTo(-28, -26);
      c.stroke();
      // Mug of hot lingonberry glögg
      c.fillStyle = '#d4251f';
      c.fillRect(-35, -34, 10, 10);
      c.fillStyle = '#fff';
      c.beginPath();
      c.arc(-30, -38, 3, 0, Math.PI * 2);
      c.fill();
    } else {
      // Running arms
      var armSwing = Math.sin(frame * 0.25) * 10;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 7;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-16, -4);
      c.lineTo(-24, 8 + armSwing);
      c.moveTo(16, -4);
      c.lineTo(24, 8 - armSwing);
      c.stroke();
    }

    c.restore();
  }

  function loop() {
    update();
    render();
    animFrameId = requestAnimationFrame(loop);
  }

  function renderLevelWinBanner() {
    var bannerWrap = modal.querySelector('[data-nordic-banner-wrap]');
    if (!bannerWrap) return;
    var lvl = LEVELS[currentLevelIdx];
    bannerWrap.innerHTML =
      '<div class="nordic-banner" role="status">' +
      '<div>' +
      '<h3>Slope Complete: ' + lvl.name + '!</h3>' +
      '<p>Passed ' + gatesPassed + ' of ' + totalGates + ' slalom gates cleanly.</p>' +
      '</div>' +
      '<div class="nordic-banner-actions">' +
      '<button type="button" class="btn" data-nordic-next>Next Nordic Slope &rarr;</button>' +
      '</div>' +
      '</div>';

    var nextBtn = bannerWrap.querySelector('[data-nordic-next]');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        currentLevelIdx++;
        buildCourse(LEVELS[currentLevelIdx]);
        bannerWrap.innerHTML = '';
        var t = modal.querySelector('[data-nordic-level-title]');
        var sub = modal.querySelector('[data-nordic-level-sub]');
        if (t) t.textContent = 'Slope ' + (currentLevelIdx + 1) + ': ' + LEVELS[currentLevelIdx].name;
        if (sub) sub.textContent = LEVELS[currentLevelIdx].country;
      });
      nextBtn.focus();
    }
  }

  function renderVictory() {
    var bannerWrap = modal.querySelector('[data-nordic-banner-wrap]');
    if (!bannerWrap) return;

    bannerWrap.innerHTML =
      '<div class="nordic-victory-card" role="status">' +
      '<h3>All Nordic Slopes Conquered!</h3>' +
      '<p>Clean lines, fresh powder, and genuine Nordic hospitality. The Yeti welcomes you to the warmth of the timber sauna.</p>' +
      '<div class="nordic-victory-btns">' +
      '<a href="https://en.wikipedia.org/wiki/Scandinavian_design" class="btn" target="_blank" rel="noopener noreferrer">Scandinavian &amp; Nordic Design</a>' +
      '<button type="button" class="chip" data-nordic-close-win>Close</button>' +
      '<button type="button" class="chip" data-nordic-replay>Ski again</button>' +
      '</div>' +
      '</div>';

    var closeWinBtn = bannerWrap.querySelector('[data-nordic-close-win]');
    if (closeWinBtn) closeWinBtn.addEventListener('click', close);

    var replayBtn = bannerWrap.querySelector('[data-nordic-replay]');
    if (replayBtn) {
      replayBtn.addEventListener('click', function () {
        currentLevelIdx = 0;
        bannerWrap.innerHTML = '';
        buildCourse(LEVELS[currentLevelIdx]);
        var t = modal.querySelector('[data-nordic-level-title]');
        var sub = modal.querySelector('[data-nordic-level-sub]');
        if (t) t.textContent = 'Slope 1: ' + LEVELS[0].name;
        if (sub) sub.textContent = LEVELS[0].country;
      });
    }

    var wikiLink = bannerWrap.querySelector('a');
    if (wikiLink) wikiLink.focus();
  }

  function buildModal() {
    var st = document.createElement('style');
    st.textContent = css;
    document.head.appendChild(st);

    var backdrop = document.createElement('div');
    backdrop.className = 'nordic-backdrop';
    backdrop.hidden = true;

    modal = document.createElement('div');
    modal.className = 'nordic-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'nordic-modal-title');

    modal.innerHTML =
      '<div class="nordic-head">' +
      '<div class="nordic-titles">' +
      '<p class="nordic-kicker">Nordic Winter Mini-Game</p>' +
      '<h2 id="nordic-modal-title" class="nordic-title">Nordic Lines: Downhill Slalom</h2>' +
      '<p class="nordic-sub" data-nordic-level-title>Slope 1: Holmenkollen Slalom</p>' +
      '</div>' +
      '<div class="nordic-actions">' +
      '<button type="button" class="chip" data-nordic-sound aria-pressed="false">Sound: off</button>' +
      '<button type="button" class="chip" data-nordic-reset aria-label="Restart slope">Reset</button>' +
      '<button type="button" class="chip" data-nordic-close aria-label="Close game">&times; Close</button>' +
      '</div>' +
      '</div>' +
      '<div class="nordic-bar">' +
      '<div class="nordic-stats">' +
      '<div class="nordic-stat">Slalom gates: <span data-nordic-stat-gates>0 / 0</span></div>' +
      '<div class="nordic-stat">Descent: <span data-nordic-stat-dist>0%</span></div>' +
      '</div>' +
      '<div class="meta" data-nordic-level-sub>Oslo, Norway</div>' +
      '</div>' +
      '<div class="nordic-canvas-wrap">' +
      '<canvas class="nordic-canvas" width="640" height="440" role="img" aria-label="Nordic downhill ski run. Use Arrow keys or A/D to steer, Space to jump."></canvas>' +
      '<div class="nordic-touch-ctls">' +
      '<div class="nordic-touch-side" data-touch-left></div>' +
      '<div class="nordic-touch-side" data-touch-right></div>' +
      '</div>' +
      '<button type="button" class="nordic-jump-btn" data-nordic-jump aria-label="Jump">JUMP</button>' +
      '</div>' +
      '<p class="nordic-hint">Desktop: Left/Right arrows or A/D to steer, Space to jump. Mobile: Touch left/right to steer.</p>' +
      '<div class="nordic-sr" data-nordic-announce role="status" aria-live="polite"></div>' +
      '<div class="nordic-banner-wrap" data-nordic-banner-wrap></div>';

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    canvas = modal.querySelector('.nordic-canvas');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = 640 * dpr;
    canvas.height = 440 * dpr;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Controls
    var closeBtn = modal.querySelector('[data-nordic-close]');
    if (closeBtn) closeBtn.addEventListener('click', close);

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) close();
    });

    var soundBtn = modal.querySelector('[data-nordic-sound]');
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

    var resetBtn = modal.querySelector('[data-nordic-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        buildCourse(LEVELS[currentLevelIdx]);
        var b = modal.querySelector('[data-nordic-banner-wrap]');
        if (b) b.innerHTML = '';
      });
    }

    // Touch controls
    var wrap = modal.querySelector('.nordic-canvas-wrap');
    function updateTouchFromEvent(e) {
      var rect = canvas.getBoundingClientRect();
      var clientX = e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX;
      var scale = 640 / rect.width;
      input.touchX = (clientX - rect.left) * scale;
    }

    wrap.addEventListener('touchstart', function (e) {
      updateTouchFromEvent(e);
    }, { passive: true });

    wrap.addEventListener('touchmove', function (e) {
      updateTouchFromEvent(e);
    }, { passive: true });

    wrap.addEventListener('touchend', function () {
      input.touchX = null;
    });

    var jumpBtn = modal.querySelector('[data-nordic-jump]');
    if (jumpBtn) {
      jumpBtn.addEventListener('click', function () {
        if (!skier.isJumping) {
          skier.isJumping = true;
          skier.jumpVz = 5.2;
          playJumpSound();
        }
      });
    }

    // Keyboard controls
    window.addEventListener('keydown', function (e) {
      if (!modal || modal.parentNode.hidden) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        input.left = true;
        e.preventDefault();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        input.right = true;
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        input.jump = true;
        e.preventDefault();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    });

    window.addEventListener('keyup', function (e) {
      if (!modal || modal.parentNode.hidden) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') input.left = false;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') input.right = false;
      else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') input.jump = false;
    });
  }

  function open(btn) {
    opener = btn;
    if (!modal) buildModal();
    currentLevelIdx = 0;
    buildCourse(LEVELS[currentLevelIdx]);

    var backdrop = modal.parentNode;
    backdrop.hidden = false;

    var firstFocusable = modal.querySelector('button');
    if (firstFocusable) firstFocusable.focus();

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(loop);
    }
  }

  function close() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (!modal) return;
    var backdrop = modal.parentNode;
    backdrop.hidden = true;
    if (opener && opener.focus) opener.focus();
  }

  AW.egg('nordic', {
    toggle: function (btn) {
      if (modal && !modal.parentNode.hidden) close();
      else open(btn);
    },
    start: function () {},
    stop: close
  });
})();
