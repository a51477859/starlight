/* YULPO STARLIGHT CINEMA — admin console
 * Runs either as its own page (admin.html → root = document) or mounted inside index.html
 * (#admin → root = a ShadowRoot holding admin.html's markup and styles, so the two designs never clash).
 */
window.YSCAdmin = (root = document) => {
  const $ = s => root.querySelector(s), $$ = s => [...root.querySelectorAll(s)];
  const layer = root === document ? document.body : root;
  const { HALLS, MOVIES, api, store } = YSC;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = m; layer.appendChild(t); setTimeout(() => t.remove(), 2400); };
  const ss = { get: k => { try { return sessionStorage.getItem(k); } catch { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch {} }, del: k => { try { sessionStorage.removeItem(k); } catch {} } };

  let PW = null, DATA = { entries: [], draws: [], settings: YSC.DEFAULT_SETTINGS }, offline = null;

  // two-step confirm for anything that can't be undone easily
  function armed(btn, label, run) {
    if (btn.dataset.armed) { delete btn.dataset.armed; btn.classList.remove('arm'); btn.textContent = btn.dataset.label; run(); return; }
    btn.dataset.label = btn.textContent; btn.dataset.armed = '1'; btn.classList.add('arm'); btn.textContent = label;
    setTimeout(() => { if (btn.dataset.armed) { delete btn.dataset.armed; btn.classList.remove('arm'); btn.textContent = btn.dataset.label; } }, 4000);
  }

  // ---------- login ----------
  $('#modeHint').textContent = YSC.local
    ? '지금은 로컬 미리보기 모드예요(구글 시트 연결 전). 이 기기에 저장된 데이터만 보여요.'
    : '구글 시트에 연결되어 있어요.';
  $('#modeChip').textContent = YSC.local ? '로컬 미리보기 · 이 기기 데이터' : '구글 시트 연결됨';
  $('#modeChip').classList.toggle('live', !YSC.local);
  $('#demoTools').hidden = !YSC.local;
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const pw = $('#pw').value;
    const btn = $('#loginForm button[type=submit]');
    btn.disabled = true; btn.textContent = '확인 중… (처음엔 5초쯤 걸려요)'; $('#loginErr').textContent = '';
    try { await api.login(pw); PW = pw; ss.set('ysc_admin', pw); btn.textContent = '불러오는 중…'; await enter(); }
    catch (err) { $('#loginErr').textContent = err.code === 'auth' ? '비밀번호가 맞지 않아요.' : '연결이 불안정해요. 잠시 후 다시 시도해 주세요.'; }
    finally { btn.disabled = false; btn.textContent = '들어가기'; }
  });
  const embedded = root !== document;
  if (embedded) $('#backApp').setAttribute('href', '#');
  $('#logout').addEventListener('click', () => {
    ss.del('ysc_admin');
    if (embedded) { history.replaceState(null, '', location.pathname + location.search); }
    location.reload();
  });
  async function enter() { $('#loginView').hidden = true; $('#app').hidden = false; await load(); }
  const saved = ss.get('ysc_admin');
  if (saved) api.login(saved).then(() => { PW = saved; enter(); }).catch(() => ss.del('ysc_admin'));

  async function load() {
    try { DATA = await api.list(PW); } catch (err) { if (err.code === 'auth') { ss.del('ysc_admin'); location.reload(); } toast('불러오지 못했어요'); return; }
    renderAll();
  }
  $('#reload').addEventListener('click', load);

  // ---------- tabs ----------
  $$('.tab').forEach(t => t.addEventListener('click', () => {
    $$('.tab').forEach(x => x.setAttribute('aria-selected', String(x === t)));
    $$('main section').forEach(s => s.hidden = s.id !== 'tab-' + t.dataset.tab);
  }));

  // ---------- derived ----------
  const S = () => DATA.settings;
  const flagsOf = e => YSC.flagged(e.comment || '', S().blocklist || []);
  // in the draw: has a comment, not excluded, and (no blocked word, or an admin explicitly let it in)
  const drawStatus = e => {
    if (!e.comment) return 'none';
    if (e.drawOk === false) return 'out';
    if (flagsOf(e).length && e.drawOk !== 'force') return 'flagged';
    return 'in';
  };
  const byHall = h => DATA.entries.filter(e => e.hall === h);
  const counts = h => { const c = {}; MOVIES[h].forEach(m => c[m.id] = 0); byHall(h).forEach(e => { if (e.movie in c) c[e.movie]++; }); return c; };
  const leader = h => { const c = counts(h); return MOVIES[h].reduce((a, m) => c[m.id] > c[a.id] ? m : a, MOVIES[h][0]); };

  function renderAll() { renderStatus(); renderEntries(); renderDraw(); renderSettings(); }

  // ---------- status ----------
  function renderStatus() {
    const s = S(), all = DATA.entries;
    const closeAt = new Date(s.voteClose);
    const left = closeAt - new Date();
    const dleft = left > 0 ? `D-${Math.floor(left / 864e5)}` : '지남';
    const closeLabel = `투표 마감 · ${closeAt.getMonth() + 1}/${closeAt.getDate()} ${String(closeAt.getHours()).padStart(2, '0')}:${String(closeAt.getMinutes()).padStart(2, '0')}`;
    $('#tiles').innerHTML = [
      [all.length, '총 참여'], [byHall('kids').length, '1부 FAMILY'], [byHall('star').length, '2부 TOGETHER'],
      [all.filter(e => e.comment).length, '한마디 남김'], [all.filter(e => flagsOf(e).length).length, '금칙어 확인 필요'], [dleft, closeLabel]
    ].map(([b, l]) => `<div class="tile"><b>${esc(b)}</b><span>${l}</span></div>`).join('');
    const closed = YSC.isClosed(s);
    $('#voteState').textContent = s.announced ? '상영작 발표됨' : closed ? '마감됨' : '진행 중';
    $('#voteState').className = 'state ' + (closed ? 'closed' : 'on');
    $('#closeInfo').textContent = s.closed ? '관리자가 수동으로 마감했어요' : `마감 예정 ${closeAt.toLocaleString('ko-KR')}`;
    $('#toggleClose').textContent = s.closed ? '투표 다시 열기' : '지금 투표 마감하기';
    $('#toggleClose').disabled = !!s.announced;

    $('#hallCards').innerHTML = ['kids', 'star'].map(h => {
      const c = counts(h), total = byHall(h).length || 1, lead = leader(h), win = s.winners[h];
      const bars = MOVIES[h].map(m => {
        const n = c[m.id], pct = Math.round(n / total * 100);
        return `<div class="bar"><img src="assets/posters/${m.id}.jpg" alt=""><div><div class="t">${esc(m.title)}${m === lead && n ? '<span class="lead">1위</span>' : ''}</div><div class="track"><i style="width:${pct}%"></i></div></div><div class="n">${n}표<small>${byHall(h).length ? pct : 0}%</small></div></div>`;
      }).join('');
      return `<div class="card hallcard">
        <h3>${esc(HALLS[h].name)} <small>${HALLS[h].tag} · ${byHall(h).length}명</small></h3>
        <div class="bars">${bars}</div>
        <div class="announce">
          <div class="row"><b>상영작 발표</b><span class="state ${s.announced ? 'on' : ''}">${s.announced ? '발표됨 · ' + esc(YSC.movieById(win)?.title || '') : '발표 전'}</span></div>
          <div class="row">
            <select data-win="${h}" aria-label="${HALLS[h].name} 상영작">${MOVIES[h].map(m => `<option value="${m.id}" ${(win || lead.id) === m.id ? 'selected' : ''}>${esc(m.title)} (${c[m.id]}표)</option>`).join('')}</select>
          </div>
        </div>
      </div>`;
    }).join('') + `<div class="card" style="display:grid;gap:10px;align-content:start">
        <b style="font-size:17px">상영작 발표 스위치</b>
        <p class="hint" style="margin:0">두 부의 상영작을 위에서 고른 뒤 누르세요. 발표하면 학생 화면이 모두 <b>NOW SHOWING</b>으로 바뀌고, 모든 티켓에 영화 제목이 채워지며 투표는 닫힙니다. 득표수는 학생에게 공개되지 않아요.</p>
        <button class="btn ${s.announced ? '' : 'main'}" id="announceBtn">${s.announced ? '발표 취소하기' : '상영작 발표하기'}</button>
      </div>`;
    $('#announceBtn').addEventListener('click', e => {
      const winners = { kids: $('[data-win="kids"]').value, star: $('[data-win="star"]').value };
      if (s.announced) armed(e.currentTarget, '정말 취소할까요? 한 번 더 누르세요', () => saveSettings({ announced: false }, '발표를 취소했어요'));
      else armed(e.currentTarget, '한 번 더 누르면 발표됩니다', () => saveSettings({ announced: true, winners }, '상영작을 발표했어요'));
    });

    // grade × class table
    const maxCls = Math.max(3, ...all.map(e => e.cls));
    let t = `<thead><tr><th>학년</th>${Array.from({ length: maxCls }, (_, i) => `<th>${i + 1}반</th>`).join('')}<th>합계</th></tr></thead><tbody>`;
    for (let g = 1; g <= 6; g++) {
      const row = Array.from({ length: maxCls }, (_, i) => all.filter(e => e.grade === g && e.cls === i + 1).length);
      t += `<tr><td>${g}학년</td>${row.map(n => `<td class="${n ? '' : 'zero'}">${n}</td>`).join('')}<td><b>${row.reduce((a, b) => a + b, 0)}</b></td></tr>`;
    }
    $('#classTable').innerHTML = t + '</tbody>';
  }
  $('#toggleClose').addEventListener('click', e => {
    const s = S();
    if (s.closed) saveSettings({ closed: false }, '투표를 다시 열었어요');
    else armed(e.currentTarget, '한 번 더 누르면 마감돼요', () => saveSettings({ closed: true }, '투표를 마감했어요'));
  });
  async function saveSettings(patch, msg) {
    try { const r = await api.setSettings(PW, patch); DATA.settings = r.settings; renderAll(); if (msg) toast(msg); }
    catch { toast('저장하지 못했어요'); }
  }

  // ---------- entries ----------
  const hi = (text, flags) => { let h = esc(text); flags.forEach(w => { h = h.split(esc(w)).join(`<mark class="flag">${esc(w)}</mark>`); }); return h; };
  function filtered() {
    const h = $('#fHall').value, q = $('#fText').value.trim(), onlyFlag = $('#fFlag').checked, onlyOut = $('#fOut').checked;
    return DATA.entries.filter(e => (!h || e.hall === h)
      && (!q || [e.name, e.comment, e.ticketNo].some(v => (v || '').includes(q)))
      && (!onlyFlag || flagsOf(e).length)
      && (!onlyOut || ['out', 'flagged'].includes(drawStatus(e))))
      .sort((a, b) => a.grade - b.grade || a.cls - b.cls || a.num - b.num);
  }
  function renderEntries() {
    const list = filtered();
    $('#entryCount').textContent = `${list.length}명 표시 · 전체 ${DATA.entries.length}명`;
    if (!DATA.entries.length) {
      $('#entryRows').innerHTML = `<tr><td colspan="8" class="hint">아직 응모가 없어요. 학생 화면에서 투표하면 여기에 쌓입니다.${YSC.local ? ' 설정 탭의 "예시 응모 채우기"로 시험해 볼 수도 있어요.' : ''}</td></tr>`;
      return;
    }
    $('#entryRows').innerHTML = list.map(e => {
      const st = drawStatus(e), fl = flagsOf(e), key = YSC.keyOf(e);
      const pill = { in: '<span class="pill in">포함</span>', out: '<span class="pill out">제외</span>', flagged: '<span class="pill out">금칙어 제외</span>', none: '<span class="pill none">한마디 없음</span>' }[st];
      const toggle = st === 'none' ? '' : `<button class="btn" data-act="toggle" data-key="${key}">${st === 'in' ? '제외하기' : '포함하기'}</button>`;
      return `<tr>
        <td class="num">${esc(e.ticketNo)}${e.demo ? ' <span class="pill demo">예시</span>' : ''}</td>
        <td>${e.hall === 'kids' ? '1부' : '2부'}</td>
        <td class="num">${e.grade}-${e.cls}-${e.num}</td>
        <td>${esc(e.name)}</td>
        <td>${esc(YSC.movieById(e.movie)?.title || e.movie)}</td>
        <td class="comment">${e.comment ? hi(e.comment, fl) : '<span class="hint">—</span>'}</td>
        <td>${pill}</td>
        <td><div class="entry-actions">${toggle}<button class="btn danger" data-act="del" data-key="${key}">삭제</button></div></td>
      </tr>`;
    }).join('') || '<tr><td colspan="8" class="hint">조건에 맞는 응모가 없어요.</td></tr>';
  }
  ['#fHall', '#fText', '#fFlag', '#fOut'].forEach(s => $(s).addEventListener('input', renderEntries));
  $('#entryRows').addEventListener('click', async ev => {
    const b = ev.target.closest('button[data-act]'); if (!b) return;
    const key = b.dataset.key, e = DATA.entries.find(x => YSC.keyOf(x) === key); if (!e) return;
    if (b.dataset.act === 'toggle') {
      const st = drawStatus(e);
      const drawOk = st === 'in' ? false : (flagsOf(e).length ? 'force' : true);
      try { const r = await api.updateEntry(PW, key, { drawOk }); Object.assign(e, r.entry); renderAll(); } catch { toast('바꾸지 못했어요'); }
    } else {
      armed(b, '정말 삭제', async () => {
        try { await api.deleteEntry(PW, key); DATA.entries = DATA.entries.filter(x => x !== e); renderAll(); toast('삭제했어요. 학생이 다시 투표할 수 있어요'); } catch { toast('삭제하지 못했어요'); }
      });
    }
  });
  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  $('#csv').addEventListener('click', () => {
    const rows = [['티켓번호', '부', '학년', '반', '번호', '이름', '투표 영화', '한마디', '금칙어', '추첨', '제출 시각']];
    filtered().forEach(e => rows.push([e.ticketNo, e.hall === 'kids' ? '1부' : '2부', e.grade, e.cls, e.num, e.name, YSC.movieById(e.movie)?.title || e.movie, e.comment || '', flagsOf(e).join(' '),
      { in: '포함', out: '제외', flagged: '금칙어 제외', none: '한마디 없음' }[drawStatus(e)], new Date(e.ts).toLocaleString('ko-KR')]));
    // a cell starting with = + - @ would run as a formula in Excel; prefix an apostrophe
    const cell = v => { let s = String(v); if (/^[=+\-@]/.test(s)) s = "'" + s; return `"${s.replace(/"/g, '""')}"`; };
    const csv = '﻿' + rows.map(r => r.map(cell).join(',')).join('\r\n');
    download(`별빛영화제_응모목록_${new Date().toISOString().slice(0, 10)}.csv`, csv, 'text/csv;charset=utf-8');
  });

  // ---------- draw tab ----------
  const source = () => offline || DATA;
  const drawsOf = h => source().draws.filter(d => d.hall === h);
  const pool = h => {
    const taken = new Set(drawsOf(h).map(d => d.key));
    return source().entries.filter(e => e.hall === h && drawStatus(e) === 'in' && !taken.has(YSC.keyOf(e)));
  };
  const target = h => S().drawCount[h] || 5;
  const winnersOf = h => drawsOf(h).filter(d => !d.absent);
  function renderDraw() {
    $('#drawCards').innerHTML = ['kids', 'star'].map(h => {
      const ds = drawsOf(h);
      return `<div class="card">
        <h3 style="font-size:17px">${esc(HALLS[h].name)} <span class="hint">· 추첨 후보 ${pool(h).length}명 · 목표 ${target(h)}명</span></h3>
        <ol class="winners">${ds.length ? ds.map(d => `<li class="${d.absent ? 'absent' : ''}">${d.grade}학년 ${d.cls}반 ${esc(d.name)}${d.absent ? ' (불참)' : ''}</li>`).join('') : '<li class="hint" style="list-style:none">아직 뽑지 않았어요</li>'}</ol>
        <div class="switches" style="margin-top:14px">
          <button class="btn main" data-led="${h}">LED 화면 열기</button>
          <button class="btn danger" data-reset="${h}" ${ds.length ? '' : 'disabled'}>추첨 기록 초기화</button>
        </div>
      </div>`;
    }).join('');
    $('#offlineState').textContent = offline ? `불러온 명단 사용 중 (${offline.entries.length}명)` : '';
  }
  $('#drawCards').addEventListener('click', ev => {
    const led = ev.target.closest('[data-led]'), rs = ev.target.closest('[data-reset]');
    if (led) openLed(led.dataset.led);
    if (rs) armed(rs, '한 번 더 누르면 초기화', async () => {
      const h = rs.dataset.reset;
      if (offline) { offline.draws = offline.draws.filter(d => d.hall !== h); saveOffline(); }
      else { try { const r = await api.resetDraws(PW, h); DATA.draws = r.draws; } catch { return toast('초기화하지 못했어요'); } }
      renderDraw(); toast('추첨 기록을 지웠어요');
    });
  });
  $('#exportList').addEventListener('click', () => {
    download(`별빛영화제_추첨명단_${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ exportedAt: new Date().toISOString(), settings: S(), entries: DATA.entries, draws: DATA.draws }), 'application/json');
  });
  const saveOffline = () => store.set('ysc_offline', JSON.stringify(offline));
  $('#importList').addEventListener('change', async ev => {
    const f = ev.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text());
      if (!Array.isArray(j.entries)) throw 0;
      offline = { entries: j.entries, draws: j.draws || [] };
      if (j.settings) DATA.settings = { ...DATA.settings, ...j.settings };
      saveOffline(); renderAll(); toast(`명단 ${j.entries.length}명을 불러왔어요`);
    } catch { toast('명단 파일을 읽지 못했어요'); }
    ev.target.value = '';
  });
  try { offline = JSON.parse(store.get('ysc_offline') || 'null'); } catch {}

  // ---------- settings ----------
  const toLocalInput = iso => { const d = new Date(iso); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
  function renderSettings() {
    const s = S();
    $('#sClose').value = toLocalInput(s.voteClose);
    $('#sReq').checked = !!s.requireComment;
    $('#sDrawK').value = s.drawCount.kids; $('#sDrawS').value = s.drawCount.star;
    $('#sMask').checked = !!s.maskName;
    $('#sBlock').value = (s.blocklist || []).join(', ');
  }
  $('#settingsForm').addEventListener('submit', ev => {
    ev.preventDefault();
    const k = parseInt($('#sDrawK').value, 10), st = parseInt($('#sDrawS').value, 10);
    if (!$('#sClose').value) return $('#settingsErr').textContent = '마감 일시를 넣어 주세요.';
    if (!(k >= 1 && k <= 10 && st >= 1 && st <= 10)) return $('#settingsErr').textContent = '추첨 인원은 1~10명으로 넣어 주세요.';
    $('#settingsErr').textContent = '';
    const d = new Date($('#sClose').value);
    saveSettings({
      voteClose: d.toISOString(), requireComment: $('#sReq').checked, drawCount: { kids: k, star: st }, maskName: $('#sMask').checked,
      blocklist: $('#sBlock').value.split(',').map(w => w.trim()).filter(Boolean)
    }, '설정을 저장했어요');
  });
  $('#seed').addEventListener('click', async () => { const n = YSC.api.seedDemo(); await load(); toast(`예시 응모 ${n}명을 채웠어요`); });
  $('#unseed').addEventListener('click', e => armed(e.currentTarget, '한 번 더 누르면 지워요', async () => { YSC.api.clearDemo(); await load(); toast('예시 데이터를 지웠어요'); }));

  // ================= LED =================
  const led = $('#led'), stage = $('#stage');
  let ledHall = null, current = null, rolling = false, uiTimer = null;
  const nameOnLed = n => S().maskName ? YSC.maskName(n) : n;
  function setState(s) { stage.dataset.s = s; }
  function info() {
    $('#ledInfo').textContent = `${HALLS[ledHall].name} · 당첨 ${winnersOf(ledHall).length}/${target(ledHall)} · 후보 ${pool(ledHall).length}명 · 스페이스바: 다음`;
  }
  function openLed(h) {
    ledHall = h; current = null;
    $('#lHall').textContent = `${HALLS[h].name} · ${HALLS[h].tag}`;
    $('#eHall').textContent = HALLS[h].name;
    setState(winnersOf(h).length >= target(h) ? 'end' : 'intermission');
    led.hidden = false; info(); pokeUI(); sizeFx();
    led.requestFullscreen?.().catch(() => {});
  }
  function closeLed() { led.hidden = true; if (document.fullscreenElement) document.exitFullscreen?.(); renderDraw(); }
  function pokeUI() { led.classList.add('show-ui'); clearTimeout(uiTimer); uiTimer = setTimeout(() => led.classList.remove('show-ui'), 2600); }
  led.addEventListener('pointermove', pokeUI);

  async function next() {
    if (rolling) return;
    const s = stage.dataset.s;
    if (s === 'intermission') return roll();
    if (s === 'winner') { showReveal(); return; }
    if (s === 'reveal') { return winnersOf(ledHall).length >= target(ledHall) ? setState('end') : roll(); }
    if (s === 'end') return;
  }
  function roll() {
    const cands = pool(ledHall);
    if (!cands.length) { toast('더 뽑을 후보가 없어요'); setState('end'); return; }
    const pick = cands[crypto.getRandomValues(new Uint32Array(1))[0] % cands.length];
    setState('roll'); rolling = true;
    const slot = $('#slot');
    const dur = reduce ? 400 : 3200, t0 = performance.now();
    let lastSwap = 0;
    const tick = now => {
      const p = Math.min(1, (now - t0) / dur);
      const gap = 40 + 380 * p * p;   // names slow down as the drum roll ends
      if (now - lastSwap > gap && p < 1) {
        const r = cands[(Math.random() * cands.length) | 0];
        slot.innerHTML = `${esc(nameOnLed(r.name))}<small>${r.grade}학년 ${r.cls}반</small>`;
        lastSwap = now;
      }
      if (p < 1) return requestAnimationFrame(tick);
      rolling = false; showWinner(pick);
    };
    requestAnimationFrame(tick);
  }
  async function showWinner(e) {
    current = e;
    $('#wWho').textContent = `${e.grade}학년 ${e.cls}반`;
    $('#wName').textContent = nameOnLed(e.name);
    setState('winner'); burst(); info();
    const draw = { hall: ledHall, key: YSC.keyOf(e), ticketNo: e.ticketNo, name: e.name, grade: e.grade, cls: e.cls, num: e.num, order: drawsOf(ledHall).length + 1, demo: !!e.demo };
    if (offline) { offline.draws.push({ ...draw, at: new Date().toISOString() }); saveOffline(); }
    else { try { const r = await api.addDraw(PW, draw); DATA.draws = r.draws; } catch { toast('당첨 기록을 저장하지 못했어요. 화면의 이름을 메모해 두세요'); DATA.draws.push(draw); } }
    info();
  }
  function showReveal() {
    const e = current; if (!e) return;
    const m = YSC.movieById(e.movie);
    $('#rQ').textContent = m ? m.q : '';
    $('#rText').textContent = e.comment;
    $('#rBy').textContent = `${e.grade}학년 ${e.cls}반 ${nameOnLed(e.name)}`;
    setState('reveal');
  }
  async function markAbsent() {
    if (!current || !['winner', 'reveal'].includes(stage.dataset.s)) return toast('당첨 화면에서 누를 수 있어요');
    const key = YSC.keyOf(current);
    const list = offline ? offline.draws : DATA.draws;
    const d = [...list].reverse().find(x => x.key === key && x.hall === ledHall);
    if (d) d.absent = true;
    if (offline) saveOffline();
    else if (YSC.local) store.set('ysc_draws', JSON.stringify(DATA.draws));
    else { try { const r = await api.addDraw(PW, { hall: ledHall, key, absentMark: true }); DATA.draws = r.draws; } catch { toast('불참 기록을 저장하지 못했어요'); } }
    current = null; info(); roll();
  }
  $('#lNext').addEventListener('click', next);
  $('#lAbsent').addEventListener('click', markAbsent);
  $('#lInter').addEventListener('click', () => { if (!rolling) setState('intermission'); });
  $('#lClose').addEventListener('click', closeLed);
  $('#lFull').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : led.requestFullscreen?.());
  stage.addEventListener('click', next);
  addEventListener('keydown', e => {
    if (led.hidden) return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter' || e.key === 'PageDown') { e.preventDefault(); next(); }
    if (e.key === 'Escape') closeLed();
    if (e.key.toLowerCase() === 'f') led.requestFullscreen?.();
  });

  // popcorn + stars burst on the LED (same sprites as the intro)
  const fx = $('#ledfx'), fctx = fx.getContext('2d'); let FW = 0, FH = 0; const parts = [];
  const sprites = { k: [], s: [] };
  const loadImg = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  Promise.all([1, 2, 3, 4, 5, 6].map(n => loadImg(`assets/img/kernel-${n}.png`))).then(a => sprites.k = a.filter(Boolean));
  Promise.all([1, 2, 3].map(n => loadImg(`assets/img/star-${n}.png`))).then(a => sprites.s = a.filter(Boolean));
  function sizeFx() { const r = stage.getBoundingClientRect(); const d = Math.min(devicePixelRatio || 1, 2); FW = r.width; FH = r.height; fx.width = FW * d; fx.height = FH * d; fctx.setTransform(d, 0, 0, d, 0, 0); }
  addEventListener('resize', () => { if (!led.hidden) sizeFx(); });
  document.addEventListener('fullscreenchange', () => setTimeout(sizeFx, 60));
  const rnd = (a, b) => a + Math.random() * (b - a);
  function burst() {
    if (reduce) return;
    const u = FW / 1000;
    for (const side of [-1, 1]) for (let i = 0; i < 34; i++) {
      const star = Math.random() < .25, set = star ? sprites.s : sprites.k; if (!set.length) continue;
      parts.push({ img: set[(Math.random() * set.length) | 0], x: FW / 2 + side * FW * .42, y: FH + 20, vx: -side * rnd(120, 520) * u, vy: -rnd(700, 1250) * u,
        rot: rnd(0, 6), vr: rnd(-8, 8), size: rnd(star ? 26 : 38, star ? 52 : 80) * u, g: 1300 * u });
    }
  }
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    fctx.clearRect(0, 0, FW, FH);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.y > FH + 150) { parts.splice(i, 1); continue; }
      fctx.save(); fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      const h = p.size * p.img.height / p.img.width; fctx.drawImage(p.img, -p.size / 2, -h / 2, p.size, h); fctx.restore();
    }
    requestAnimationFrame(loop);
  })(last);
};
// standalone admin.html boots itself; index.html mounts it on #admin instead
if (!window.YSC_EMBED_ADMIN && document.getElementById('loginView')) window.YSCAdmin(document);
