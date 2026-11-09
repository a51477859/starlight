/* 나이스 따라하기 재생기 — 보기(커서가 누름) / 직접 해 보기(선생님이 누름). */
(function () {
  'use strict';
  var W = 1440, H = 880;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? Math.min(ms, 60) : ms); }); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rich(s) { return esc(s).replace(/\{([^}]+)\}/g, '<span class="key">$1</span>'); }

  function Sim(el, scn, fake) {
    var self = this;
    this.el = el; this.scn = scn; this.i = 0; this.mode = 'watch'; this.playing = false; this.busy = false;
    el.innerHTML =
      '<div class="sim-bar">' +
        '<div class="seg" role="tablist" aria-label="따라하기 방식">' +
          '<button type="button" role="tab" data-mode="watch" aria-selected="true">보기</button>' +
          '<button type="button" role="tab" data-mode="try" aria-selected="false">직접 해 보기</button>' +
        '</div>' +
        '<span class="sim-count num" aria-live="polite"></span>' +
        '<span class="sp"></span>' +
        '<button type="button" class="btn" data-c="prev" aria-label="이전 단계">이전</button>' +
        '<button type="button" class="btn pri" data-c="play">재생</button>' +
        '<button type="button" class="btn" data-c="next" aria-label="다음 단계">다음</button>' +
        '<button type="button" class="btn ghost" data-c="reset">처음부터</button>' +
      '</div>' +
      '<div class="sim-body">' +
        '<ol class="sim-steps"></ol>' +
        '<div class="sim-right">' +
          '<figure class="sim-win">' +
            '<div class="sim-chrome"><i></i><i></i><i></i><span>oo.neis.go.kr · 4세대 지능형 나이스</span></div>' +
            '<div class="sim-view"><div class="sim-stage"><div class="sim-cam">' +
              '<div class="nz"></div>' +
              '<div class="sim-hl" hidden><b></b></div>' +
              '<div class="sim-ring"></div>' +
              '<svg class="sim-cur" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 2.5v17.2l4.6-4.3 2.9 6.6 3-1.3-2.9-6.5h6.3z"/></svg>' +
            '</div></div></div>' +
          '</figure>' +
          '<div class="sim-say" aria-live="polite"></div>' +
        '</div>' +
      '</div>';
    this.$ = function (s) { return el.querySelector(s); };
    this.nz = this.$('.nz'); this.cam = this.$('.sim-cam'); this.stage = this.$('.sim-stage'); this.view = this.$('.sim-view');
    this.hl = this.$('.sim-hl'); this.cur = this.$('.sim-cur'); this.ring = this.$('.sim-ring');
    this.app = new window.NeisApp(this.nz, fake);
    this.cx = 1000; this.cy = 520;
    this.renderSteps();

    this.fit();
    if (window.ResizeObserver) new ResizeObserver(function () { self.fit(); }).observe(this.view);
    window.addEventListener('resize', function () { self.fit(); });

    el.addEventListener('click', function (e) {
      var m = e.target.closest('[data-mode]'); if (m) { self.setMode(m.dataset.mode); return; }
      var c = e.target.closest('[data-c]'); if (c) { self.cmd(c.dataset.c); return; }
      var s = e.target.closest('[data-step]'); if (s) { self.stop(); self.goTo(+s.dataset.step); return; }
    });
    this.nz.addEventListener('click', function (e) { self.stageClick(e); });
    el.addEventListener('keydown', function (e) {
      if (e.target.matches('input, textarea')) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); self.cmd('next'); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); self.cmd('prev'); }
    });
    this.goTo(0);
  }

  Sim.prototype.fit = function () {
    var w = this.view.clientWidth; if (!w) return;
    this.k = w / W;
    this.stage.style.transform = 'scale(' + this.k + ')';
    this.view.style.height = Math.round(H * this.k) + 'px';
  };

  Sim.prototype.renderSteps = function () {
    var self = this;
    this.$('.sim-steps').innerHTML = this.scn.steps.map(function (s, n) {
      return '<li><button type="button" data-step="' + n + '"><span class="no num">' + (n + 1) + '</span><span class="tt">' + rich(s.t) + '</span></button></li>';
    }).join('');
  };

  Sim.prototype.target = function () {
    var st = this.scn.steps[this.i]; if (!st) return null;
    return this.nz.querySelector('[data-act="' + st.act + '"]');
  };
  Sim.prototype.rect = function (el) {
    var a = el.getBoundingClientRect(), b = this.nz.getBoundingClientRect(), k = b.width / W;
    return { x: (a.left - b.left) / k, y: (a.top - b.top) / k, w: a.width / k, h: a.height / k };
  };

  Sim.prototype.update = function () {
    var self = this, n = this.scn.steps.length, st = this.scn.steps[this.i];
    Array.prototype.forEach.call(this.el.querySelectorAll('.sim-steps li'), function (li, k) {
      li.className = k < self.i ? 'done' : (k === self.i ? 'now' : '');
      var b = li.querySelector('button'); if (k === self.i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    this.$('.sim-count').textContent = Math.min(this.i + 1, n) + ' / ' + n;
    var say = this.$('.sim-say');
    if (st) {
      say.innerHTML = '<p class="s-t"><span class="num">' + (this.i + 1) + '</span>' + rich(st.t) + '</p><p class="s-d">' + rich(st.say) + '</p>' +
        (st.tip ? '<p class="s-tip">' + rich(st.tip) + '</p>' : '') +
        (this.mode === 'try' ? '<p class="s-hint" hidden></p>' : '');
    } else {
      say.innerHTML = '<p class="s-t done">끝까지 했어요</p><p class="s-d">국어 저장까지 마쳤어요. 실제로는 과목을 바꿔 6번부터 같은 순서로 반복해요.</p>';
    }
    this.$('[data-c="prev"]').disabled = this.i === 0;
    this.$('[data-c="next"]').disabled = this.i >= n;
    this.$('[data-c="play"]').textContent = this.playing ? '멈춤' : (this.i >= n ? '다시 보기' : '재생');
    this.$('[data-c="play"]').hidden = this.mode === 'try';
    this.place();
  };

  Sim.prototype.place = function () {
    var st = this.scn.steps[this.i], t = this.target();
    if (!st || !t) { this.hl.hidden = true; this.zoom(null); return; }
    var r = this.rect(t), pad = 4;
    this.hl.hidden = false;
    this.hl.style.transform = 'translate(' + (r.x - pad) + 'px,' + (r.y - pad) + 'px)';
    this.hl.style.width = (r.w + pad * 2) + 'px'; this.hl.style.height = (r.h + pad * 2) + 'px';
    this.hl.querySelector('b').textContent = this.i + 1;
    var z = this.k < 0.5 ? Math.max(st.zoom || 0, 2.4) : st.zoom;
    this.zoom(z ? { z: z, x: r.x + r.w / 2, y: r.y + r.h / 2 } : null);
  };

  Sim.prototype.zoom = function (o) {
    if (!o) { this.cam.style.transform = ''; return; }
    var x = Math.max(W * 0.12, Math.min(W * 0.88, o.x)), y = Math.max(H * 0.12, Math.min(H * 0.88, o.y));
    this.cam.style.transformOrigin = x + 'px ' + y + 'px';
    this.cam.style.transform = 'scale(' + o.z + ')';
  };

  Sim.prototype.moveCursor = function (x, y) {
    this.cx = x; this.cy = y;
    this.cur.style.transform = 'translate(' + (x - 4) + 'px,' + (y - 2) + 'px)';
    return sleep(720);
  };
  Sim.prototype.pulse = function (x, y) {
    var r = this.ring;
    r.style.transform = 'translate(' + (x - 20) + 'px,' + (y - 20) + 'px)';
    r.classList.remove('go'); void r.offsetWidth; r.classList.add('go');
  };

  /* 현재 단계를 실행 (커서가 있으면 움직인 뒤) */
  Sim.prototype.run = function (withCursor) {
    var self = this, st = this.scn.steps[this.i], t = this.target();
    if (!st || !t || this.busy) return Promise.resolve();
    this.busy = true;
    var r = this.rect(t), x = r.x + Math.min(r.w / 2, 40), y = r.y + r.h / 2;
    var go = withCursor ? this.moveCursor(x, y).then(function () { return sleep(160); }) : Promise.resolve();
    return go.then(function () {
      self.pulse(x, y);
      self.hl.hidden = true;
      return self.app.perform(st.act);
    }).then(function () {
      self.i++; self.busy = false; self.update();
      if (self.i >= self.scn.steps.length) self.finish();
    });
  };

  Sim.prototype.goTo = function (n) {
    var self = this;
    this.app.instant = true; this.app.reset();
    var p = Promise.resolve();
    this.scn.steps.slice(0, n).forEach(function (s) { p = p.then(function () { return self.app.perform(s.act); }); });
    return p.then(function () { self.app.instant = false; self.i = n; self.update(); });
  };

  Sim.prototype.play = function () {
    var self = this;
    if (this.i >= this.scn.steps.length) { this.goTo(0).then(function () { self.play(); }); return; }
    this.playing = true; this.update();
    var loop = function () {
      if (!self.playing || self.i >= self.scn.steps.length) { self.playing = false; self.update(); return; }
      self.run(true).then(function () { return sleep(1100); }).then(loop);
    };
    loop();
  };
  Sim.prototype.stop = function () { this.playing = false; this.update(); };

  Sim.prototype.cmd = function (c) {
    if (this.busy && c !== 'play') return;
    if (c === 'play') { this.playing ? this.stop() : this.play(); }
    else if (c === 'next') { this.stop(); this.run(this.mode === 'watch'); }
    else if (c === 'prev') { this.stop(); if (this.i > 0) this.goTo(this.i - 1); }
    else if (c === 'reset') { this.stop(); this.goTo(0); }
  };

  Sim.prototype.setMode = function (m) {
    this.stop(); this.mode = m;
    this.el.classList.toggle('is-try', m === 'try');
    Array.prototype.forEach.call(this.el.querySelectorAll('[data-mode]'), function (b) { b.setAttribute('aria-selected', b.dataset.mode === m ? 'true' : 'false'); });
    this.goTo(0);
  };

  Sim.prototype.stageClick = function (e) {
    if (this.busy) return;
    var el = e.target.closest('[data-act]'), st = this.scn.steps[this.i];
    if (this.mode === 'watch') {
      this.hint('지금은 보기 중이에요. 위에서 ‘직접 해 보기’를 고르면 직접 눌러 볼 수 있어요.');
      return;
    }
    if (!st) return;
    if (el && el.dataset.act === st.act) { this.run(false); return; }
    var name = el ? (el.textContent || '').trim().slice(0, 14) : '';
    this.hint((name ? '‘' + name + '’ 말고 ' : '거기 말고 ') + '빨간 상자 안을 눌러요. ' + st.say.split('.')[0] + '.');
  };

  Sim.prototype.hint = function (msg) {
    var h = this.el.querySelector('.s-hint');
    if (!h) { h = document.createElement('p'); h.className = 's-hint'; this.$('.sim-say').appendChild(h); }
    h.hidden = false; h.textContent = msg;
    h.classList.remove('go'); void h.offsetWidth; h.classList.add('go');
  };

  Sim.prototype.finish = function () {
    if (this.onFinish) this.onFinish(this.mode);
  };

  window.NeisSim = Sim;
})();
