window.AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let _muted = false;
  let _musicHandle = null;
  let _initOnInteraction = false;

  try { _muted = localStorage.getItem('audio-muted') === 'true'; } catch (e) {}

  const MASTER_VOL = 0.25;
  const SFX_VOL = 0.35;

  function _ensure() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = _muted ? 0 : MASTER_VOL;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  // ---- SOUND EFFECTS ----

  function playSound(name) {
    _ensure();
    if (_muted) return;
    const now = ctx.currentTime;

    function oneShot(type, freq, vol, dur, freqEnd) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, now);
      if (freqEnd !== undefined) o.frequency.linearRampToValueAtTime(freqEnd, now + dur);
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(vol, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      o.connect(g).connect(masterGain);
      o.start(now);
      o.stop(now + dur + 0.01);
    }

    switch (name) {
      case 'success': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(SFX_VOL * 0.8, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        g.connect(masterGain);
        [523, 659, 784].forEach((f, i) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          o.connect(g);
          o.start(now + i * 0.08);
          o.stop(now + 0.35);
        });
        break;
      }
      case 'fail': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(SFX_VOL * 0.5, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        g.connect(masterGain);
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(100, now + 0.3);
        o.connect(g);
        o.start(now);
        o.stop(now + 0.3);
        break;
      }
      case 'whoosh': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(SFX_VOL * 0.25, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        g.connect(masterGain);
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        o.connect(g);
        o.start(now);
        o.stop(now + 0.25);
        break;
      }
      case 'tap': {
        oneShot('sine', 880, SFX_VOL * 0.15, 0.08, 660);
        break;
      }
    }
  }

  // ---- MUSIC ENGINE ----

  function _stopMusic(fadeSec) {
    if (!_musicHandle) return;
    _musicHandle.stop(fadeSec || 0);
    _musicHandle = null;
  }

  function playMusic(eraId) {
    _ensure();
    if (_muted) return;
    const fadeSec = 0.5;
    _stopMusic(fadeSec);
    const startAt = ctx.currentTime + fadeSec + 0.05;
    _musicHandle = _buildEraMusic(eraId, startAt);
  }

  function _buildEraMusic(eraId, startTime) {
    const musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(masterGain);
    musicGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.5);

    let running = true;
    const timers = [];

    function sch(fn, delay) {
      if (!running) return null;
      const id = setTimeout(fn, Math.max(0, delay) * 1000);
      timers.push(id);
      return id;
    }

    function stop(fadeSec) {
      running = false;
      timers.forEach(id => clearTimeout(id));
      timers.length = 0;
      const now = ctx.currentTime;
      try { musicGain.gain.linearRampToValueAtTime(0, now + (fadeSec || 0.15)); } catch(e) {}
      sch(() => { try { musicGain.disconnect(); } catch(e) {} }, (fadeSec || 0.15) + 0.05);
    }

    function note(type, freq, vol, dur, startOff, glideTo) {
      if (!running) return;
      const now = ctx.currentTime;
      const t = startTime + (startOff || 0);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      if (glideTo !== undefined) o.frequency.linearRampToValueAtTime(glideTo, t + dur);
      const att = 0.005;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + att);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(musicGain);
      o.start(t);
      o.stop(t + dur + 0.01);
    }

    function chord(notes, vol, dur, startOff) {
      notes.forEach(f => note('sine', f, vol, dur, startOff));
    }

    // ── Era builders ──

    function buildEra1() {
      const pent = [262, 294, 330, 392, 440];
      const bpm = 18;
      const beat = 60 / bpm;
      let bar = 0;

      function tick() {
        if (!running) return;
        const off = bar * beat;
        const p = bar % 8;
        if (p === 0) note('sine', pent[0], 0.18, 0.5, off);
        else if (p === 3) note('sine', pent[2], 0.14, 0.4, off);
        else if (p === 5) note('sine', pent[4], 0.12, 0.6, off + 0.1);
        else if (p === 7) note('sine', pent[1], 0.10, 0.35, off + 0.05);
        bar++;
        if (bar < 32) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, 0);
      return { stop };
    }

    function buildEra2() {
      const bpm = 110;
      const beat = 60 / bpm;
      let step = 0;

      function tick() {
        if (!running) return;
        const off = step * beat;
        if (step % 2 === 0) {
          note('triangle', 80, 0.3, 0.12, off);
          note('square', 160, 0.08, 0.06, off + 0.04);
        } else {
          note('triangle', 120, 0.18, 0.08, off);
        }
        step++;
        if (step < 64) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, 0);
      return { stop };
    }

    function buildEra3() {
      const bpm = 135;
      const beat = 60 / bpm;
      let step = 0;
      const pat = [0, 1, 0, 1, 0, 0, 1, 0];

      function tick() {
        if (!running) return;
        const off = step * beat;
        const p = pat[step % pat.length];
        note('triangle', p ? 200 : 100, p ? 0.2 : 0.35, 0.07, off);
        if (step % 4 === 0) note('square', 440, 0.06, 0.04, off);
        if (step % 8 === 7) note('sine', 550, 0.1, 0.15, off);
        step++;
        if (step < 96) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, 0);
      return { stop };
    }

    function buildEra4() {
      const bpm = 128;
      const beat = 60 / bpm;
      let step = 0;
      const arp = [523, 659, 784, 880];

      function tick() {
        if (!running) return;
        const off = step * beat;
        const f = arp[step % arp.length];
        note('sawtooth', f, 0.12, 0.06, off);
        if (step % 8 === 3) note('sine', f * 0.5, 0.08, 0.15, off);
        step++;
        if (step < 128) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, 0);
      return { stop };
    }

    function buildEra5() {
      const bpm = 40;
      const beat = 60 / bpm;
      let step = 0;
      const padNotes = [220, 330, 440];

      function tick() {
        if (!running) return;
        const off = step * beat;
        const f = padNotes[step % padNotes.length];
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.value = f;
        const det = ctx.createOscillator();
        det.type = 'sine';
        det.frequency.value = 0.15;
        const detG = ctx.createGain();
        detG.gain.value = 2;
        det.connect(detG).connect(o.detune);
        det.start();
        const att = 0.3;
        const dur = beat * 2;
        const t = startTime + off;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.08, t + att);
        g.gain.setValueAtTime(0.08, t + dur - 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(musicGain);
        o.start(t);
        o.stop(t + dur + 0.01);
        step++;
        if (step < 24) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, 0);
      return { stop };
    }

    function buildEra6() {
      const bpm = 10;
      const beat = 60 / bpm;
      let step = 0;
      const notes = [262, 349, 262, 392, 262, 330, 262, 294];

      function tick() {
        if (!running) return;
        const off = step * beat;
        const f = notes[step % notes.length];
        const dur = beat * 0.7;
        note('sine', f, 0.12, dur, off);
        if (step % 2 === 0) note('sine', f / 2, 0.06, dur * 0.6, off + 0.3);
        step++;
        if (step < 16) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, 0);
      return { stop };
    }

    const builders = { 1: buildEra1, 2: buildEra2, 3: buildEra3, 4: buildEra4, 5: buildEra5, 6: buildEra6 };
    return (builders[eraId] || buildEra1)();
  }

  // ---- MUTE ----

  function isMuted() { return _muted; }

  function toggleMute() {
    _muted = !_muted;
    try { localStorage.setItem('audio-muted', _muted); } catch (e) {}
    if (masterGain) masterGain.gain.value = _muted ? 0 : MASTER_VOL;
    if (_muted) _stopMusic(0.15);
    else if (Game.currentEra) playMusic(Game.currentEra.id);
    return _muted;
  }

  function setVolume(v) {
    if (masterGain) masterGain.gain.value = v;
  }

  function init() {
    _ensure();
    if (Game.currentEra && !_muted) playMusic(Game.currentEra.id);
  }

  return { init, playMusic, stopMusic: _stopMusic, playSound, toggleMute, isMuted, setVolume };
})();
