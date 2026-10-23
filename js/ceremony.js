/* YULPO STARLIGHT CINEMA — opening ceremony slides (개회식 식순), inside the admin console
 * Order: 식 전 안내(auto-rotating) → 환영 → 국민의례 → 교장 선생님 말씀 → 영화제 시작(countdown) → black.
 * From the black screen: M opens the hall's movie in a new tab, D jumps straight to that hall's LED draw.
 * Art: assets/ceremony/*.jpg (Codex, matched to the key visual). Music: assets/audio/anthem.mp3 (국민의례).
 */
window.YSCCeremony = ({ $, $$, HALLS, S, openLed, reduce }) => {
  // movies are played from the teacher's own logged-in streaming accounts
  const MOVIE_LINK = {
    kids: { svc: '웨이브', url: 'https://www.wavve.com/player/movie?movieid=MV_CF01_SY0000011825' },
    star: { svc: '왓챠', url: 'https://watcha.com/watch/m5ZlLw9?ms=basic' },
  };
  // map: 'wc' | 'exit' draws the 2층 강당(=체육관) sketch instead of a picture (layout from the event floor plan:
  // screen on the left wall, the only door on the balloon-arch side). Stair positions are not drawn — only "가까운 계단".
  const NOTICES = [
    { k: 'PHOTO ZONE', img: 'photozone', short: '레드카펫 · 포토존', sec: 9, title: '레드카펫과<br><em>대형 포토존</em>',
      body: '입구 레드카펫과 대형 포토존에서 가족, 친구와 함께 오늘의 별빛 추억을 남겨 보세요.' },
    { k: 'RESTROOM', map: 'wc', short: '화장실 위치 안내', sec: 13, title: '화장실은<br>출입구 나가서<br><em>왼쪽 복도</em>',
      route: '<span class="no">강당 화장실</span><i>✕</i><span>출입구로 나가기</span><i>→</i><span class="go">← 왼쪽 복도</span>' },
    { k: 'SEATING', img: 'seats', short: '앞자리부터 착석', sec: 9, title: '<em>앞자리부터</em><br>앉아 주세요',
      body: '뒤에 오시는 분들을 위해 앞줄부터 빈자리 없이 채워 주세요.' },
    { k: 'EMERGENCY', map: 'exit', short: '비상시 대피로', sec: 13, title: '비상시에는<br><em class="g">운동장</em>으로',
      route: '<span>출입구로 나가기</span><i>→</i><span>가까운 계단으로 나눠서</span><i>→</i><span class="safe">운동장 집결</span>',
      body: '뛰지 말고, 선생님 안내에 따라 질서 있게 이동해요.' },
    { k: 'STAR EVENT', img: 'giftbox', short: '영화 중간 추첨 이벤트', sec: 9, title: '영화 중간에<br><em>추첨 이벤트</em>가 있어요',
      body: '별빛 한마디를 남긴 친구 중에서 뽑아요. 끝까지 자리를 지켜 주세요!' },
  ];
  // top-down sketch of the 2층 강당: corridor on top, door at top-centre, screen on the left wall
  function hallMap(kind) {
    const seats = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 9; c++) seats.push(`<rect x="${132 + c * 21}" y="${150 + r * 21}" width="13" height="11" rx="3"/>`);
    const wc = kind === 'wc';
    const path = wc ? 'M226 214 V172 H200 V44 H58' : 'M226 214 V172 H200 V44';
    return `<svg class="hmap ${kind}" viewBox="0 0 400 300" role="img" aria-label="${wc ? '화장실 가는 길 약도' : '비상 대피로 약도'}">
      <rect class="hall" x="40" y="86" width="320" height="200" rx="10"/>
      <rect class="corr" x="10" y="20" width="380" height="48" rx="10"/><text class="lbl" x="${wc ? 300 : 110}" y="${wc ? 50 : 83}" text-anchor="middle">2층 복도</text>
      <rect class="scr" x="50" y="104" width="9" height="162" rx="3"/><text class="lbl sm" transform="translate(80 185) rotate(-90)" text-anchor="middle">스크린</text>
      <g class="seat">${seats.join('')}</g>
      <rect class="door" x="178" y="80" width="44" height="12" rx="3"/><text class="lbl gold" x="236" y="116">출입구</text>
      <circle class="bal" cx="170" cy="80" r="6"/><circle class="bal" cx="230" cy="80" r="6"/>
      <text class="lbl dim" x="200" y="280" text-anchor="middle">2층 강당 (체육관)</text>
      <path class="route" d="${path}"/>
      ${wc
        ? `<g class="dest" transform="translate(40 44)"><circle r="22"/><text y="6" text-anchor="middle">WC</text></g><text class="lbl gold" x="40" y="10" text-anchor="middle">화장실</text>`
        : `<path class="route" d="M200 44 H350"/><path class="route" d="M200 44 H50"/>
           <g class="dest" transform="translate(32 44)"><circle r="22"/><text y="6" text-anchor="middle">계단</text></g>
           <g class="dest" transform="translate(368 44)"><circle r="22"/><text y="6" text-anchor="middle">계단</text></g>`}
      <g class="here" transform="translate(226 214)"><circle r="11"/><circle class="ping" r="11"/></g>
      <text class="lbl here-t" x="244" y="240">지금 여기</text>
    </svg>`;
  }

  const cer = $('#cer'), stage = $('#cstage');
  let hall = 'kids', slides = [], idx = 0, uiTimer = null;

  // ---------- 태극기: drawn from the official proportions (국기법 시행령), never from a picture ----------
  // 3:2 field, taegeuk diameter = ½ height; trigrams sit on the diagonals ¼ diameter away,
  // bar length ½ D, bar width D/12, gaps D/24, broken-bar gap D/12. 건 top-left, 감 top-right, 리 bottom-left, 곤 bottom-right.
  (function drawFlag() {
    const W = 300, H = 200, R = 50, D = 100, cx = W / 2, cy = H / 2;
    const a = Math.atan2(H, W) * 180 / Math.PI;   // 33.69°
    const bar = D / 12, gap = D / 24, len = D / 2, r0 = R + D / 4;
    // one trigram, drawn pointing along +x, then turned onto its diagonal (1 = solid bar, 0 = broken)
    const tri = (deg, bars) => `<g transform="rotate(${deg})">${bars.map((solid, i) => {
      const x = r0 + i * (bar + gap), half = len / 2 - D / 24;
      return solid
        ? `<rect x="${x}" y="${-len / 2}" width="${bar}" height="${len}"/>`
        : `<rect x="${x}" y="${-len / 2}" width="${bar}" height="${half}"/><rect x="${x}" y="${D / 24}" width="${bar}" height="${half}"/>`;
    }).join('')}</g>`;
    $('#flag').innerHTML = `<rect width="${W}" height="${H}" fill="#fff"/>
      <g transform="translate(${cx} ${cy})">
        <g transform="rotate(${a})">
          <circle r="${R}" fill="#0047A0"/>
          <path fill="#CD2E3A" d="M${-R} 0A${R} ${R} 0 0 1 ${R} 0A${R / 2} ${R / 2} 0 0 0 0 0A${R / 2} ${R / 2} 0 0 1 ${-R} 0Z"/>
        </g>
        <g fill="#000">
          ${tri(180 + a, [1, 1, 1])}${tri(-a, [0, 1, 0])}${tri(180 - a, [1, 0, 1])}${tri(a, [0, 0, 0])}
        </g>
      </g>`;
  })();

  // titles: one span per letter so they can drop in one by one
  $$('#cer [data-split]').forEach(h => {
    let i = 0;
    h.innerHTML = [...h.textContent].map(c => c === ' ' ? '<span class="ch sp"> </span>' : `<span class="ch" style="--i:${i++}">${c}</span>`).join('');
  });
  // staggered entrance for the rest of each slide's copy
  $$('#cer .cw-copy > :not(h1), #cer .sp-copy > *, #cer .st-copy > :not(h1), #cer .ca-head').forEach(el => {
    const sib = [...el.parentElement.children].indexOf(el);
    el.style.setProperty('--d', (.2 + sib * .35).toFixed(2));
  });

  // ---------- slides ----------
  const order = () => ['lobby', 'welcome', 'anthem', 'speech', 'start'];
  const sec = k => $(`#cer .cs[data-k="${k}"]`);
  const NAMES = { lobby: '식 전 안내', welcome: '환영 인사', anthem: '국민의례', speech: '교장 선생님 말씀', start: '별빛 영화제 시작' };

  function show(i) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    const prevK = slides[idx];
    if (prevK === 'anthem' && slides[i] !== 'anthem') stopAnthem();
    if (prevK === 'start') resetStart();
    idx = i; const k = slides[i];
    $$('#cer .cs').forEach(s => {
      const on = s.dataset.k === k;
      if (on && !s.classList.contains('on')) { s.classList.remove('on'); void s.offsetWidth; }   // replay entrance
      s.classList.toggle('on', on);
    });
    if (k === 'lobby') startLobby(); else stopLobby();
    if (k === 'anthem') sec('anthem').dataset.step = '0';
    if (k === 'welcome') { window.SFX?.curtain(); window.SFX?.twinkle(.4, 1.2); }
    if (k === 'speech') window.SFX?.twinkle(.3, .4);
    if (k === 'start') window.SFX?.woosh(.5);
    stage.classList.remove('black');
    info();
  }
  function next() {
    const k = slides[idx];
    if (k === 'anthem') {
      const st = +sec('anthem').dataset.step;
      if (st === 0) return playAnthem();
      if (st === 1) return armSkip();
    }
    if (k === 'start') {
      const st = +sec('start').dataset.step;
      if (st === 0) return countdown();
      if (st === 1) return;
      return openMovie();
    }
    if (idx < slides.length - 1) show(idx + 1);
  }
  function prev() {
    const k = slides[idx];
    if (k === 'anthem' && sec('anthem').dataset.step !== '0') { stopAnthem(); sec('anthem').dataset.step = '0'; return info(); }
    if (k === 'start' && sec('start').dataset.step !== '0') { resetStart(); return info(); }
    if (idx > 0) show(idx - 1);
  }

  // ---------- 0. lobby ----------
  let lbTimer = null, clockTimer = null, nIdx = 0;
  function paintNotice(n) {
    nIdx = (n + NOTICES.length) % NOTICES.length;
    const it = NOTICES[nIdx];
    $('#lbCard').classList.toggle('is-map', !!it.map);
    $('#lbCard').innerHTML = `<div class="art swap">${it.map ? hallMap(it.map) : `<img src="assets/ceremony/${it.img}.jpg" alt="">`}</div>
      <div class="copy"><div class="k">${it.k}</div><h3>${it.title}</h3>${it.body ? `<p>${it.body}</p>` : ''}${it.route ? `<div class="route">${it.route}</div>` : ''}</div>`;
    $$('#lbList li').forEach((li, i) => { li.classList.remove('on'); if (i === nIdx) { void li.offsetWidth; li.classList.add('on'); } });
    clearTimeout(lbTimer); lbTimer = setTimeout(() => paintNotice(nIdx + 1), it.sec * 1000);   // map slides stay up longer
  }
  function startLobby() {
    stopLobby(); paintNotice(0); tickClock();
    clockTimer = setInterval(tickClock, 1000);
  }
  function stopLobby() { clearTimeout(lbTimer); clearInterval(clockTimer); }
  function tickClock() {
    const m = /(\d{1,2}):(\d{2})/.exec(HALLS[hall].time); if (!m) return;
    const t = new Date(); t.setHours(+m[1], +m[2], 0, 0);
    const left = Math.round((t - Date.now()) / 1000);
    $('#lbTime').textContent = `${HALLS[hall].name.replace(/^\d부\s*/, '')} · ${m[0]} 시작`;
    if (left > 0) {
      const h = Math.floor(left / 3600), mm = Math.floor(left % 3600 / 60), ss = left % 60;
      $('#lbCountL').textContent = 'SHOW STARTS IN';
      $('#lbCount').textContent = (h ? h + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(ss).padStart(2, '0');
    } else { $('#lbCountL').textContent = 'STARTING SOON'; $('#lbCount').textContent = '곧 시작'; }
  }
  $('#lbList').innerHTML = NOTICES.map((n, i) => `<li style="--len:${n.sec}s"><b>0${i + 1}</b>${n.short}</li>`).join('');
  const tick = NOTICES.map(n => `<span>★ <i>${n.k}</i> ${n.short}</span>`).join('') + '<span>★ <i>ENJOY</i> 별빛 영화제에 오신 것을 환영합니다</span>';
  $('#ticker').innerHTML = tick + tick;   // doubled so the -50% loop is seamless

  // ---------- 2. anthem ----------
  const anthem = new Audio('assets/audio/anthem.mp3'); anthem.preload = 'auto';
  let skipArmed = 0;
  function playAnthem() {
    const s = sec('anthem'); s.dataset.step = '1';
    anthem.currentTime = 0; anthem.volume = 1;
    anthem.play().catch(() => { /* blocked or missing: let the operator move on */ s.dataset.step = '2'; info(); });
    info();
  }
  function stopAnthem() { anthem.pause(); $('#caBar').style.width = '0'; }
  function armSkip() {   // a stray click mid-anthem must not cut the music: a second press within 2s does
    if (Date.now() - skipArmed < 2000) { stopAnthem(); sec('anthem').dataset.step = '2'; return info(); }
    skipArmed = Date.now(); info('음악이 끝나면 저절로 "이하 의식 생략"이 나와요 · 지금 끝내려면 한 번 더 누르세요');
  }
  anthem.addEventListener('timeupdate', () => { if (anthem.duration) $('#caBar').style.width = (anthem.currentTime / anthem.duration * 100) + '%'; });
  anthem.addEventListener('ended', () => { sec('anthem').dataset.step = '2'; window.SFX?.twinkle(.25); info(); });

  // ---------- 4. start: film-leader countdown → black ----------
  let cdTimer = null, sweepRaf = null, beepCtx = null;
  function beep(f = 1000, d = .12, g = .18) {   // projector-style tick, synthesized (no extra file)
    try {
      beepCtx = beepCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (window.SFX?.muted) return;
      const o = beepCtx.createOscillator(), v = beepCtx.createGain(), t = beepCtx.currentTime;
      o.frequency.value = f; o.type = 'sine';
      v.gain.setValueAtTime(g, t); v.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(v).connect(beepCtx.destination); o.start(t); o.stop(t + d);
    } catch {}
  }
  function countdown() {
    const s = sec('start'); s.dataset.step = '1'; info();
    let n = 5; const ring = $('#cer .ld-sweep');
    const step = () => {
      $('#ldNum').textContent = n; beep(n === 1 ? 1400 : 1000);
      const t0 = performance.now();
      cancelAnimationFrame(sweepRaf);
      const sw = now => { const p = Math.min(1, (now - t0) / 1000); ring.style.setProperty('--sw', (p * 360) + 'deg'); if (p < 1) sweepRaf = requestAnimationFrame(sw); };
      sweepRaf = requestAnimationFrame(sw);
      if (n-- > 1) cdTimer = setTimeout(step, 1000);
      else cdTimer = setTimeout(() => { s.dataset.step = '2'; window.SFX?.winner(); info(); }, 1000);
    };
    if (reduce) { s.dataset.step = '2'; return info(); }
    step();
  }
  function resetStart() { clearTimeout(cdTimer); cancelAnimationFrame(sweepRaf); sec('start').dataset.step = '0'; }
  function openMovie() {
    const l = MOVIE_LINK[hall];
    window.open(l.url, '_blank', 'noopener');
  }

  // ---------- drawing to the LED ----------
  function goDraw() { const h = hall; close(); openLed(h); }

  // ---------- open / close / ui ----------
  function info(msg) {
    const k = slides[idx]; let tip = '';
    if (k === 'anthem') tip = ['다음: 음악 시작', '음악 재생 중', '다음: 다음 순서'][+sec('anthem').dataset.step];
    if (k === 'start') tip = ['다음: 카운트다운', '카운트다운 중', `다음: 영화 열기(${MOVIE_LINK[hall].svc})`][+sec('start').dataset.step];
    $('#cerInfo').textContent = msg || `${HALLS[hall].name} · ${idx + 1}/${slides.length} ${NAMES[k]}${tip ? ' · ' + tip : ''} · B 검은 화면 · D 추첨`;
    if (msg) pokeUI();
  }
  function open(h) {
    hall = h; slides = order(); idx = 0;
    $$('#cer [data-hallname]').forEach(el => el.textContent = `${HALLS[h].name} · ${HALLS[h].time}`);
    const id = S().winners?.[h], m = id && YSC.movieById(id);
    $('#stMovie').textContent = m ? `오늘의 상영작 · ${m.title}` : '';
    $('#stHint').textContent = `M 또는 다음 ▶ : ${MOVIE_LINK[h].svc}에서 영화 열기  ·  D : 추첨 화면`;
    cer.hidden = false; sizeSky(); show(0); pokeUI();
    goFull();
  }
  function close() {
    stopLobby(); stopAnthem(); resetStart();
    $$('#cer .cs').forEach(s => s.classList.remove('on'));
    cer.hidden = true;
  }
  // fullscreen on the page itself, so the LED can stack on top of it and hand back cleanly
  const fsTarget = () => (cer.getRootNode().host || document.documentElement);
  function goFull() { if (!document.fullscreenElement) fsTarget().requestFullscreen?.().catch(() => {}); }
  function pokeUI() { cer.classList.add('show-ui'); clearTimeout(uiTimer); uiTimer = setTimeout(() => cer.classList.remove('show-ui'), 2600); }
  cer.addEventListener('pointermove', pokeUI);
  stage.addEventListener('click', next);
  $('#cNext').addEventListener('click', next);
  $('#cPrev').addEventListener('click', prev);
  $('#cMovie').addEventListener('click', openMovie);
  $('#cDraw').addEventListener('click', goDraw);
  $('#cClose').addEventListener('click', () => { close(); if (document.fullscreenElement) document.exitFullscreen?.(); });
  $('#cFull').addEventListener('click', () => document.fullscreenElement ? document.exitFullscreen() : goFull());
  $$('[data-cer]').forEach(b => b.addEventListener('click', () => open(b.dataset.cer)));
  $('#cerOrder').innerHTML = ['식 전 안내 (포토존 · 화장실 · 앞자리 착석 · 비상 대피로 · 추첨 예고, 저절로 넘어감 / ↑↓로 직접 넘기기)', '별빛 영화제에 오신 여러분을 환영합니다',
    '국민의례: 국기에 대한 경례 (누르면 음악 시작 → 끝나면 "이하 의식 생략")', '교장 선생님 말씀', '별빛 영화제 시작 (5·4·3·2·1 카운트다운 → 검은 화면 → 영화 열기)']
    .map(t => `<li>${t}</li>`).join('');

  addEventListener('keydown', e => {
    if (cer.hidden || e.ctrlKey || e.altKey || e.metaKey) return;
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if ([' ', 'ArrowRight', 'PageDown', 'Enter'].includes(key)) { e.preventDefault(); next(); }
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(key)) { e.preventDefault(); prev(); }
    else if (key === 'ArrowDown' && slides[idx] === 'lobby') paintNotice(nIdx + 1);
    else if (key === 'ArrowUp' && slides[idx] === 'lobby') paintNotice(nIdx - 1);
    else if (key === 'b' || key === '.') stage.classList.toggle('black');
    else if (key === 'm') openMovie();
    else if (key === 'd') { e.preventDefault(); goDraw(); }
    else if (key === 'f') goFull();
    else if (key === 'Escape') close();
  });

  // ---------- night sky: twinkling stars + slow golden dust, behind every slide ----------
  const sky = $('#cersky'), g = sky.getContext('2d'); let SW = 0, SH = 0, stars = [], dust = [];
  function sizeSky() {
    const r = stage.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    SW = r.width; SH = r.height; sky.width = SW * d; sky.height = SH * d; g.setTransform(d, 0, 0, d, 0, 0);
    stars = Array.from({ length: 160 }, () => ({ x: Math.random() * SW, y: Math.random() * SH, r: Math.random() * 1.4 + .3, p: Math.random() * 6, s: Math.random() * 1.5 + .5 }));
    dust = Array.from({ length: 40 }, () => ({ x: Math.random() * SW, y: Math.random() * SH, r: Math.random() * 2 + .8, vy: -(Math.random() * 12 + 6), vx: Math.random() * 8 - 4 }));
  }
  addEventListener('resize', () => { if (!cer.hidden) sizeSky(); });
  document.addEventListener('fullscreenchange', () => setTimeout(() => { if (!cer.hidden) sizeSky(); }, 80));
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min((now - last) / 1000, .1); last = now;
    if (!cer.hidden && SW) {
      g.clearRect(0, 0, SW, SH);
      const t = now / 1000;
      for (const s of stars) {
        const a = .25 + .75 * (reduce ? .6 : (.5 + .5 * Math.sin(t * s.s + s.p)));
        g.globalAlpha = a; g.fillStyle = '#FFF4D6'; g.beginPath(); g.arc(s.x, s.y, s.r, 0, 7); g.fill();
      }
      g.fillStyle = '#FFC940';
      for (const p of dust) {
        if (!reduce) { p.y += p.vy * dt; p.x += p.vx * dt; }
        if (p.y < -10) { p.y = SH + 10; p.x = Math.random() * SW; }
        g.globalAlpha = .35; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      }
      g.globalAlpha = 1;
    }
    requestAnimationFrame(loop);
  })(last);
};
