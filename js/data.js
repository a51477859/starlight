/* YULPO STARLIGHT CINEMA — shared data + API (student app and admin use the same file)
 *
 * API_URL empty  → local mode: everything lives in this browser's localStorage (preview / offline draw).
 * API_URL set    → Apps Script web app (stage 7); same function names, data goes to the Google Sheet.
 */
window.YSC = (() => {
  const API_URL = 'https://script.google.com/macros/s/AKfycbz_4FnT2tAWBEL_vnVH9NFxFICVu31Pn-YDThfQZjnJJ1BUbE4fA_KjRSZh1EUvv6lk/exec';

  // ---------- festival content (edit here when anything changes) ----------
  const HALLS = {
    kids: { name: '1부 별빛 키즈시네마', time: '1~3학년 · 16:30', tag: 'FAMILY', theme: '가족과 함께하는 따뜻한 모험', grades: [1, 2, 3] },
    star: { name: '2부 별빛 시네마', time: '4~6학년 · 19:30', tag: 'TOGETHER', theme: '함께라서 가능한 모험', grades: [4, 5, 6] },
  };
  // q: \n marks where the question breaks onto a second line.
  // Candidates confirmed 2026-09-29. Ratings/runtimes: 국내 개봉 정보 (씨네21·위키백과).
  const MOVIES = {
    kids: [
      { id: 'robot', title: '와일드 로봇', en: 'The Wild Robot', rate: '전체관람가', min: 102, genre: '애니메이션 · 모험', c1: '#1E5B45', c2: '#F2B544', obj: 'star-3', r: '14deg',
        log: '무인도에 불시착한 로봇 로즈가 아기 기러기 브라이트빌을 키우며, 야생에서 살아가는 법과 엄마가 되는 법을 배워 간다.',
        points: ['서로 다른 존재가 가족이 되어 가는 이야기', '자연과 동물을 아끼는 마음이 자라요', '그림책 같은 따뜻한 영상미'],
        q: '나를 돌봐 주는 가족에게\n고마운 한마디는?' },
      { id: 'onward', title: '온워드: 단 하루의 기적', en: 'Onward', rate: '전체관람가', min: 102, genre: '애니메이션 · 판타지', c1: '#3B2A7A', c2: '#4FD1C5', obj: 'kernel-2', r: '-10deg',
        log: '마법이 사라진 세상, 엘프 형제 이안과 발리가 아빠를 단 하루 다시 만나기 위해 마법 모험을 떠난다.',
        points: ['형제·자매 사이의 우정을 다시 생각해요', '마법과 모험이 가득한 판타지', '가족을 향한 마음에 뭉클해져요'],
        q: '우리 가족과 함께\n떠나고 싶은 모험은?' },
      { id: 'croods', title: '크루즈 패밀리: 뉴 에이지', en: 'The Croods: A New Age', rate: '전체관람가', min: 95, genre: '애니메이션 · 코미디', c1: '#B4541B', c2: '#FFD34D', obj: 'star-2', r: '8deg',
        log: '동굴 가족 크루즈가 새 보금자리를 찾아 나섰다가, 한층 "발전된" 베터맨 가족을 만나며 벌어지는 소동.',
        points: ['온 가족이 함께 웃을 수 있는 코미디', '서로 달라도 함께 사는 법', '알록달록 신기한 동물과 풍경'],
        q: '우리 가족만의\n특별한 점을 자랑해 주세요' },
    ],
    star: [
      { id: 'tf1', title: '트랜스포머 ONE', en: 'Transformers One', rate: '전체관람가', min: 103, genre: '애니메이션 · SF', c1: '#1B2E5C', c2: '#E23B3B', obj: 'star-3', r: '-12deg',
        log: '옵티머스 프라임과 메가트론이 되기 전, 둘도 없는 친구였던 오라이언 팩스와 D-16의 이야기.',
        points: ['가장 친한 친구가 갈라서기까지의 이야기', '거대한 로봇 액션을 큰 스크린으로', '우정과 선택에 대해 이야기 나눌 거리'],
        q: '친구와의 우정을 지키는\n나만의 방법은?' },
      { id: 'freeguy', title: '프리 가이', en: 'Free Guy', rate: '12세 이상 관람가', min: 115, genre: '액션 · 코미디', c1: '#0F4C81', c2: '#FF7A1A', obj: 'kernel-5', r: '10deg',
        log: '게임 속 배경 캐릭터 가이가 자신이 게임 속 존재라는 걸 깨닫고, 세상을 구하는 주인공이 되기로 한다.',
        points: ['정해진 역할을 넘어서는 용기', '게임 세상 속 기발한 상상력', '친구와 함께라서 가능한 반전'],
        q: '나에게 용기를 준\n친구에게 한마디!' },
      { id: 'jumanji', title: '쥬만지: 새로운 세계', en: 'Jumanji: Welcome to the Jungle', rate: '12세 이상 관람가', min: 118, genre: '액션 · 모험', c1: '#1F5A2B', c2: '#E8B64A', obj: 'star-1', r: '-8deg',
        log: '비디오 게임 쥬만지 속으로 빨려 들어간 고등학생 넷이 전혀 다른 캐릭터가 되어 정글 모험을 떠난다.',
        points: ['서로의 약점을 채워 주는 팀워크', '정글을 누비는 스릴 넘치는 모험', '웃음과 액션이 번갈아 터져요'],
        q: '친구와 한 팀이라서\n해낸 일을 자랑해 주세요' },
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
      return settingsLocal();
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
        robot: ['엄마, 매일 아침 깨워 줘서 고마워요!', '우리 가족은 나의 가장 든든한 로봇이에요', '할머니 사랑해요 오래오래 건강하세요'],
        onward: ['아빠랑 하루 종일 캠핑하고 싶어요', '형이랑 싸우지 않고 하루 놀기!', '돌아가신 할아버지와 산책하고 싶어요'],
        croods: ['우리 가족은 다 같이 노래를 잘 불러요', '우리 집 강아지까지 다섯 식구가 최고!', '동생아 바보라고 해서 미안해'],
        tf1: ['싸워도 먼저 사과하는 게 우정이에요', '비밀을 지켜 주는 친구가 최고의 친구', '서로 다르다는 걸 인정하기!'],
        freeguy: ['모두가 주인공이 되는 학교를 만들고 싶어요', '친구랑 같이라면 월요일도 즐거워요', '쓰레기 없는 운동장으로 바꾸고 싶어요'],
        jumanji: ['체육대회 이어달리기 역전승!', '친구 덕분에 수학 문제를 끝까지 풀었어요', '같이 연습해서 합창대회 1등 했어요'],
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

  return { API_URL, HALLS, MOVIES, DEFAULT_SETTINGS, store, keyOf, movieById, maskName, flagged, isClosed, api, local: !API_URL };
})();
