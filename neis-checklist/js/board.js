(function () {
  'use strict';

  var D = window.NEIS_DATA;
  var KEY = 'neis-board-2026-1';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ── 상태 ───────────────────────── */
  var state = load();
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { checked: s.checked || {}, peeled: s.peeled || {} };
    } catch (e) { return { checked: {}, peeled: {} }; }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 불가 환경 */ }
  }
  function checks(g) {
    var a = state.checked[g.id] || [];
    return g.items.map(function (_, i) { return !!a[i]; });
  }
  function doneCount(g) { return checks(g).filter(Boolean).length; }
  function isComplete(g) { return doneCount(g) === g.items.length; }
  function byId(id) { return D.groups.filter(function (g) { return g.id === id; })[0]; }

  /* ── 문구 다듬기: {버튼} → 키캡, [메뉴] → 그대로 ─── */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rich(s) {
    return esc(s).replace(/\{([^}]+)\}/g, '<span class="ui-btn">$1</span>');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tilt(i) { var t = [-0.6, 0.45, -0.25, 0.7, -0.5, 0.3]; return t[i % t.length] + 'deg'; }

  var ICON = {
    more: '<svg class="ic" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    undo: '<svg class="ic" viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>',
    chev: '<svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>'
  };

  /* ── 메모지 그리기 ───────────────── */
  function noteHTML(g, idx) {
    var c = checks(g), n = doneCount(g), total = g.items.length;
    var tags = g.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('');
    var items = g.items.map(function (it, i) {
      return '<li><label class="chk"><input type="checkbox" data-g="' + g.id + '" data-i="' + i + '"' + (c[i] ? ' checked' : '') + '>' +
        '<span class="box">' + ICON.check + '</span><span class="lbl">' + rich(it.t) + '</span></label></li>';
    }).join('');
    var dots = g.items.map(function (_, i) { return '<i class="' + (c[i] ? 'on' : '') + '"></i>'; }).join('');
    var warn = g.notes.length ? '<p class="n-warn"><b>※</b>' + rich(g.notes[0]) + '</p>' : '';
    return '<article class="note' + (n === total ? ' ready' : '') + '" data-id="' + g.id + '" data-lane="' + g.lane + '" style="--r:' + tilt(idx) + '">' +
      '<div class="paper">' +
        '<span class="tape" aria-hidden="true"></span>' +
        '<div class="n-top"><span class="n-no num">' + pad(g.no) + '</span>' + tags +
          '<button class="icon-btn" type="button" data-detail="' + g.id + '" aria-label="' + esc(g.title) + ' 자세히">' + ICON.more + '</button></div>' +
        '<button class="n-title" type="button" data-detail="' + g.id + '">' + esc(g.title) + '</button>' +
        '<p class="n-path">' + g.path.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('') + '</p>' +
        '<ul class="checks">' + items + '</ul>' +
        '<div class="n-prog"><span class="n-state">' + (n === total ? '다 했어요 · 귀퉁이를 당겨 떼세요' : '진행') + '</span><span class="pct"><span class="n-done">' + n + '</span>/' + total + '</span><div class="dots">' + dots + '</div></div>' +
        warn +
        '<span class="flap" aria-hidden="true"></span>' +
      '</div>' +
      '<button class="peel" type="button" aria-label="' + esc(g.title) + ' 메모 떼기"></button>' +
    '</article>';
  }

  function renderBoard() {
    var board = $('#board');
    board.innerHTML = D.lanes.map(function (l) {
      var gs = D.groups.filter(function (g) { return g.lane === l.id; });
      var left = gs.filter(function (g) { return !state.peeled[g.id]; });
      var body = left.length
        ? left.map(function (g, i) { return noteHTML(g, g.no + i); }).join('')
        : '<p class="lane-clear">이 칸은 다 뗐어요</p>';
      return '<div class="lane" data-lane="' + l.id + '">' +
        '<div class="lane-head"><h2>' + esc(l.name) + '</h2><span class="cnt num">' + left.length + '</span><span class="sub">' + esc(l.sub) + '</span></div>' +
        body + '</div>';
    }).join('');
  }

  function renderDone(enterId) {
    var list = D.groups.filter(function (g) { return state.peeled[g.id]; })
      .sort(function (a, b) { return state.peeled[b.id] - state.peeled[a.id]; });
    $('#doneList').innerHTML = list.map(function (g) {
      var t = new Date(state.peeled[g.id]);
      var when = (t.getMonth() + 1) + '월 ' + t.getDate() + '일 ' + pad(t.getHours()) + ':' + pad(t.getMinutes());
      return '<li><details class="done-item' + (g.id === enterId ? ' enter' : '') + '" data-lane="' + g.lane + '">' +
        '<summary><span class="bar"></span><span class="t"><span class="n-no num">' + pad(g.no) + '</span> ' + esc(g.title) +
        '<span class="meta num">할 일 ' + g.items.length + '개 · ' + when + '</span></span>' +
        '<button class="icon-btn" type="button" data-restore="' + g.id + '" aria-label="' + esc(g.title) + ' 다시 붙이기" title="다시 붙이기">' + ICON.undo + '</button></summary>' +
        '<ul>' + g.items.map(function (it) { return '<li>' + rich(it.t) + '</li>'; }).join('') + '</ul>' +
      '</details></li>';
    }).join('');
    $('#doneCount').textContent = list.length;
    $('#doneEmpty').hidden = list.length > 0;
  }

  function renderSummary() {
    var total = 0, done = 0, peeled = 0;
    D.groups.forEach(function (g) { total += g.items.length; done += doneCount(g); if (state.peeled[g.id]) peeled++; });
    $('#sumPeeled').textContent = peeled;
    $('#sumGroups').textContent = D.groups.length;
    $('#sumDone').textContent = done;
    $('#sumItems').textContent = total;
    $('#seg').innerHTML = D.groups.map(function (g) {
      return '<li data-lane="' + g.lane + '" class="' + (state.peeled[g.id] ? 'on' : '') + '"></li>';
    }).join('');
  }

  function renderPrint() {
    $('#printList').innerHTML =
      '<div class="pr-head"><h1>2026학년도 1학기말 나이스 입력 · 확인 체크리스트 (초등 담임)</h1>' +
      '<p>' + esc(D.meta.source) + ' · ' + esc(D.meta.caution) + '</p></div>' +
      D.groups.map(function (g) {
        var c = checks(g);
        return '<section class="pr-g"><h2>' + pad(g.no) + ' ' + esc(g.title) + '<small>[' + g.path.map(esc).join('] - [') + ']</small></h2><ul>' +
          g.items.map(function (it, i) {
            return '<li><span>' + (c[i] ? '■' : '□') + '</span><span>' + esc(it.t) + '</span>' + (it.d ? '<span class="d">' + esc(it.d) + '</span>' : '') + '</li>';
          }).join('') + '</ul>' +
          g.notes.map(function (n) { return '<p class="w">※ ' + esc(n) + '</p>'; }).join('') + '</section>';
      }).join('');
  }

  function renderAll(enterId) { renderBoard(); renderDone(enterId); renderSummary(); }

  /* ── 체크 ───────────────────────── */
  function setCheck(id, i, on) {
    var g = byId(id);
    var a = checks(g); a[i] = on;
    state.checked[id] = a;
    save();
    // 보드의 메모지만 부분 갱신(다시 그리지 않아서 포커스가 유지된다)
    var note = $('.note[data-id="' + id + '"]');
    if (note) {
      var inp = $('input[data-i="' + i + '"]', note); if (inp) inp.checked = on;
      $$('.dots i', note).forEach(function (d, k) { d.classList.toggle('on', a[k]); });
      $('.n-done', note).textContent = doneCount(g);
      var was = note.classList.contains('ready');
      note.classList.toggle('ready', isComplete(g));
      $('.n-state', note).textContent = isComplete(g) ? '다 했어요 · 귀퉁이를 당겨 떼세요' : '진행';
      if (!was && isComplete(g)) toast('‘' + g.title + '’ 다 했어요. 귀퉁이를 당겨서 떼세요');
    }
    var sh = $('#sheet');
    if (sh.open && sh.dataset.id === id) {
      var si = $('input[data-i="' + i + '"]', sh); if (si) si.checked = on;
      $('.sh-peel', sh).hidden = !isComplete(g);
    }
    renderSummary();
  }

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('input[type=checkbox][data-g]')) setCheck(t.dataset.g, +t.dataset.i, t.checked);
  });

  /* ── 떼기: 당기거나 누르기 ─────────── */
  var drag = null;
  document.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.peel');
    if (!btn) return;
    var note = btn.closest('.note');
    var r = note.getBoundingClientRect();
    drag = { note: note, paper: $('.paper', note), x: e.clientX, y: e.clientY, r: r, f: 34, moved: false };
    btn.setPointerCapture(e.pointerId);
    note.classList.add('dragging');
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    // 오른쪽 아래 귀퉁이에서 왼쪽 위로 당긴 거리
    var dx = drag.x - e.clientX, dy = drag.y - e.clientY;
    var pull = Math.max(0, (dx + dy) / Math.SQRT2);
    if (pull > 4) drag.moved = true;
    var max = Math.min(drag.r.width, drag.r.height) * 0.9;
    drag.f = Math.min(max, 34 + pull * 1.1);
    drag.paper.style.setProperty('--f', drag.f + 'px');
  });
  function endDrag() {
    if (!drag) return;
    var d = drag; drag = null;
    d.note.classList.remove('dragging');
    var lim = Math.min(d.r.width, d.r.height) * 0.38;
    if (!d.moved || d.f > lim) { peel(d.note.dataset.id, d.paper); }
    else { d.paper.style.removeProperty('--f'); }
  }
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', function () {
    if (!drag) return; drag.paper.style.removeProperty('--f'); drag.note.classList.remove('dragging'); drag = null;
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.peel')) { e.preventDefault(); peel(e.target.closest('.note').dataset.id); }
  });

  function rects() {
    var m = {};
    $$('.note, .lane-head').forEach(function (n) { m[(n.dataset.id || n.parentNode.dataset.lane + '-h')] = n.getBoundingClientRect(); });
    return m;
  }
  function flip(before) {
    if (reduce) return;
    $$('.note').forEach(function (n) {
      var b = before[n.dataset.id]; if (!b) return;
      var a = n.getBoundingClientRect();
      var dy = b.top - a.top, dx = b.left - a.left;
      if (!dx && !dy) return;
      n.animate([{ transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + getComputedStyle(n).getPropertyValue('--r') + ')' }, { transform: 'translate(0,0) rotate(' + getComputedStyle(n).getPropertyValue('--r') + ')' }],
        { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }

  var lastPeeled = null;
  function peel(id, paper) {
    var g = byId(id);
    if (!isComplete(g) || state.peeled[id]) return;
    var note = $('.note[data-id="' + id + '"]');
    var commit = function () {
      var before = rects();
      state.peeled[id] = Date.now();
      save();
      lastPeeled = id;
      renderAll(id);
      flip(before);
      toast('‘' + g.title + '’ 메모를 뗐어요', '되돌리기', function () { restore(id); });
    };
    if (!note || reduce) { commit(); return; }
    paper = paper || $('.paper', note);
    var r = note.getBoundingClientRect();
    var target = $('#doneList').getBoundingClientRect();
    if (!target.width) target = $('.done').getBoundingClientRect();
    var tx = target.left + 24 - r.left, ty = target.top + 4 - r.top;
    var onScreen = target.top < window.innerHeight && target.bottom > 0;
    if (!onScreen) { tx = 0; ty = -60; }
    paper.style.setProperty('--f', Math.min(r.width, r.height) * 0.92 + 'px');
    note.style.zIndex = 20;
    var rot = getComputedStyle(note).getPropertyValue('--r').trim() || '0deg';
    var anim = note.animate([
      { transform: 'rotate(' + rot + ')', opacity: 1 },
      { transform: 'translate(-6px,-18px) rotate(-5deg)', opacity: 1, offset: .35 },
      { transform: 'translate(' + tx + 'px,' + ty + 'px) rotate(-12deg) scale(.22)', opacity: 0 }
    ], { duration: 640, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
    anim.onfinish = commit;
  }

  function restore(id) {
    if (!state.peeled[id]) return;
    var before = rects();
    delete state.peeled[id];
    save();
    renderAll();
    flip(before);
    var n = $('.note[data-id="' + id + '"]');
    if (n && !reduce) n.animate([{ opacity: 0, transform: 'translateY(-8px) rotate(' + getComputedStyle(n).getPropertyValue('--r') + ')' }, { opacity: 1, transform: 'rotate(' + getComputedStyle(n).getPropertyValue('--r') + ')' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    toast('‘' + byId(id).title + '’ 메모를 다시 붙였어요');
  }

  document.addEventListener('click', function (e) {
    var r = e.target.closest('[data-restore]');
    if (r) { e.preventDefault(); restore(r.dataset.restore); return; }
    var d = e.target.closest('[data-detail]');
    if (d) { openSheet(d.dataset.detail); return; }
    var o = e.target.closest('[data-open]');
    if (o) { var dlg = $('#' + o.dataset.open); dlg.showModal(); var ta = $('textarea', dlg); if (ta) ta.focus(); return; }
    if (e.target.closest('[data-sheet-peel]')) { var id = $('#sheet').dataset.id; $('#sheet').close(); setTimeout(function () { peel(id); }, 120); return; }
    if (e.target.matches('dialog')) e.target.close(); // 바깥(배경) 누르면 닫기
  });

  /* ── 자세히 ─────────────────────── */
  function openSheet(id) {
    var g = byId(id), c = checks(g), sh = $('#sheet');
    var lane = D.lanes.filter(function (l) { return l.id === g.lane; })[0];
    sh.dataset.id = id;
    $('#sheetIn').innerHTML =
      '<div class="sh-top"><span class="n-no num">' + pad(g.no) + '</span><span class="tag" style="background:var(--line)">' + esc(lane.name) + '</span>' +
      g.tags.map(function (t) { return '<span class="tag" style="background:var(--line)">' + esc(t) + '</span>'; }).join('') +
      '<button class="icon-btn" type="button" aria-label="닫기" onclick="this.closest(\'dialog\').close()">' + ICON.close + '</button></div>' +
      '<h2 class="sh-title" id="sheetTitle">' + esc(g.title) + '</h2>' +
      '<div class="crumb">' + g.path.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join(ICON.chev) + '</div>' +
      '<ol class="sh-list">' + g.items.map(function (it, i) {
        return '<li><label class="chk"><input type="checkbox" data-g="' + g.id + '" data-i="' + i + '"' + (c[i] ? ' checked' : '') + '>' +
          '<span class="box">' + ICON.check + '</span><span class="lbl">' + rich(it.t) + '</span></label>' +
          (it.d ? '<p class="sh-d">' + rich(it.d) + '</p>' : '') +
          (it.n ? '<p class="sh-n">' + rich(it.n) + '</p>' : '') + '</li>';
      }).join('') + '</ol>' +
      (g.notes.length ? '<div class="sh-notes">' + g.notes.map(function (n) { return '<p><b>※</b> ' + rich(n) + '</p>'; }).join('') + '</div>' : '') +
      '<p class="sh-soon">나이스 화면 따라하기는 다음 단계에서 이 자리에 들어가요.</p>' +
      '<p class="sh-peel" style="margin-top:16px"' + (isComplete(g) && !state.peeled[id] ? '' : ' hidden') + '><button class="btn" type="button" data-sheet-peel>이 메모 떼기</button></p>';
    sh.showModal();
  }

  /* ── 바이트 계산 ─────────────────── */
  function neisBytes(s) {
    var b = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c === 13 && s.charCodeAt(i + 1) === 10) continue;
      b += c < 128 ? 1 : 3;
    }
    return b;
  }
  $('#byteIn').addEventListener('input', function () {
    var v = this.value, n = neisBytes(v), lim = 90;
    $('#byteN').textContent = n;
    $('#charN').textContent = Array.from(v).length;
    var over = n > lim;
    var f = $('#byteFlag'); f.textContent = over ? (n - lim) + '바이트 넘었어요' : (lim - n) + '바이트 남음 (90 기준)';
    f.classList.toggle('over', over);
    var bar = $('#byteBar'); bar.style.transform = 'scaleX(' + Math.min(1, n / lim) + ')'; bar.classList.toggle('over', over);
  });

  /* ── 토스트 ─────────────────────── */
  var tt;
  function toast(msg, act, fn) {
    var t = $('#toast');
    t.innerHTML = '<span>' + esc(msg) + '</span>' + (act ? '<button type="button">' + esc(act) + '</button>' : '');
    if (act) $('button', t).onclick = function () { t.classList.remove('on'); fn(); };
    t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove('on'); }, act ? 5000 : 2600);
  }

  /* ── 기타 버튼 ───────────────────── */
  $('#printBtn').addEventListener('click', function () { renderPrint(); window.print(); });
  window.addEventListener('beforeprint', renderPrint);
  $('#resetBtn').addEventListener('click', function () {
    if (!confirm('체크와 뗀 메모를 모두 지우고 처음부터 할까요?')) return;
    state = { checked: {}, peeled: {} }; save(); renderAll(); toast('처음 상태로 돌렸어요');
  });

  renderAll();
})();
