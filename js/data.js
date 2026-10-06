/* YULPO STARLIGHT CINEMA — shared data + API (student app and admin use the same file)
 *
 * API_URL empty  → local mode: everything lives in this browser's localStorage (preview / offline draw).
 * API_URL set    → Apps Script web app (stage 7); same function names, data goes to the Google Sheet.
 */
window.YSC = (() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbz_4FnT2tAWBEL_vnVH9NFxFICVu31Pn-YDThfQZjnJJ1BUbE4fA_KjRSZh1EUvv6lk/exec';
  const ASSET_V = '58e03162';   // build.ps1 replaces this with a fingerprint of assets/posters, so changed posters skip old caches
  const posterUrl = id => `assets/posters/${id}.jpg?v=${ASSET_V}`;

  // ---------- festival content (edit here when anything changes) ----------
  const HALLS = {
    kids: { name: '1부 별빛 키즈시네마', time: '1~3학년 · 16:30', tag: 'FAMILY', theme: '가족과 함께하는 따뜻한 모험', grades: [1, 2, 3] },
    star: { name: '2부 별빛 시네마', time: '4~6학년 · 19:30', tag: 'TOGETHER', theme: '함께라서 가능한 모험', grades: [4, 5, 6] },
  };
  // q: \n marks where the question breaks onto a second line.
  // Candidates confirmed 2026-10-06. Ratings/runtimes: 국내 개봉 정보 (씨네21·위키백과).
  // Posters: assets/posters/<id>.jpg (공식 포스터, 교내 한정 사용).
  // ids are free-form (lowercase letters/digits); the server accepts any id, so changing films never needs an Apps Script edit.
  const MOVIES = {
    kids: [
      { id: 'paddington', title: '패딩턴: 페루에 가다!', en: 'Paddington in Peru', rate: '전체관람가', min: 106, genre: '어드벤처 · 가족', c1: '#1F4E8C', c2: '#E8A33D', obj: 'star-3', r: '14deg',
        log: '페루의 곰 요양원에서 사라진 루시 숙모를 찾기 위해, 패딩턴과 브라운 가족이 아마존 정글로 모험을 떠난다.',
        points: ['온 가족이 함께 떠나는 정글 대모험', '웃음이 끊이지 않는 패딩턴의 소동', '친절한 마음은 늘 통한다는 따뜻한 메시지'],
        q: '우리 가족과 함께\n떠나고 싶은 모험은?' },
      { id: 'coco', title: '코코', en: 'Coco', rate: '전체관람가', min: 105, genre: '애니메이션 · 음악', c1: '#5B2A86', c2: '#FF8A3D', obj: 'kernel-2', r: '-10deg',
        log: '음악을 사랑하는 소년 미겔이 신비로운 "죽은 자들의 세상"에 들어가, 가족에 얽힌 비밀과 진짜 소중한 것을 알게 된다.',
        points: ['가족의 소중함을 느끼게 하는 감동', '귀에 쏙 들어오는 신나는 노래', '알록달록 빛나는 환상적인 세상'],
        q: '오래오래 기억하고 싶은\n우리 가족의 추억은?' },
      { id: 'walle', title: '월-E', en: 'WALL·E', rate: '전체관람가', min: 104, genre: '애니메이션 · SF', c1: '#0E3A5C', c2: '#F2B544', obj: 'star-2', r: '8deg',
        log: '텅 빈 지구에서 홀로 쓰레기를 치우던 작은 로봇 월-E가, 탐사 로봇 이브를 따라 우주로 모험을 떠난다.',
        points: ['대사가 거의 없어도 마음이 전해지는 이야기', '지구를 아끼는 마음이 자라요', '우주를 누비는 신나는 모험'],
        q: '우리 가족이 함께\n지구를 위해 할 수 있는 일은?' },
    ],
    star: [
      { id: 'wonder', title: '원더', en: 'Wonder', rate: '전체관람가', min: 113, genre: '드라마 · 가족', c1: '#1B3A6B', c2: '#5BC0EB', obj: 'star-3', r: '-12deg',
        log: '남들과 조금 다른 얼굴로 태어난 소년 어기가 처음 학교에 가면서, 친구들과 함께 용기와 친절을 배워 간다.',
        points: ['"옳음과 친절 중에 친절을 택하라" 마음을 울리는 메시지', '진짜 친구가 되어 가는 과정', '우리 반 이야기 같은 공감'],
        q: '친구에게 받은 친절 중\n가장 고마웠던 순간은?' },
      { id: 'soul', title: '소울', en: 'Soul', rate: '전체관람가', min: 101, genre: '애니메이션 · 음악', c1: '#1D2A6B', c2: '#4FD1C5', obj: 'kernel-5', r: '10deg',
        log: '꿈의 무대를 앞두고 영혼의 세계에 떨어진 음악 선생님 조, 그곳에서 만난 영혼 22와 함께 지구로 돌아갈 방법을 찾는다.',
        points: ['나를 설레게 하는 "불꽃"은 무엇일까?', '함께하며 서로를 바꿔 가는 두 주인공', '재즈 음악과 신비로운 영혼의 세계'],
        q: '친구와 함께할 때\n가장 신나는 순간은?' },
      { id: 'king', title: '왕과 사는 남자', en: "The King's Warden", rate: '12세 이상 관람가', min: 117, genre: '사극 · 드라마', c1: '#3B2A1A', c2: '#C8A35A', obj: 'star-1', r: '-8deg',
        log: '왕위를 빼앗기고 강원도 산골로 유배된 어린 왕 단종과, 그를 돌보게 된 마을 촌장 엄흥도의 특별한 우정.',
        points: ['신분을 넘어선 따뜻한 우정', '교과서 속 역사를 생생하게', '1,600만 명이 넘게 본 화제작'],
        q: '힘들 때 곁을 지켜 준\n친구에게 한마디!' },
    ],
  };

  // Settings that the admin screen changes (sheet tab "Settings" in stage 7)
  const DEFAULT_SETTINGS = {
    date: '10월 23일 (금)', showDate: '2026.10.23 FRI', place: '학교 체육관 · YULPO CINEMA',
    voteClose: '2026-10-20T18:00:00+09:00',  // 투표 마감 10/20(화) 18:00
    closed: false,                          // 관리자가 누르는 "투표 마감" 스위치
    announced: false,                       // "상영작 발표" 스위치
    winners: { kids: null, star: null },     // 발표한 상영작 id
    requireComment: false,                  // 한마디 필수 여부
    drawCount: { kids: 5, star: 5 },         // 부별 추첨 인원
    maskName: true,                         // LED에 이름 가리기 (김○은)
    blocklist: ['바보', '멍청', '시발', '씨발', 'ㅅㅂ', '병신', 'ㅂㅅ', '개새', '지랄', '존나', '졸라', '꺼져', '죽어', '닥쳐'],
  };
  const LOCAL_ADMIN_PW = '7859';             // local preview only — stage 7 moves the check into Apps Script (Settings sheet)

  // ---------- helpers ----------
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    json(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? fb; } catch { return fb; } },
  };
  const keyOf = e => `${e.grade}-${e.cls}-${e.num}`;
  const movieById = id => [...MOVIES.kids, ...MOVIES.star].find(m => m.id === id);
  const maskName = n => n.length <= 1 ? n : n.length === 2 ? n[0] + '○' : n[0] + '○'.repeat(n.length - 2) + n[n.length - 1];
  const flagged = (text, list) => list.filter(w => w && text.includes(w));
  function makeTicketNo(e) {
    const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let tail = ''; for (let i = 0; i < 3; i++) tail += abc[(Math.random() * abc.length) | 0];
    return `${e.hall === 'kids' ? 'F' : 'T'}${e.grade}${String(e.cls).padStart(2, '0')}${String(e.num).padStart(2, '0')}-${tail}`;
  }
  const settingsLocal = () => {
    const s = { ...DEFAULT_SETTINGS, ...store.json('ysc_settings', {}) };
    s.winners = { ...DEFAULT_SETTINGS.winners, ...(s.winners || {}) };
    s.drawCount = { ...DEFAULT_SETTINGS.drawCount, ...(s.drawCount || {}) };
    return s;
  };
  const isClosed = s => s.closed || s.announced || new Date() >= new Date(s.voteClose);

  // ---------- local implementation (mirrors what Apps Script will do) ----------
  const L = {
    entries: () => store.json('ysc_entries', {}),
    saveEntries: m => store.set('ysc_entries', JSON.stringify(m)),
    draws: () => store.json('ysc_draws', []),
    saveDraws: d => store.set('ysc_draws', JSON.stringify(d)),
    guard(pw) { if (pw !== (settingsLocal().adminPw || LOCAL_ADMIN_PW)) throw Object.assign(new Error('비밀번호가 맞지 않아요'), { code: 'auth' }); },
  };

  async function post(body) {
    // text/plain avoids a CORS preflight, which Apps Script web apps don't answer
    const r = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error('network');
    const j = await r.json();
    if (j.error === 'auth') throw Object.assign(new Error('비밀번호가 맞지 않아요'), { code: 'auth' });
    if (j.error) throw new Error(j.message || j.error);
    return j;
  }

  const api = {
    // ----- student -----
    async settings() {
      if (API_URL) return { ...DEFAULT_SETTINGS, ...(await post({ action: 'settings' })) };
      const s = settingsLocal(), c = { kids: 0, star: 0, total: 0 };   // local preview: count this browser's entries
      Object.values(L.entries()).forEach(e => { if (e.hall in c) { c[e.hall]++; c.total++; } });
      return { ...s, counts: c };
    },
    async submit(e) {
      if (API_URL) return post({ action: 'submit', ...e });
      if (isClosed(settingsLocal())) return { status: 'closed' };
      const map = L.entries(), k = keyOf(e), prev = map[k];
      if (prev) return prev.name === e.name ? { status: 'exists', entry: prev } : { status: 'conflict' };
      const entry = { ...e, ticketNo: makeTicketNo(e), ts: new Date().toISOString(), drawOk: true };
      map[k] = entry; L.saveEntries(map);
      return { status: 'ok', entry };
    },
    async find(q) {
      if (API_URL) return post({ action: 'find', ...q });
      const prev = L.entries()[keyOf(q)];
      return prev && prev.name === q.name ? { status: 'ok', entry: prev } : { status: 'notfound' };
    },

    // ----- admin (every call carries the password) -----
    async login(pw) {
      if (API_URL) return post({ action: 'login', pw });
      L.guard(pw); return { ok: true };
    },
    async list(pw) {
      if (API_URL) return post({ action: 'list', pw });
      L.guard(pw); return { entries: Object.values(L.entries()), draws: L.draws(), settings: settingsLocal() };
    },
    async setSettings(pw, patch) {
      if (API_URL) return post({ action: 'setSettings', pw, patch });
      L.guard(pw);
      const next = { ...store.json('ysc_settings', {}), ...patch };
      store.set('ysc_settings', JSON.stringify(next)); return { settings: settingsLocal() };
    },
    async updateEntry(pw, key, patch) {
      if (API_URL) return post({ action: 'updateEntry', pw, key, patch });
      L.guard(pw); const m = L.entries(); if (!m[key]) return { status: 'notfound' };
      m[key] = { ...m[key], ...patch }; L.saveEntries(m); return { status: 'ok', entry: m[key] };
    },
    async deleteEntry(pw, key) {
      if (API_URL) return post({ action: 'deleteEntry', pw, key });
      L.guard(pw); const m = L.entries(); delete m[key]; L.saveEntries(m); return { status: 'ok' };
    },
    async addDraw(pw, draw) {
      if (API_URL) return post({ action: 'addDraw', pw, draw });
      L.guard(pw); const d = L.draws(); d.push({ ...draw, at: new Date().toISOString() }); L.saveDraws(d); return { draws: d };
    },
    async resetDraws(pw, hall) {
      if (API_URL) return post({ action: 'resetDraws', pw, hall });
      L.guard(pw); const d = L.draws().filter(x => x.hall !== hall); L.saveDraws(d); return { draws: d };
    },

    // ----- local preview helpers (never touch the real sheet) -----
    seedDemo() {
      const m = L.entries();
      const sur = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신'];
      const given = ['하늘', '서준', '지우', '도윤', '하린', '시우', '서아', '이준', '다온', '예린', '주원', '윤슬', '태오', '나은', '로운', '가온'];
      const lines = {
        paddington: ['온 가족이 제주도 오름에 올라가 보고 싶어요', '아빠랑 바다에서 캠핑하기!', '동생이랑 정글 탐험 놀이 하고 싶어요'],
        coco: ['할머니랑 처음 바다에 간 날', '가족 노래방에서 다 같이 노래한 날', '동생아 바보라고 해서 미안해, 그날 웃던 거 기억해'],
        walle: ['장 볼 때 장바구니 들고 가기', '다 같이 분리수거 꼼꼼하게 하기', '가까운 곳은 걸어서 가기!'],
        wonder: ['전학 온 날 먼저 말 걸어 준 친구', '넘어졌을 때 손 내밀어 준 친구', '준비물 빌려준 짝꿍 고마워!'],
        soul: ['쉬는 시간에 같이 피구할 때!', '하교하면서 수다 떨 때', '같이 떡볶이 먹을 때가 최고'],
        king: ['전학 와서 외로울 때 같이 놀아 줘서 고마워', '시험 망쳤을 때 위로해 준 친구야 고마워', '언제나 내 편이 되어 줘서 고마워'],
      };
      let n = 0;
      for (const hall of ['kids', 'star']) for (const grade of HALLS[hall].grades) for (let cls = 1; cls <= 3; cls++) for (let num = 1; num <= 6; num++) {
        if (Math.random() < .25) continue;
        const mv = MOVIES[hall][Math.random() < .45 ? 0 : Math.random() < .55 ? 1 : 2];
        const e = { hall, grade, cls, num, name: sur[(Math.random() * sur.length) | 0] + given[(Math.random() * given.length) | 0], movie: mv.id,
          comment: Math.random() < .8 ? lines[mv.id][(Math.random() * 3) | 0] : '', demo: true, drawOk: true,
          ts: new Date(Date.now() - Math.random() * 6 * 864e5).toISOString() };
        e.ticketNo = makeTicketNo(e);
        const k = keyOf(e); if (!m[k]) { m[k] = e; n++; }
      }
      L.saveEntries(m); return n;
    },
    clearDemo() {
      const m = L.entries(); for (const k of Object.keys(m)) if (m[k].demo) delete m[k];
      L.saveEntries(m); L.saveDraws(L.draws().filter(d => !d.demo));
    },
  };

  return { API_URL, posterUrl, HALLS, MOVIES, DEFAULT_SETTINGS, store, keyOf, movieById, maskName, flagged, isClosed, api, local: !API_URL };
})();
