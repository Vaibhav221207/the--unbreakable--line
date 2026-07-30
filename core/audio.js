typeof window !== 'undefined' && (window.AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let _muted = false;
  let _musicHandle = null;

  try { _muted = localStorage.getItem('audio-muted') === 'true'; } catch (e) {}

  const MASTER_VOL = 0.25;
  const SFX_VOL = 0.35;

  // Resume context when user returns to tab (fixes silent AudioContext)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx && ctx.state === 'suspended') ctx.resume();
  });

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

    switch (name) {
      case 'success': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(SFX_VOL * 0.8, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        g.connect(masterGain);
        [523, 659, 784].forEach((f, i) => {
          const o = ctx.createOscillator();
          o.type = 'sine';
          o.frequency.value = f;
          o.connect(g);
          o.start(now + i * 0.08);
          o.stop(now + 0.4);
        });
        break;
      }
      case 'fail': {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 400;
        const g = ctx.createGain();
        g.gain.setValueAtTime(SFX_VOL * 0.4, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        f.connect(g).connect(masterGain);
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(100, now + 0.3);
        o.connect(f);
        o.start(now);
        o.stop(now + 0.3);
        break;
      }
      case 'whoosh': {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = 600;
        const g = ctx.createGain();
        g.gain.setValueAtTime(SFX_VOL * 0.2, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        f.connect(g).connect(masterGain);
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
        o.connect(f);
        o.start(now);
        o.stop(now + 0.25);
        break;
      }
      case 'tap': {
        const g = ctx.createGain();
        g.gain.setValueAtTime(SFX_VOL * 0.12, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        g.connect(masterGain);
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.setValueAtTime(880, now);
        o.frequency.linearRampToValueAtTime(660, now + 0.08);
        o.connect(g);
        o.start(now);
        o.stop(now + 0.1);
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
    const longLived = []; // oscillators that outlive a single note (LFOs, drones)

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
      longLived.forEach(o => { try { o.stop(ctx.currentTime + 0.05); } catch(e) {} });
      longLived.length = 0;
      const now = ctx.currentTime;
      try { musicGain.gain.linearRampToValueAtTime(0, now + (fadeSec || 0.15)); } catch(e) {}
      sch(() => { try { musicGain.disconnect(); } catch(e) {} }, (fadeSec || 0.15) + 0.05);
    }

    // Ensure context stays alive — resume if browser suspended it
    function keepAlive() {
      if (ctx.state === 'suspended') ctx.resume();
    }

    // ── Single voice: oscillator + filter (for harsh types) + ADSR gain ──
    function voice(type, freq, vol, attack, hold, release, t, filterHz) {
      if (!running) return;
      keepAlive();
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(freq, t);
      let chain = o;
      if (filterHz && (type === 'sawtooth' || type === 'square')) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = filterHz;
        o.connect(f);
        chain = f;
      }
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + attack);
      g.gain.setValueAtTime(vol, t + hold);
      g.gain.exponentialRampToValueAtTime(0.001, t + hold + release);
      chain.connect(g).connect(musicGain);
      o.start(t);
      o.stop(t + hold + release + 0.01);
    }

    function chord(notes, type, vol, attack, hold, release, t, filterHz) {
      notes.forEach(f => voice(type, f, vol / notes.length, attack, hold, release, t, filterHz));
    }

    // ── Era 1: Drone (low gain + filtered) + soft pentatonic melody ──
    function buildEra1() {
      const pent = [262, 294, 330, 392, 440];
      const bpm = 16;
      const beat = 60 / bpm;
      let bar = 0;

      // Sustained low drone: C2 + G2, LOW gain (1/4 previous), filtered
      const droneF = ctx.createBiquadFilter();
      droneF.type = 'lowpass';
      droneF.frequency.value = 300;
      const droneG = ctx.createGain();
      droneG.gain.setValueAtTime(0, startTime);
      droneG.gain.linearRampToValueAtTime(0.015, startTime + 2);
      droneF.connect(droneG).connect(musicGain);
      [65, 98].forEach(f => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(droneF);
        o.start(startTime);
        longLived.push(o);
      });

      function tick() {
        if (!running) return;
        keepAlive();
        const off = bar * beat;
        const p = bar % 8;
        if (p === 0) voice('sine', pent[0], 0.14, 0.2, 2.5, 1.5, startTime + off);
        else if (p === 3) voice('sine', pent[2], 0.11, 0.2, 2.0, 1.5, startTime + off + 0.1);
        else if (p === 5) voice('sine', pent[4], 0.09, 0.25, 2.5, 1.5, startTime + off + 0.05);
        else if (p === 7) voice('sine', pent[1], 0.08, 0.25, 2.0, 1.5, startTime + off + 0.15);
        bar++;
        if (bar < 32) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, beat * 0.5);
      return { stop };
    }

    // ── Era 2: Bass pulse (overlapping) + 2-chord minor progression ──
    function buildEra2() {
      const bpm = 110;
      const beat = 60 / bpm;
      let step = 0;
      const chords = [[131, 156, 196], [175, 208, 262]];
      const chordLen = beat * 4;

      function tick() {
        if (!running) return;
        keepAlive();
        const off = step * beat;
        // Bass pulse — long enough to overlap into next beat (beat=0.545, hold+release=0.55)
        voice('triangle', step % 2 === 0 ? 65 : 98, 0.18, 0.005, 0.2, 0.35, startTime + off);
        if (step % 4 === 0) {
          chord(chords[Math.floor(step / 4) % 2], 'triangle', 0.15, 0.03, chordLen - 0.4, 0.4, startTime + off, 600);
        }
        step++;
        if (step < 64) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, beat);
      return { stop };
    }

    // ── Era 3: 4-chord loop, gritter/square bass, percussive accent — distinct from Era 2 ──
    function buildEra3() {
      const bpm = 130;
      const beat = 60 / bpm;
      let step = 0;
      const chordProg = [
        [131, 156, 196],
        [208, 262, 311],
        [156, 196, 233],
        [233, 294, 349]
      ];
      const chordLen = beat * 4;

      function tick() {
        if (!running) return;
        keepAlive();
        const off = step * beat;
        // Square-wave bass (grittier than Era 2's triangle) — overlapping
        voice('square', step % 2 === 0 ? 65 : 78, 0.1, 0.005, 0.18, 0.3, startTime + off, 250);
        // Percussive accent on the offbeats (Era 2 has no equivalent)
        if (step % 4 === 1 || step % 4 === 3) {
          voice('sine', 220, 0.04, 0.002, 0.02, 0.04, startTime + off, 400);
        }
        if (step % 4 === 0) {
          // Sawtooth chords (richer/warmer than triangle-only Era 2)
          chord(chordProg[Math.floor(step / 4) % 4], 'sawtooth', 0.1, 0.03, chordLen - 0.3, 0.3, startTime + off, 400);
        }
        step++;
        if (step < 96) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, beat);
      return { stop };
    }

    // ── Era 4: Cmaj9 arpeggio, filtered, overlapping notes ──
    function buildEra4() {
      const bpm = 128;
      const beat = 60 / bpm;
      let step = 0;
      const arp = [262, 330, 392, 494, 587, 494, 392, 330];

      function tick() {
        if (!running) return;
        keepAlive();
        const off = step * beat;
        const f = arp[step % arp.length];
        // Overlapping: hold+release=0.5 > beat=0.469
        voice('sawtooth', f, 0.08, 0.01, 0.2, 0.3, startTime + off, 900);
        if (step % 16 === 0) {
          chord([262, 330, 392, 494, 587], 'sine', 0.06, 0.01, 0.4, 0.5, startTime + off);
        }
        step++;
        if (step < 128) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, beat);
      return { stop };
    }

    // ── Era 5: Lush ambient pad + occasional high "sparkle" arp detail ──
    function buildEra5() {
      const chords = [
        [131, 147, 196],
        [196, 262, 294]
      ];
      const chordDur = 8;
      const totalChords = 8;
      let idx = 0;
      let sparkleTimer = null;

      function scheduleSparkle(baseT) {
        if (!running) return;
        const delay = 4 + Math.random() * 8;
        sparkleTimer = sch(() => {
          if (!running) return;
          keepAlive();
          const t = ctx.currentTime;
          // Very quiet, high, filtered sine — like a digital plink
          const pitches = [880, 1100, 1320, 990, 1170];
          const p = pitches[Math.floor(Math.random() * pitches.length)];
          voice('sine', p, 0.025, 0.01, 0.15, 0.3, t, 600);
          // Second tap an octave up
          sch(() => {
            if (!running) return;
            voice('sine', p * 2, 0.012, 0.01, 0.1, 0.2, ctx.currentTime, 600);
          }, 0.12);
          scheduleSparkle();
        }, delay);
      }

      function playNext() {
        if (!running) return;
        keepAlive();
        if (idx >= totalChords) {
          idx = 0;
          sch(playNext, chordDur - 0.5);
          return;
        }
        const now = ctx.currentTime;
        const t = (idx === 0) ? startTime + 0.5 : now + 0.3;
        const ci = idx % 2;

        chords[ci].forEach(f => {
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.value = f;
          const cents = [-3, 0, 4][chords[ci].indexOf(f)];
          osc.detune.value = cents;

          const lfo = ctx.createOscillator();
          lfo.type = 'sine';
          lfo.frequency.value = 0.12;
          const lfoGain = ctx.createGain();
          lfoGain.gain.value = 5;
          lfo.connect(lfoGain).connect(osc.detune);
          lfo.start(t);
          longLived.push(lfo);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 500;

          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.06, t + 2.0);
          g.gain.setValueAtTime(0.06, t + chordDur - 2.5);
          g.gain.exponentialRampToValueAtTime(0.001, t + chordDur);

          osc.connect(filter).connect(g).connect(musicGain);
          osc.start(t);
          osc.stop(t + chordDur + 0.1);
        });

        idx++;
        sch(playNext, chordDur - 0.5);
      }

      sch(playNext, 0);
      scheduleSparkle(startTime + 2);
      return { stop };
    }

    // ── Era 6: Quietest, simplest — sparse melody + warm pad, no extra elements ──
    function buildEra6() {
      const bpm = 10;
      const beat = 60 / bpm;
      let step = 0;
      const notes = [262, 349, 262, 392, 262, 330, 262, 294];

      // Very quiet warm sustained pad
      const padG = ctx.createGain();
      padG.gain.setValueAtTime(0, startTime);
      padG.gain.linearRampToValueAtTime(0.025, startTime + 3);
      padG.connect(musicGain);
      [131, 165, 196].forEach(f => {
        const o = ctx.createOscillator();
        o.type = 'sine';
        o.frequency.value = f;
        o.connect(padG);
        o.start(startTime);
        longLived.push(o);
      });

      function tick() {
        if (!running) return;
        keepAlive();
        const off = step * beat;
        const f = notes[step % notes.length];
        voice('sine', f, 0.08, 0.15, 3.0, 2.0, startTime + off);
        step++;
        if (step < 16) sch(tick, beat);
        else sch(tick, 0);
      }
      sch(tick, beat * 0.5);
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
})());
