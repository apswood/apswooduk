/* The laminated notice, opened from the pin on the Approach page. The terminal prints the same text. */
(function () {
  'use strict';
  var dlg = null, opener = null;
  var css = '.aw-notice{border:6px double #555;background:#fffdf3;color:#222;max-width:560px;padding:24px 28px;font:16px/1.55 Georgia,serif}.aw-notice::backdrop{background:rgba(0,0,0,.55)}' +
    '.aw-notice h2{font-family:Railway,Georgia,serif;letter-spacing:.08em;text-align:center;margin:0 0 .8em;color:#222}.aw-notice p{margin:.6em 0;max-width:none}.aw-notice button{font:inherit;margin-top:1em;padding:6px 16px;border:1px solid #555;background:#fff;color:#222;border-radius:4px;cursor:pointer}' +
    '.aw-notice button:focus-visible{outline:3px solid #9a3b00;outline-offset:2px}';
  function build(d) {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    dlg = document.createElement('dialog'); dlg.className = 'aw-notice'; dlg.setAttribute('aria-label', d.title);
    var h = document.createElement('h2'); h.textContent = d.title; dlg.appendChild(h);
    d.lines.forEach(function (l) { var p = document.createElement('p'); p.textContent = l; dlg.appendChild(p); });
    var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Close'; b.addEventListener('click', function () { dlg.close(); });
    dlg.appendChild(b);
    dlg.addEventListener('close', function () { if (opener && opener.focus) opener.focus(); });
    document.body.appendChild(dlg);
  }
  function open(el) {
    opener = el;
    var go = function () { dlg.showModal(); AW.found('notice'); };
    if (dlg) return go();
    fetch('/notice.json').then(function (r) { return r.json(); }).then(function (d) { build(d); go(); });
  }
  AW.egg('notice', { toggle: open, stop: function () { if (dlg && dlg.open) dlg.close(); } });
})();
