typeof window !== 'undefined' && (window.AudioSystem = (() => {
  let ctx = null;
  let masterGain = null;
  let _muted = false;
  let _bgMusic = null;

  try { _muted = localStorage.getItem('audio-muted') === 'true'; } catch (e) {}

  const MASTER_VOL = 0.25;
  const SFX_VOL = 0.35;
  const MUSIC_FILE = 'audio file/game sound.mp3';

  function _ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = _muted ? 0 : MASTER_VOL;
    masterGain.connect(ctx.destination);
    ctx.resume().catch(() => {});
    const unlock = () => {
      ctx.resume().then(() => {
        if (!_muted) _startMusic();
      }).catch(() => {});
    };
    document.addEventListener('pointerdown', unlock, { capture: true, once: true });
    document.addEventListener('keydown', unlock, { capture: true, once: true });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
  });

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
        g.gain.setValueAtTime(SFX_VOL * 0.5, now);
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
        g.gain.setValueAtTime(SFX_VOL * 0.5, now);
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

  // ---- BACKGROUND MUSIC (single continuous track) ----

  function _startMusic() {
    if (_bgMusic) return;
    _bgMusic = new Audio(MUSIC_FILE);
    _bgMusic.loop = true;
    _bgMusic.volume = 0.10;
    _bgMusic.play().catch(() => {});
  }

  function isMuted() { return _muted; }

  function toggleMute() {
    _muted = !_muted;
    try { localStorage.setItem('audio-muted', _muted); } catch (e) {}
    if (masterGain) masterGain.gain.value = _muted ? 0 : MASTER_VOL;
    if (_muted) {
      if (_bgMusic) _bgMusic.pause();
    } else {
      if (_bgMusic) _bgMusic.play().catch(() => {});
      else _startMusic();
    }
    return _muted;
  }

  function init() {
    _ensure();
  }

  // ---- CONVEYOR BELT HUM (ambient) ----

  let _beltHumNodes = null;

  function startBeltHum() {
    _ensure();
    if (_muted || _beltHumNodes) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(58, now);
    osc.frequency.linearRampToValueAtTime(62, now + 0.8);
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.3;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain).connect(osc.frequency);
    lfo.start(now);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 180;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.018, now + 1.5);
    osc.connect(filter).connect(gain).connect(masterGain);
    osc.start(now);
    _beltHumNodes = { osc, lfo, filter, gain };
  }

  function stopBeltHum() {
    if (!_beltHumNodes) return;
    const now = ctx.currentTime;
    const { osc, lfo, gain } = _beltHumNodes;
    gain.gain.linearRampToValueAtTime(0, now + 0.5);
    setTimeout(() => {
      try { osc.stop(); } catch (e) {}
      try { lfo.stop(); } catch (e) {}
    }, 550);
    _beltHumNodes = null;
  }

  return { init, playSound, toggleMute, isMuted, startBeltHum, stopBeltHum };
})());
