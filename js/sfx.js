/* YULPO STARLIGHT CINEMA — sound effects (Web Audio)
 * Files: assets/sfx/*.mp3 (Freesound, CC0). Offsets below were picked from a waveform scan:
 *   popcorn.mp3  dense popping around 4.5s, 6.6s, 9.0s; single pops at the listed early onsets
 *   drumroll.mp3 silent until 2.4s, roll builds, cymbal crash lands ~4.4s
 *   stamp.mp3    single rubber-stamp hit at 0.5s;  curtain.mp3  cloth swish 0.3–1.1s
 * Browsers only allow sound after a tap/drag, so the context unlocks on the first gesture.
 */
window.SFX = (() => {
  const FILES = { popcorn: 'popcorn', drum: 'drumroll', woosh: 'woosh', printer: 'printer', fanfare: 'fanfare', cheer: 'cheer', twinkle: 'twinkle', stamp: 'stamp', curtain: 'curtain' };
  const SINGLE_POPS = [0.25, 0.4, 0.9, 1.15, 1.45, 2.05, 2.55, 3.25, 3.95];
  let ctx = null, master = null, loading = null;
  const buffers = {};
  // download early (after the images have had a head start); decoding waits for the first tap
  const raw = {};
  setTimeout(() => {
    for (const [k, f] of Object.entries(FILES)) raw[k] = fetch(`assets/sfx/${f}.mp3`).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
  }, 1200);
  let muted = false;
  try { muted = localStorage.getItem('ysc_mute') === '1'; } catch {}

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC(); master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    if (!loading) loading = Promise.all(Object.entries(FILES).map(async ([k, f]) => {
      try {
        const data = await (raw[k] || fetch(`assets/sfx/${f}.mp3`).then(r => r.arrayBuffer()));
        if (data) buffers[k] = await ctx.decodeAudioData(data.slice(0));
      } catch {}
    }));
  }
  ['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, unlock, { capture: true, passive: true }));

  // play a slice of a buffer: { offset, dur, gain, rate, delay, fadeIn }
  function play(name, o = {}) {
    if (!ctx || muted) return;
    const b = buffers[name]; if (!b) return;
    const src = ctx.createBufferSource(); src.buffer = b; src.playbackRate.value = o.rate || 1;
    const g = ctx.createGain(); const t0 = ctx.currentTime + (o.delay || 0);
    const dur = Math.min(o.dur ?? b.duration, b.duration - (o.offset || 0));
    const vol = o.gain ?? 1;
    g.gain.setValueAtTime(o.fadeIn ? 0 : vol, t0);
    if (o.fadeIn) g.gain.linearRampToValueAtTime(vol, t0 + o.fadeIn);
    g.gain.setValueAtTime(vol, t0 + Math.max(0, dur - 0.12));
    g.gain.linearRampToValueAtTime(0, t0 + dur);   // short fade so slices never click
    src.connect(g).connect(master);
    src.start(t0, o.offset || 0, dur);
    return src;
  }
  const rnd = (a, b) => a + Math.random() * (b - a);

  return {
    unlock,
    get muted() { return muted; },
    setMuted(m) {
      muted = !!m;
      try { localStorage.setItem('ysc_mute', muted ? '1' : '0'); } catch {}
      if (master) master.gain.value = muted ? 0 : 0.9;
    },
    // one kernel hopping out of the box
    pop(gain = 0.5) { play('popcorn', { offset: SINGLE_POPS[(Math.random() * SINGLE_POPS.length) | 0], dur: 0.18, gain, rate: rnd(0.9, 1.2) }); },
    // the big one: three dense stretches stacked on top of each other
    burst(scale = 1) {
      play('popcorn', { offset: 9.0, dur: 1.7, gain: 1.0 * scale, rate: 1.05 });
      play('popcorn', { offset: 4.5, dur: 1.4, gain: 0.8 * scale, rate: 0.95, delay: 0.04 });
      play('popcorn', { offset: 6.6, dur: 1.3, gain: 0.8 * scale, rate: 1.12, delay: 0.09 });
    },
    woosh(gain = 0.7) { play('woosh', { offset: 0.1, dur: 1.2, gain }); },
    twinkle(gain = 0.45, delay = 0) { play('twinkle', { offset: 0.1, dur: 2.2, gain, delay }); },
    printer(dur = 1.0) { play('printer', { offset: 0, dur, gain: 0.55 }); },
    // drum roll whose crash lands `lead` seconds after the call
    drumroll(lead = 2.0) { play('drum', { offset: 4.4 - lead, dur: lead + 2.4, gain: 1 }); },
    winner() { play('cheer', { gain: 0.9 }); play('fanfare', { offset: 0.3, dur: 3.2, gain: 0.8, delay: 0.15 }); },
    stamp(delay = 0) { play('stamp', { offset: 0.42, dur: 0.8, gain: 0.9, delay }); },
    curtain() { play('curtain', { offset: 0.2, dur: 1.5, gain: 0.8 }); },
  };
})();
