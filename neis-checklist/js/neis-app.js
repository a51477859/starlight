/* 4세대 나이스 화면 재구성 — 실제처럼 동작하는 작은 앱.
   모든 누를 수 있는 곳은 data-act. 커서(보기)와 선생님(직접 해 보기)이 같은 perform()을 부른다. */
(function () {
  'use strict';

  var I = {
    clock: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    out: '<svg class="i" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
    book: '<svg class="i" viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/><path d="M8 7h6"/></svg>',
    mon: '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="1"/><path d="M8 20h8M12 16v4"/></svg>',
    exp: '<svg class="i" viewBox="0 0 24 24"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>',
    col: '<svg class="i" viewBox="0 0 24 24"><path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7"/></svg>',
    user: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    menu: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 9h8M8 12h8M8 15h8"/></svg>',
    bell: '<svg class="i" viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21h4"/></svg>',
    find: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-5-5"/></svg>',
    star: '<svg class="i" viewBox="0 0 24 24"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/></svg>',
    gear: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    home: '<svg class="i" viewBox="0 0 24 24"><path d="M3 11 12 4l9 7M5 10v10h14V10"/></svg>',
    q: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-5-5"/></svg>',
    help: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5M12 17h.01"/></svg>',
    chat: '<svg class="i" viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/></svg>',
    doc: '<svg class="i" viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M9 12h7M9 16h7"/></svg>',
    tel: '<svg class="i" viewBox="0 0 24 24"><path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    play: '<svg class="i" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1"/><path d="m10 9 5 3-5 3z"/></svg>',
    up: '<svg class="i" viewBox="0 0 24 24"><path d="m6 15 6-6 6 6"/></svg>',
    down: '<svg class="i" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
    x: '<svg class="i" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    nodata: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m21 21-5-5M8 11h6"/></svg>'
  };

  var MEGA = [
    ['교육과정', ['시간표관리', '학급담임편성및교과개설', '교육과정편성']],
    ['학적', ['기본학적관리', '출결관리', '미인정결석학생관리']],
    ['학생생활', ['창의적체험활동', '행동특성및종합의견', '학교폭력조치상황관리', '학부모서비스승인관리']],
    ['성적', ['평가계획', '학생평가', '성적조회', '관찰기록관리']],
    ['학생부', ['학교생활기록부', '정정대장관리', '생활통지표']],
    ['보건', ['건강기록부', '보건일지']]
  ];
  var TREE = {
    '성적': [
      ['평가계획', ['평가계획(안)관리', '평가계획(안)관리(반별)', '예시문']],
      ['학생평가', ['교과평가', '학기말종합의견', '교과학습발달상황']],
      ['성적조회', []],
      ['관찰기록관리', ['관찰내용관리']]
    ]
  };
  var ROLES = ['업무분장설정업무', '학급담임', '동아리담임', '나이스', 'PAPS', '학교스포츠클럽', '보건교육', '학교정보', '학교생활기록부', '학적', '교육설문'];
  var SUBJ = ['국어', '도덕', '사회', '수학', '과학', '체육', '음악', '미술', '영어'];

  function NeisApp(root, data) {
    this.root = root;
    this.data = data;
    this.speed = 1;
    this.reset();
  }

  NeisApp.prototype.reset = function () {
    this.prev = null;
    this.s = {
      role: null, mega: false, tree: null, treeOpen: {}, screen: 'home', tabs: [],
      q: false, loading: false,
      pop: null, dlg: null
    };
    this.render();
  };

  NeisApp.prototype.wait = function (ms) {
    var self = this;
    return new Promise(function (r) { setTimeout(r, self.instant ? 0 : ms * self.speed); });
  };

  NeisApp.prototype.load = function (ms) {
    var self = this;
    self.s.loading = true; self.render();
    return self.wait(ms || 650).then(function () { self.s.loading = false; });
  };

  /* 누르면 일어나는 일 — Promise를 돌려준다 */
  NeisApp.prototype.perform = function (act) {
    var s = this.s, self = this, p = act.split(':');
    var done = function () { self.render(); return Promise.resolve(); };
    switch (p[0]) {
      case 'role':
        s.role = p[1]; s.mega = !s.mega || s.role !== p[1]; return done();
      case 'mega':
        s.mega = false;
        if (TREE[p[1]]) { s.tree = p[1]; s.treeOpen = {}; s.treeOpen[p[2]] = true; }
        return done();
      case 'tg':
        s.treeOpen[p[1]] = !s.treeOpen[p[1]]; return done();
      case 'tree':
        s.screen = p[1]; s.q = false;
        if (s.tabs.indexOf(p[1]) < 0) s.tabs.push(p[1]);
        return done();
      case 'q':
        return this.load(700).then(function () { s.q = true; self.render(); self.flash('.nz-list tbody'); });
      case 'bulk':
        s.pop = { mode: 'student', dd: false, subj: null, q: false, c1: false, saved: false }; return done();
      case 'pmode':
        s.pop.mode = p[1]; s.pop.q = false; s.pop.c1 = false; return done();
      case 'psel':
        s.pop.dd = !s.pop.dd; return done();
      case 'psubj':
        s.pop.subj = p[1]; s.pop.dd = false; s.pop.q = false; s.pop.c1 = false; return done();
      case 'pq':
        return this.load(650).then(function () { s.pop.q = true; self.render(); self.flash('.nz-pop tbody'); });
      case 'pc1':
        s.pop.c1 = !s.pop.c1; self.render(); if (s.pop.c1) self.flash('.nz-pop td.copy'); return Promise.resolve();
      case 'psave':
        s.dlg = 'confirm'; return done();
      case 'ok':
        if (s.dlg === 'confirm') {
          s.dlg = null;
          return this.load(800).then(function () { s.pop.saved = true; s.dlg = 'saved'; self.render(); });
        }
        s.dlg = null; return done();
      case 'cancel':
        s.dlg = null; return done();
      case 'pclose':
        s.pop = null; return done();
      default:
        return Promise.resolve();
    }
  };

  NeisApp.prototype.flash = function (sel) {
    if (this.instant) return;
    var els = this.root.querySelectorAll(sel);
    Array.prototype.forEach.call(els, function (e) { e.classList.remove('nz-flash'); void e.offsetWidth; e.classList.add('nz-flash'); });
  };

  /* ── 그리기 ───────────────────── */
  function a(act) { return ' data-act="' + act + '"'; }

  NeisApp.prototype.render = function () {
    var s = this.s, d = this.data, pv = this.prev || {};
    var self = this;
    var E = function (k, on) { return on && !pv[k] && !self.instant ? ' enter' : ''; };
    var h = '';
    h += '<div class="nz-logo"><i>자율<br>균형</i><b>' + d.office + '</b></div>';
    h += '<div class="nz-top"><span class="who">' + d.school + '<span>' + d.teacher + '</span></span><span class="sp"></span>' +
      '<span class="tm">' + I.clock + '59분 58초</span>' +
      '<span class="tb">' + I.out + '로그아웃</span><span class="tb">' + I.book + '튜토리얼</span><span class="tb">' + I.mon + '사용자지원</span>' +
      '<span class="ib">' + I.exp + '</span><span class="ib">' + I.col + '</span></div>';
    h += '<nav class="nz-roles">' + ROLES.map(function (r) {
      return '<button' + a('role:' + r) + (s.role === r ? ' class="on"' : '') + '>' + r + '</button>';
    }).join('') + '</nav>';
    h += '<div class="nz-rail"><span>' + I.user + '</span><span class="on">' + I.menu + '</span><span class="dot">' + I.bell + '</span><span>' + I.find + '</span><span>' + I.star + '</span><span>' + I.gear + '</span></div>';
    h += '<aside class="nz-tree">' + this.tree() + '</aside><span class="nz-fold">◀</span>';
    h += '<section class="nz-main">' + (s.screen === 'home' ? this.home() : this.gyogwa()) + '</section>';
    h += '<div class="nz-tabbar"><span class="home"' + a('home') + '>초기화면</span>' +
      s.tabs.map(function (t) { return '<span class="tab' + (s.screen === t ? ' on' : '') + ((pv.tabs || []).indexOf(t) < 0 && !self.instant ? ' enter' : '') + '">' + t + ' <i>✕</i></span>'; }).join('') +
      '<span class="sp"></span><span class="nav"><span>‹</span><span>›</span><span>✕</span><span>✕</span></span></div>';
    if (s.mega) h += this.mega(E('mega', true));
    if (s.pop) h += '<div class="nz-dim' + E('pop', true) + '"></div>' + this.pop(E('pop', true), E('dd', s.pop.dd));
    if (s.dlg) h += '<div class="nz-dim2' + E('dlg', true) + '"></div>' + this.dlg(s.dlg !== pv.dlg && !self.instant ? ' enter' : '');
    if (s.loading) h += '<div class="nz-load"><div><i><b></b><b></b><b></b></i>로딩 중입니다.</div></div>';
    this.root.innerHTML = h;
    this.prev = { mega: s.mega, pop: !!s.pop, dd: !!(s.pop && s.pop.dd), dlg: s.dlg, tabs: s.tabs.slice() };
  };

  NeisApp.prototype.mega = function (en) {
    return '<div class="nz-mega' + en + '">' + MEGA.map(function (c) {
      return '<div><h4>' + c[0] + '</h4>' + c[1].map(function (it) {
        return '<button' + a('mega:' + c[0] + ':' + it) + '>' + it + '</button>';
      }).join('') + '</div>';
    }).join('') + '</div>';
  };

  NeisApp.prototype.tree = function () {
    var s = this.s;
    if (!s.tree) return '<p class="empty">위쪽 메뉴에서 업무를 고르면<br>여기에 하위 메뉴가 나와요.</p>';
    return TREE[s.tree].map(function (g) {
      var open = !!s.treeOpen[g[0]];
      return '<div class="nz-tg' + (open ? ' open' : '') + '"><button' + a('tg:' + g[0]) + '>' + g[0] + (open ? I.up : I.down) + '</button>' +
        (open && g[1].length ? '<ul>' + g[1].map(function (l) {
          return '<li><button' + a('tree:' + l) + (s.screen === l ? ' class="on"' : '') + '>' + l + '</button></li>';
        }).join('') + '</ul>' : '') + '</div>';
    }).join('');
  };

  NeisApp.prototype.titleRow = function (name, path) {
    return '<div class="nz-title"><h3>' + name + '</h3><span class="sp"></span>' +
      '<span class="nz-crumb">' + I.home + path.map(function (p) { return '<i>›</i>' + p; }).join(' ') + '</span>' +
      '<span class="nz-tools"><span class="t">A</span><span class="t">A</span><span class="grp"><span>' + I.help + '</span><span>' + I.chat + '</span><span>' + I.doc + '</span><span>' + I.tel + '</span><span>' + I.play + '</span><span>' + I.star + '</span></span><span class="txt">조회숨김</span></span></div>';
  };

  NeisApp.prototype.home = function () {
    return '<div class="nz-title"><h3>초기화면</h3></div>' +
      '<div class="nz-home">' +
      '<div class="nz-card"><h5>공지사항</h5><p>2026학년도 1학기 학기말 업무 처리 안내<em>06.17</em></p><p>나이스 정기 점검 안내<em>06.12</em></p><p>학교생활기록부 기재요령 설명 영상 안내<em>04.27</em></p><p>2026학년도 학년초 업무 처리 안내<em>02.13</em></p></div>' +
      '<div class="nz-card"><h5>결재할 문서</h5><span class="big">0</span></div>' +
      '<div class="nz-card"><h5>바로가기</h5><p>학급시간표관리</p><p>출결관리</p><p>학기말종합의견</p></div>' +
      '</div>';
  };

  NeisApp.prototype.band = function () {
    return '<div class="nz-band">' +
      '<div class="nz-f"><label>*학년도</label><span class="nz-sel">2026</span></div>' +
      '<div class="nz-f"><label>*학년</label><span class="nz-sel">' + this.data.grade + '</span></div>' +
      '<div class="nz-f"><label>*반</label><span class="nz-sel">' + this.data.cls + '</span></div>' +
      '<span class="sp"></span><button class="nz-b q"' + a('q') + '>' + I.q + '조회</button></div>';
  };

  NeisApp.prototype.gyogwa = function () {
    var s = this.s, d = this.data;
    var rows = s.q ? d.students.map(function (st, i) {
      return '<tr' + (i === 0 ? ' class="sel"' : '') + '><td><span class="nz-ck"></span></td><td>' + st.no + '</td><td class="l"><span class="lk">' + st.name + '</span></td></tr>';
    }).join('') : '';
    return this.titleRow('교과학습발달상황', ['학급담임', '성적', '학생평가', '교과학습발달상황']) + this.band() +
      '<div style="display:flex;justify-content:flex-end;margin-top:12px"><button class="nz-b nv"' + a('missing') + '>등록누락자조회</button></div>' +
      '<div class="nz-split">' +
        '<div class="nz-list"><div class="nz-bar"><span>Total ' + (s.q ? d.students.length : 0) + '</span><span class="gear">' + I.gear + '</span><span class="sp"></span>' +
          '<button class="nz-b"' + a('bulk') + '>일괄저장</button><button class="nz-b nv"' + a('bulkdel') + '>일괄삭제</button></div>' +
          '<div class="nz-grid"><table><colgroup><col style="width:44px"><col style="width:70px"><col></colgroup><thead><tr><th><span class="nz-ck"></span></th><th>번호</th><th>성명</th></tr></thead>' +
          (s.q ? '<tbody>' + rows + '</tbody></table>' : '</table><div class="nodata"><div>' + I.nodata + '<br>데이터를 조회해 주십시오.</div></div>') + '</div></div>' +
        '<div><div class="nz-bar"><span class="nz-tabs"><span class="on">교과별기록</span><span>통합기록</span></span><span class="sp"></span>' +
          '<button class="nz-b"' + a('ex') + '>예시문</button><button class="nz-b"' + a('edit') + '>평가자료편집입력</button><button class="nz-b"' + a('save1') + '>저장</button><button class="nz-b nv"' + a('del1') + '>삭제</button><button class="nz-b nv"' + a('prt') + '>출력</button></div>' +
          '<div class="nz-grid"><table><colgroup><col style="width:140px"><col></colgroup><thead><tr><th>교과</th><th>성취수준 및 특기사항</th></tr></thead></table>' +
          '<div class="nodata"><div>' + I.nodata + '<br>' + (s.q ? '왼쪽에서 학생을 선택해 주십시오.' : '데이터를 조회해 주십시오.') + '</div></div></div></div>' +
      '</div>';
  };

  NeisApp.prototype.pop = function (en, enDd) {
    var p = this.s.pop, d = this.data;
    var subjBox = p.mode === 'subject'
      ? '<div class="nz-f"><label>*과목</label><span class="nz-sel"' + a('psel') + ' style="position:relative">' + (p.subj || '선택') +
        (p.dd ? '<div class="nz-dd' + enDd + '">' + SUBJ.map(function (x) { return '<button' + a('psubj:' + x) + '>' + x + '</button>'; }).join('') + '</div>' : '') + '</span></div>'
      : '';
    var head, body;
    if (p.mode === 'subject') {
      head = '<colgroup><col style="width:60px"><col style="width:90px"><col style="width:40px"><col><col style="width:40px"><col style="width:150px"><col></colgroup>' +
        '<thead><tr><th>번호</th><th>성명</th><th><span class="nz-ck' + (p.c1 ? ' on' : '') + '"' + a('pc1') + '></span></th><th>1학기 학기말종합의견</th><th><span class="nz-ck"' + a('pc2') + '></span></th><th>2학기 학기말종합의견</th><th>교과학습발달상황</th></tr></thead>';
      body = p.q ? d.students.map(function (st) {
        var t = st.c[p.subj] || st.c['국어'];
        return '<tr><td>' + st.no + '</td><td>' + st.name + '</td><td><span class="nz-ck' + (p.c1 ? ' on' : '') + '"></span></td><td class="txt">' + t + '</td><td><span class="nz-ck"></span></td><td class="txt dim"></td>' +
          '<td class="txt copy' + (p.c1 ? '' : ' dim') + '">' + (p.c1 ? t : '') + '</td></tr>';
      }).join('') : '';
    } else {
      head = '<colgroup><col style="width:60px"><col style="width:90px"><col style="width:90px"><col style="width:40px"><col><col></colgroup><thead><tr><th>번호</th><th>성명</th><th>과목</th><th><span class="nz-ck"></span></th><th>1학기 학기말종합의견</th><th>교과학습발달상황</th></tr></thead>';
      body = '';
    }
    return '<div class="nz-pop' + en + '"><div class="ph">교과학습발달상황-일괄저장<span class="sp"></span><button' + a('pclose') + '>' + I.x + '</button></div>' +
      '<div class="pb"><div class="nz-title"><h3 style="font-size:16px">교과학습발달상황 일괄저장</h3></div>' +
      '<div class="nz-band"><span class="nz-radio"' + a('pmode:student') + '><span class="nz-rd' + (p.mode === 'student' ? ' on' : '') + '"></span>학생별</span>' +
      '<span class="nz-radio"' + a('pmode:subject') + '><span class="nz-rd' + (p.mode === 'subject' ? ' on' : '') + '"></span>과목별</span>' + subjBox +
      '<span class="sp"></span><button class="nz-b q"' + a('pq') + '>' + I.q + '조회</button></div>' +
      '<div class="nz-bar" style="margin-top:8px"><span>Total ' + (p.q ? d.students.length : 0) + '</span></div>' +
      '<div class="nz-grid"><table>' + head + (body ? '<tbody>' + body + '</tbody></table>' : '</table><div class="nodata"><div>' + I.nodata + '<br>데이터를 조회해 주십시오.</div></div>') + '</div></div>' +
      '<div class="pf"><button class="nz-b"' + a('psave') + '>일괄저장</button><button class="nz-b ln"' + a('pclose') + '>닫기</button></div></div>';
  };

  NeisApp.prototype.dlg = function (en) {
    if (this.s.dlg === 'confirm') {
      return '<div class="nz-dlg' + en + '"><b>확인</b><p>저장하시겠습니까?</p><div class="row"><button class="nz-b"' + a('ok') + '>확인</button><button class="nz-b ln"' + a('cancel') + '>취소</button></div></div>';
    }
    return '<div class="nz-dlg' + en + '"><b>알림</b><p>저장되었습니다.</p><div class="row"><button class="nz-b"' + a('ok') + '>확인</button></div></div>';
  };

  window.NeisApp = NeisApp;
})();
