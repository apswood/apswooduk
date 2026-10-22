/* The terminal egg. Loaded on demand. Opens with backtick or the footer glyph, closes with Esc or exit. */
(function () {
  'use strict';
  var data = null, el = null, out = null, input = null, opener = null, hist = [], hi = 0;
  var COMMANDS = ['help', 'whoami', 'uptime', 'traceroute career', 'ping andrew', 'sudo hire andrew', 'rm -rf /',
    'integrity-check', 'answer', 'make coffee', 'hola', 'status', 'dig', 'play', 'rehearse', 'cat notice.txt', 'exit'];

  var css = '.aw-term{position:fixed;left:0;right:0;bottom:0;z-index:50;background:#101214;color:#e8e8e8;font:15px/1.5 ui-monospace,Consolas,Menlo,monospace;max-height:55vh;display:flex;flex-direction:column;border-top:3px solid #ffb000}' +
    '.aw-term[hidden]{display:none}.aw-term-out{overflow:auto;padding:12px 16px;margin:0;white-space:pre-wrap;flex:1}' +
    '.aw-term-row{display:flex;gap:8px;padding:8px 16px 12px;align-items:center}.aw-term-row label{color:#ffb000}' +
    '.aw-term-row input{flex:1;background:transparent;border:0;color:inherit;font:inherit;outline:2px solid transparent;padding:4px}' +
    '.aw-term-row input:focus-visible{outline-color:#ffb070}.aw-term-x{background:none;border:1px solid #888;color:#e8e8e8;border-radius:4px;font:inherit;padding:2px 10px;cursor:pointer}';

  function load() {
    return fetch('/terminal.json').then(function (r) { return r.json(); }).then(function (d) { data = d; }).catch(function () { data = { headline: '', roles: [], tags: {} }; });
  }
  function build() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    el = document.createElement('div'); el.className = 'aw-term'; el.hidden = true;
    el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Terminal'); el.setAttribute('aria-modal', 'false');
    out = document.createElement('pre'); out.className = 'aw-term-out'; out.setAttribute('aria-live', 'polite'); out.tabIndex = 0;
    var row = document.createElement('div'); row.className = 'aw-term-row';
    var lab = document.createElement('label'); lab.htmlFor = 'aw-term-in'; lab.textContent = '$';
    input = document.createElement('input'); input.id = 'aw-term-in'; input.type = 'text'; input.autocomplete = 'off';
    input.spellcheck = false; input.setAttribute('autocapitalize', 'off'); input.setAttribute('aria-label', 'Command');
    var x = document.createElement('button'); x.type = 'button'; x.className = 'aw-term-x'; x.textContent = 'Close'; x.addEventListener('click', close);
    row.appendChild(lab); row.appendChild(input); row.appendChild(x);
    el.appendChild(out); el.appendChild(row); document.body.appendChild(el);
    input.addEventListener('keydown', onKey);
    el.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); close(); } });
    print('Type help for a list of commands.');
  }
  function print(t) { out.textContent += t + '\n'; out.scrollTop = out.scrollHeight; }
  function open() {
    opener = document.activeElement;
    if (!el) build();
    el.hidden = false; input.focus();
  }
  function close() { if (!el) return; el.hidden = true; if (opener && opener.focus) opener.focus(); }

  function onKey(e) {
    if (e.key === 'Enter') {
      var v = input.value.trim(); input.value = '';
      print('$ ' + v);
      if (v) { hist.push(v); hi = hist.length; run(v); }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); if (hi > 0) { hi--; input.value = hist[hi]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault(); if (hi < hist.length - 1) { hi++; input.value = hist[hi]; } else { hi = hist.length; input.value = ''; }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      var p = input.value.toLowerCase();
      var m = COMMANDS.filter(function (c) { return c.indexOf(p) === 0; });
      if (m.length === 1) input.value = m[0];
      else if (m.length > 1) print(m.join('   '));
    }
  }

  function uptime() {
    var s = String(data.service_start || '').split('-'), y = +s[0], mo = +s[1] || 1, n = new Date();
    var months = (n.getFullYear() - y) * 12 + (n.getMonth() + 1 - mo);
    var yrs = Math.floor(months / 12), rem = months % 12;
    var t = 'up ' + yrs + ' year' + (yrs === 1 ? '' : 's') + (rem ? ', ' + rem + ' month' + (rem === 1 ? '' : 's') : '');
    return t + ', load average: steady';
  }
  function go(url) { close(); location.href = url; }

  function run(v) {
    AW.found('terminal');
    var c = v.toLowerCase().replace(/\s+/g, ' ');
    switch (c) {
      case 'help': print('Commands: ' + COMMANDS.join(', ') + '.'); break;
      case 'whoami': print(data.headline); break;
      case 'uptime': print(uptime()); break;
      case 'traceroute career':
        print('traceroute to career (london), ' + data.roles.length + ' hops max');
        data.roles.forEach(function (r, i) {
          var ms = (3 + i * 7 + (i % 3) * 2).toFixed(1);
          print(' ' + (i + 1) + '  ' + r.title + ' (' + r.org + ', ' + String(r.from).slice(0, 4) + ')  ' + ms + ' ms');
        });
        print(' ' + (data.roles.length + 1) + '  london  ' + (data.roles.length * 7 + 9).toFixed(1) + ' ms  destination reached');
        break;
      case 'ping andrew': print('64 bytes from London: time varies with coffee'); break;
      case 'sudo hire andrew': print('Permission granted.'); setTimeout(function () { go('/contact/'); }, AW.reducedMotion() ? 0 : 700); break;
      case 'rm -rf /': print('Change rejected. Emergency CAB convened. Request denied with feedback.'); break;
      case 'integrity-check':
        var t = data.tags, total = (t.Led || 0) + (t['Co-led'] || 0) + (t.Contributed || 0) + (t.Supported || 0);
        print('Counted ' + total + ' published outcomes: ' + (t.Led || 0) + ' Led, ' + (t['Co-led'] || 0) + ' Co-led, ' + (t.Contributed || 0) + ' Contributed, ' + (t.Supported || 0) + ' Supported.');
        print('Every outcome is tagged Led, Co-led, Contributed or Supported. No traitors found.');
        break;
      case 'answer':
        if (AW.reducedMotion()) print('42. The requirements were never clear.');
        else setTimeout(function () { print('42. The requirements were never clear.'); }, 1500);
        break;
      case 'make coffee': print('418 I\'m a teapot'); break;
      case 'hola': print('Hola. Estoy aprendiendo español. Ten paciencia con mi subjuntivo.'); break;
      case 'status': go('/status/'); break;
      case 'dig': close(); AW.load('dig').then(function (d) { if (d) d.open(); }); break;
      case 'play': go('/404.html'); break;
      case 'rehearse': go('/rehearsal/'); break;
      case 'cat notice.txt':
        fetch('/notice.json').then(function (r) { return r.json(); }).then(function (n) { print(n.title); n.lines.forEach(print); AW.found('notice'); });
        break;
      case 'exit': close(); break;
      default: print('Command not found. Raised as a request. Triage in progress.');
    }
  }

  AW.egg('terminal', {
    toggle: function () { var go = function () { if (el && !el.hidden) close(); else open(); }; if (data) go(); else load().then(go); },
    stop: close
  });
})();
