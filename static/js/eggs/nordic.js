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
    snowGrad.addColorStop(0, '#f8fafc');
    snowGrad.addColorStop(1, '#edf2f7');
    ctx.fillStyle = snowGrad;
    ctx.fillRect(0, 0, 640, 440);

    var camY = skier.dist - skier.y;

    // Draw Ski Tracks in snow
    ctx.strokeStyle = '#d6e2ec';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    tracks.forEach(function (pt) {
      var screenY = pt.dist - camY;
      if (screenY >= -30 && screenY <= 470) {
        var off = 4;
        ctx.moveTo(pt.x - off, screenY);
        ctx.lineTo(pt.x - off, screenY + 6);
        ctx.moveTo(pt.x + off, screenY);
        ctx.lineTo(pt.x + off, screenY + 6);
      }
    });
    ctx.stroke();

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
        drawGate(ctx, g.x1, g.x2, sy, g.passed);
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

    // Draw Skier
    drawSkier(ctx, skier.x, skier.y, skier.angle, skier.isJumping, skier.jumpZ);

    updateStats();
  }

  function drawSkier(c, x, y, angle, jumping, jz) {
    c.save();
    c.translate(x, y - jz);

    // Shadow on snow
    c.save();
    c.translate(0, jz);
    c.fillStyle = 'rgba(180, 195, 210, 0.45)';
    c.beginPath();
    c.ellipse(0, 14, 16 + jz * 0.2, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();

    c.rotate(angle * 0.7);

    // Twin Skis
    c.fillStyle = '#1f5f7a'; // Nordic blue skis
    c.fillRect(-8, -14, 3.5, 34);
    c.fillRect(4.5, -14, 3.5, 34);

    // Ski tips (curved front)
    c.fillStyle = '#ff6b4a';
    c.fillRect(-8, -17, 3.5, 4);
    c.fillRect(4.5, -17, 3.5, 4);

    // Skier body (Red Nordic parka)
    c.fillStyle = '#d4251f';
    c.beginPath();
    c.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2);
    c.fill();

    // Nordic knit beanie with pom-pom
    c.fillStyle = '#2b3a4a';
    c.beginPath();
    c.arc(0, -6, 6.5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(0, -12, 3, 0, Math.PI * 2);
    c.fill();

    // Ski poles
    c.strokeStyle = '#333';
    c.lineWidth = 1.8;
    c.beginPath();
    c.moveTo(-10, -2);
    c.lineTo(-18, 12);
    c.moveTo(10, -2);
    c.lineTo(18, 12);
    c.stroke();
    c.fillStyle = '#222';
    c.beginPath();
    c.arc(-18, 12, 2.5, 0, Math.PI * 2);
    c.arc(18, 12, 2.5, 0, Math.PI * 2);
    c.fill();

    c.restore();
  }

  function drawPine(c, x, y) {
    c.save();
    c.translate(x, y);
    // Tree shadow
    c.fillStyle = 'rgba(190, 205, 218, 0.4)';
    c.beginPath();
    c.ellipse(4, 18, 18, 8, 0, 0, Math.PI * 2);
    c.fill();

    // Trunk
    c.fillStyle = '#4a3b32';
    c.fillRect(-3, 10, 6, 12);

    // Pine tiers (rich dark Nordic green with snow caps)
    var tiers = [
      { y: 12, w: 38, h: 18 },
      { y: 0, w: 30, h: 16 },
      { y: -12, w: 22, h: 14 }
    ];
    tiers.forEach(function (t) {
      c.fillStyle = '#1d3824';
      c.beginPath();
      c.moveTo(0, t.y - t.h);
      c.lineTo(-t.w / 2, t.y);
      c.lineTo(t.w / 2, t.y);
      c.closePath();
      c.fill();

      // Snow on tier
      c.fillStyle = '#f0f5fa';
      c.beginPath();
      c.moveTo(0, t.y - t.h);
      c.lineTo(-t.w / 4, t.y - t.h / 2);
      c.lineTo(t.w / 4, t.y - t.h / 2);
      c.closePath();
      c.fill();
    });

    c.restore();
  }

  function drawBirch(c, x, y) {
    c.save();
    c.translate(x, y);
    // Shadow
    c.fillStyle = 'rgba(190, 205, 218, 0.35)';
    c.beginPath();
    c.ellipse(6, 14, 12, 6, 0, 0, Math.PI * 2);
    c.fill();

    // White paper birch trunk with black notches
    c.fillStyle = '#f5f5f5';
    c.fillRect(-3, -22, 6, 36);
    c.fillStyle = '#222';
    c.fillRect(-3, -14, 3, 2);
    c.fillRect(0, -6, 3, 2);
    c.fillRect(-3, 2, 4, 2);

    // Birch canopy (golden autumn/winter flecks)
    c.fillStyle = 'rgba(212, 175, 55, 0.7)';
    c.beginPath();
    c.arc(0, -28, 14, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(0, -32, 6, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawRock(c, x, y) {
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(190, 205, 218, 0.4)';
    c.beginPath();
    c.ellipse(2, 6, 16, 7, 0, 0, Math.PI * 2);
    c.fill();

    c.fillStyle = '#596570';
    c.beginPath();
    c.ellipse(0, 0, 15, 10, -0.2, 0, Math.PI * 2);
    c.fill();

    // Snow cap
    c.fillStyle = '#f8fafc';
    c.beginPath();
    c.ellipse(-2, -5, 11, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawAaltoStool(c, x, y) {
    // Alvar Aalto Stool 60
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(190, 205, 218, 0.4)';
    c.beginPath();
    c.ellipse(0, 8, 14, 5, 0, 0, Math.PI * 2);
    c.fill();

    // Bent birch legs
    c.strokeStyle = '#c49a6c';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-9, -2);
    c.lineTo(-10, 8);
    c.moveTo(0, -2);
    c.lineTo(0, 8);
    c.moveTo(9, -2);
    c.lineTo(10, 8);
    c.stroke();

    // Round bentwood top
    c.fillStyle = '#e8c99b';
    c.beginPath();
    c.ellipse(0, -4, 13, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#a87848';
    c.lineWidth = 1;
    c.stroke();
    c.restore();
  }

  function drawEggChair(c, x, y) {
    // Arne Jacobsen Egg Chair
    c.save();
    c.translate(x, y);
    c.fillStyle = 'rgba(190, 205, 218, 0.4)';
    c.beginPath();
    c.ellipse(0, 14, 18, 6, 0, 0, Math.PI * 2);
    c.fill();

    // Chrome 4-star base
    c.strokeStyle = '#999';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(-10, 14);
    c.lineTo(10, 14);
    c.moveTo(0, 6);
    c.lineTo(0, 14);
    c.stroke();

    // Sculptural organic shell (Classic Scandinavian Teal / Cobalt)
    c.fillStyle = '#1f5f7a';
    c.beginPath();
    c.ellipse(0, 0, 15, 18, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#16485d';
    c.beginPath();
    c.ellipse(0, 3, 11, 13, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  function drawRamp(c, x, y, w, h) {
    c.save();
    c.translate(x, y);
    c.fillStyle = '#a8683b';
    c.fillRect(-w / 2, -h / 2, w, h);
    c.fillStyle = '#f8fafc';
    c.fillRect(-w / 2, -h / 2, w, 4);

    // Chevron arrow indicating jump
    c.strokeStyle = '#fff';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(-14, 5);
    c.lineTo(0, -4);
    c.lineTo(14, 5);
    c.stroke();
    c.restore();
  }

  function drawGate(c, x1, x2, y, passed) {
    var poleColor = passed ? '#34c759' : '#d4251f';
    var flagColor = passed ? '#28a745' : '#0a3fb8';

    // Left pole (Red flag)
    c.fillStyle = '#333';
    c.fillRect(x1 - 2, y - 28, 4, 30);
    c.fillStyle = '#d4251f';
    c.beginPath();
    c.moveTo(x1 + 2, y - 28);
    c.lineTo(x1 + 22, y - 20);
    c.lineTo(x1 + 2, y - 12);
    c.closePath();
    c.fill();

    // Right pole (Blue flag)
    c.fillStyle = '#333';
    c.fillRect(x2 - 2, y - 28, 4, 30);
    c.fillStyle = flagColor;
    c.beginPath();
    c.moveTo(x2 - 2, y - 28);
    c.lineTo(x2 - 22, y - 20);
    c.lineTo(x2 - 2, y - 12);
    c.closePath();
    c.fill();
  }

  function drawFinishBanner(c, y) {
    c.save();
    c.translate(320, y);
    // Finish poles
    c.fillStyle = '#333';
    c.fillRect(-220, -40, 6, 42);
    c.fillRect(214, -40, 6, 42);

    // Banner ribbon
    c.fillStyle = '#d4251f';
    c.fillRect(-220, -36, 440, 20);
    c.fillStyle = '#fff';
    c.font = 'bold 12px sans-serif';
    c.textAlign = 'center';
    c.fillText('FINISH  -  MAL', 0, -22);
    c.restore();
  }

  function drawNordicCabin(c, x, y) {
    c.save();
    c.translate(x, y);

    // Shadow
    c.fillStyle = 'rgba(180, 195, 210, 0.45)';
    c.beginPath();
    c.ellipse(0, 48, 90, 24, 0, 0, Math.PI * 2);
    c.fill();

    // Falu Red timber walls
    c.fillStyle = '#8b251e';
    c.fillRect(-75, -20, 150, 65);

    // Modernist warm glowing windows
    c.fillStyle = '#ffe082';
    c.fillRect(-55, 0, 32, 28);
    c.fillRect(25, 0, 32, 28);
    c.strokeStyle = '#4a1512';
    c.lineWidth = 2;
    c.strokeRect(-55, 0, 32, 28);
    c.strokeRect(25, 0, 32, 28);

    // Warm timber door
    c.fillStyle = '#c49a6c';
    c.fillRect(-12, 10, 24, 35);

    // Modernist pitched timber roof covered with thick snow
    c.fillStyle = '#3a241e';
    c.beginPath();
    c.moveTo(0, -60);
    c.lineTo(-90, -20);
    c.lineTo(90, -20);
    c.closePath();
    c.fill();

    // Snow on roof
    c.fillStyle = '#f8fafc';
    c.beginPath();
    c.moveTo(0, -64);
    c.lineTo(-94, -20);
    c.lineTo(-84, -14);
    c.lineTo(0, -54);
    c.lineTo(84, -14);
    c.lineTo(94, -20);
    c.closePath();
    c.fill();

    // Chimney & gentle sauna steam smoke
    c.fillStyle = '#555';
    c.fillRect(40, -62, 16, 26);
    c.fillStyle = 'rgba(255, 255, 255, 0.7)';
    c.beginPath();
    c.arc(48, -72, 8, 0, Math.PI * 2);
    c.arc(52, -88, 12, 0, Math.PI * 2);
    c.arc(58, -108, 16, 0, Math.PI * 2);
    c.fill();

    // Sign
    c.fillStyle = '#e8c99b';
    c.fillRect(-28, -14, 56, 14);
    c.fillStyle = '#222';
    c.font = 'bold 8px sans-serif';
    c.textAlign = 'center';
    c.fillText('SAUNA LODGE', 0, -4);

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
    ctx = canvas.getContext('2d');

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
