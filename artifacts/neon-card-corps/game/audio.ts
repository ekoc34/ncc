// ─── Web Audio API Synthesizer ───────────────────────────────────────────────
// Generates all sounds programmatically — no audio files needed.
// Falls back to a no-op on React Native native (where Web Audio is unavailable).

export type SoundId =
  | 'card_base'
  | 'card_lightning'
  | 'card_fire'
  | 'card_ice'
  | 'card_void'
  | 'card_tech'
  | 'hit_normal'
  | 'hit_crit'
  | 'hit_heavy'
  | 'shield_apply'
  | 'shield_break'
  | 'heal'
  | 'burn_tick'
  | 'freeze_apply'
  | 'synergy_activate'
  | 'boss_intro'
  | 'boss_enrage'
  | 'boss_death'
  | 'victory'
  | 'defeat'
  | 'button_click'
  | 'button_primary'
  | 'end_turn';

// ─── Module-level state ───────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;
let _masterGain: GainNode | null = null;
let _sfxGain: GainNode | null = null;
let _musicGain: GainNode | null = null;

let _sfxVol = 0.8;
let _musicVol = 0.5;
let _muted = false;

let _musicOscs: (OscillatorNode | AudioBufferSourceNode)[] = [];
let _musicPhase: 'none' | 'combat' | 'boss' = 'none';
let _musicFading = false;

const _cooldowns = new Map<string, number>();

// ─── Platform / context helpers ───────────────────────────────────────────────

function _getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!_ctx) {
    try {
      _ctx = new AC();
      _masterGain = _ctx.createGain();
      _masterGain.gain.value = _muted ? 0 : 1;
      _masterGain.connect(_ctx.destination);

      _sfxGain = _ctx.createGain();
      _sfxGain.gain.value = _sfxVol;
      _sfxGain.connect(_masterGain);

      _musicGain = _ctx.createGain();
      _musicGain.gain.value = _musicVol;
      _musicGain.connect(_masterGain);
    } catch {
      return null;
    }
  }
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
}

function _canPlay(id: string, ms: number): boolean {
  const now = performance.now();
  if ((now - (_cooldowns.get(id) ?? 0)) < ms) return false;
  _cooldowns.set(id, now);
  return true;
}

// ─── Low-level synthesis helpers ──────────────────────────────────────────────

function _tone(
  ctx: AudioContext,
  freqStart: number,
  freqEnd: number,
  dur: number,
  type: OscillatorType = 'sine',
  peakGain = 0.22,
  delayS = 0,
): void {
  if (!_sfxGain) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, ctx.currentTime + delayS);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(freqEnd, 10),
      ctx.currentTime + delayS + dur,
    );
  }
  g.gain.setValueAtTime(0.0001, ctx.currentTime + delayS);
  g.gain.linearRampToValueAtTime(peakGain, ctx.currentTime + delayS + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delayS + dur);
  osc.connect(g);
  g.connect(_sfxGain);
  osc.start(ctx.currentTime + delayS);
  osc.stop(ctx.currentTime + delayS + dur + 0.02);
}

function _noise(
  ctx: AudioContext,
  dur: number,
  lowpassFreq = 1500,
  peakGain = 0.18,
  delayS = 0,
): void {
  if (!_sfxGain) return;
  const size = Math.ceil(ctx.sampleRate * (dur + 0.05));
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;

  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = lowpassFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(peakGain, ctx.currentTime + delayS);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delayS + dur);

  src.connect(filt);
  filt.connect(g);
  g.connect(_sfxGain);
  src.start(ctx.currentTime + delayS);
}

// ─── Sound implementations ────────────────────────────────────────────────────

function _cardBase(ctx: AudioContext) {
  _tone(ctx, 720, 160, 0.19, 'sine', 0.28);
  _noise(ctx, 0.14, 700, 0.12);
}

function _cardLightning(ctx: AudioContext) {
  _noise(ctx, 0.06, 8000, 0.38);
  _tone(ctx, 2200, 440, 0.13, 'sawtooth', 0.16);
  for (let i = 0; i < 3; i++) {
    _tone(ctx, 2600 - i * 400, 2600 - i * 400, 0.04, 'square', 0.12, i * 0.028);
  }
}

function _cardFire(ctx: AudioContext) {
  _noise(ctx, 0.24, 380, 0.28);
  _tone(ctx, 95, 50, 0.32, 'sine', 0.32);
  _noise(ctx, 0.1, 1200, 0.12, 0.04);
}

function _cardIce(ctx: AudioContext) {
  const bells = [2093, 2637, 3136, 4186];
  bells.forEach((freq, i) => {
    _tone(ctx, freq, freq, 0.5, 'sine', 0.16 - i * 0.025, i * 0.022);
  });
  _noise(ctx, 0.15, 5000, 0.1);
}

function _cardVoid(ctx: AudioContext) {
  _tone(ctx, 55, 38, 0.55, 'sine', 0.38);
  _tone(ctx, 110, 75, 0.4, 'sine', 0.14);
  _noise(ctx, 0.45, 160, 0.18);
}

function _cardTech(ctx: AudioContext) {
  const seq = [880, 1108, 660, 1320, 880];
  seq.forEach((freq, i) => {
    _tone(ctx, freq, freq, 0.038, 'square', 0.16, i * 0.042);
  });
  _noise(ctx, 0.18, 3000, 0.08);
}

function _hitNormal(ctx: AudioContext) {
  _noise(ctx, 0.1, 1100, 0.24);
  _tone(ctx, 260, 80, 0.14, 'sine', 0.2);
}

function _hitCrit(ctx: AudioContext) {
  _noise(ctx, 0.07, 3200, 0.32);
  _tone(ctx, 620, 140, 0.2, 'sine', 0.28);
  _noise(ctx, 0.12, 900, 0.18, 0.04);
}

function _hitHeavy(ctx: AudioContext) {
  _noise(ctx, 0.18, 600, 0.42);
  _tone(ctx, 80, 40, 0.35, 'sine', 0.4);
  _noise(ctx, 0.08, 2000, 0.2);
}

function _shieldApply(ctx: AudioContext) {
  _tone(ctx, 1760, 2200, 0.16, 'sine', 0.24);
  _tone(ctx, 880, 1100, 0.13, 'sine', 0.14);
}

function _shieldBreak(ctx: AudioContext) {
  _noise(ctx, 0.15, 2000, 0.32);
  _tone(ctx, 880, 220, 0.22, 'sawtooth', 0.2);
}

function _healSound(ctx: AudioContext) {
  _tone(ctx, 440, 880, 0.28, 'sine', 0.22);
  _tone(ctx, 660, 1320, 0.22, 'sine', 0.12);
}

function _burnTick(ctx: AudioContext) {
  _noise(ctx, 0.06, 1400, 0.16);
  _tone(ctx, 320, 160, 0.09, 'sine', 0.1);
}

function _freezeApply(ctx: AudioContext) {
  _noise(ctx, 0.13, 4000, 0.2);
  _tone(ctx, 2800, 1400, 0.2, 'sine', 0.18);
}

function _synergyActivate(ctx: AudioContext) {
  // Rising sparkle arpeggio
  const notes = [440, 554, 659, 880, 1108];
  notes.forEach((freq, i) => {
    _tone(ctx, freq, freq * 1.05, 0.35, 'sine', 0.2, i * 0.06);
  });
  _noise(ctx, 0.6, 4000, 0.06);
}

function _bossIntro(ctx: AudioContext) {
  _tone(ctx, 40, 55, 2.2, 'sine', 0.45);
  _noise(ctx, 1.6, 280, 0.28);
  _tone(ctx, 80, 160, 2.0, 'sawtooth', 0.12, 0.2);
  _tone(ctx, 120, 120, 1.5, 'sine', 0.1, 0.5);
}

function _bossEnrage(ctx: AudioContext) {
  _noise(ctx, 0.32, 2000, 0.45);
  _tone(ctx, 160, 80, 0.4, 'sawtooth', 0.38);
  _noise(ctx, 0.15, 5000, 0.22, 0.1);
}

function _bossDeath(ctx: AudioContext) {
  _noise(ctx, 0.8, 3000, 0.5);
  _tone(ctx, 120, 30, 1.2, 'sine', 0.5);
  _tone(ctx, 240, 60, 1.0, 'sawtooth', 0.25);
}

function _victorySound(ctx: AudioContext) {
  const notes = [523, 659, 784, 1047, 1319];
  notes.forEach((freq, i) => {
    _tone(ctx, freq, freq * 1.01, 0.9, 'sine', 0.28, i * 0.11);
  });
  _noise(ctx, 0.6, 5000, 0.07, 0.15);
}

function _defeatSound(ctx: AudioContext) {
  const notes = [494, 392, 311, 247, 185];
  notes.forEach((freq, i) => {
    _tone(ctx, freq, freq * 0.99, 1.0, 'sine', 0.26, i * 0.14);
  });
  _noise(ctx, 0.8, 400, 0.18);
}

function _buttonClick(ctx: AudioContext) {
  _tone(ctx, 680, 620, 0.055, 'sine', 0.18);
}

function _buttonPrimary(ctx: AudioContext) {
  _tone(ctx, 440, 660, 0.12, 'sine', 0.24);
  _noise(ctx, 0.07, 2200, 0.1);
}

function _endTurn(ctx: AudioContext) {
  _tone(ctx, 300, 450, 0.16, 'sine', 0.2);
  _noise(ctx, 0.1, 800, 0.1, 0.04);
}

// ─── Music system ─────────────────────────────────────────────────────────────

function _stopMusicOscs(): void {
  for (const node of _musicOscs) {
    try { (node as OscillatorNode).stop(); } catch { /* already stopped */ }
  }
  _musicOscs = [];
}

function _buildDroneLayer(
  ctx: AudioContext,
  freq: number,
  type: OscillatorType,
  vol: number,
  lfoRate: number,
  lfoDepth: number,
  dest: AudioNode,
): OscillatorNode[] {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  const lfo = ctx.createOscillator();
  const lfoG = ctx.createGain();

  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = vol;

  lfo.frequency.value = lfoRate;
  lfoG.gain.value = vol * lfoDepth;
  lfo.connect(lfoG);
  lfoG.connect(g.gain);

  osc.connect(g);
  g.connect(dest);

  lfo.start();
  osc.start();
  return [osc, lfo];
}

function _startCombatDrone(ctx: AudioContext): void {
  if (!_musicGain) return;
  const layers: [number, OscillatorType, number, number, number][] = [
    [55,  'sine',     0.14, 0.22, 0.6],
    [110, 'sine',     0.08, 0.28, 0.5],
    [220, 'triangle', 0.04, 0.35, 0.4],
    [440, 'sine',     0.018, 0.4, 0.3],
  ];
  for (const [freq, type, vol, lfoRate, lfoDepth] of layers) {
    const nodes = _buildDroneLayer(ctx, freq, type, vol, lfoRate, lfoDepth, _musicGain);
    _musicOscs.push(...nodes);
  }
}

function _startBossDrone(ctx: AudioContext): void {
  if (!_musicGain) return;
  // Combat base layers
  const baseLayers: [number, OscillatorType, number, number, number][] = [
    [55,   'sine',     0.16, 0.5,  0.7],
    [110,  'sine',     0.1,  0.6,  0.6],
    [220,  'sawtooth', 0.05, 0.7,  0.5],
  ];
  for (const [freq, type, vol, lfoRate, lfoDepth] of baseLayers) {
    const nodes = _buildDroneLayer(ctx, freq, type, vol, lfoRate, lfoDepth, _musicGain);
    _musicOscs.push(...nodes);
  }
  // Dissonant dark layer
  const dark = _buildDroneLayer(ctx, 82.4, 'sawtooth', 0.07, 0.9, 0.8, _musicGain);
  _musicOscs.push(...dark);

  // Low-pass filter on everything already connected
}

// ─── Public API ───────────────────────────────────────────────────────────────

const COOLDOWN_MS: Partial<Record<SoundId, number>> = {
  hit_normal: 60,
  burn_tick: 120,
  button_click: 80,
  button_primary: 100,
  freeze_apply: 80,
};

export function playSound(id: SoundId): void {
  const ctx = _getCtx();
  if (!ctx || !_sfxGain) return;
  if (!_canPlay(id, COOLDOWN_MS[id] ?? 30)) return;

  switch (id) {
    case 'card_base':          _cardBase(ctx); break;
    case 'card_lightning':     _cardLightning(ctx); break;
    case 'card_fire':          _cardFire(ctx); break;
    case 'card_ice':           _cardIce(ctx); break;
    case 'card_void':          _cardVoid(ctx); break;
    case 'card_tech':          _cardTech(ctx); break;
    case 'hit_normal':         _hitNormal(ctx); break;
    case 'hit_crit':           _hitCrit(ctx); break;
    case 'hit_heavy':          _hitHeavy(ctx); break;
    case 'shield_apply':       _shieldApply(ctx); break;
    case 'shield_break':       _shieldBreak(ctx); break;
    case 'heal':               _healSound(ctx); break;
    case 'burn_tick':          _burnTick(ctx); break;
    case 'freeze_apply':       _freezeApply(ctx); break;
    case 'synergy_activate':   _synergyActivate(ctx); break;
    case 'boss_intro':         _bossIntro(ctx); break;
    case 'boss_enrage':        _bossEnrage(ctx); break;
    case 'boss_death':         _bossDeath(ctx); break;
    case 'victory':            _victorySound(ctx); break;
    case 'defeat':             _defeatSound(ctx); break;
    case 'button_click':       _buttonClick(ctx); break;
    case 'button_primary':     _buttonPrimary(ctx); break;
    case 'end_turn':           _endTurn(ctx); break;
  }
}

export function startMusic(type: 'combat' | 'boss'): void {
  const ctx = _getCtx();
  if (!ctx || !_musicGain || _musicPhase === type || _musicFading) return;
  _stopMusicOscs();
  _musicPhase = type;
  if (type === 'combat') _startCombatDrone(ctx);
  else _startBossDrone(ctx);
}

export function stopMusic(fadeSecs = 1.5): void {
  if (!_ctx || !_musicGain) return;
  if (_musicPhase === 'none') return;
  _musicFading = true;
  const now = _ctx.currentTime;
  _musicGain.gain.cancelScheduledValues(now);
  _musicGain.gain.setValueAtTime(_musicGain.gain.value, now);
  _musicGain.gain.exponentialRampToValueAtTime(0.0001, now + fadeSecs);
  setTimeout(() => {
    _stopMusicOscs();
    if (_musicGain) {
      _musicGain.gain.cancelScheduledValues(_ctx!.currentTime);
      _musicGain.gain.value = _musicVol;
    }
    _musicPhase = 'none';
    _musicFading = false;
  }, fadeSecs * 1000 + 100);
}

export function updateAudioSettings(sfx: number, music: number, muted: boolean): void {
  _sfxVol = sfx;
  _musicVol = music;
  _muted = muted;
  if (_masterGain) _masterGain.gain.value = muted ? 0 : 1;
  if (_sfxGain) _sfxGain.gain.value = sfx;
  if (_musicGain && _musicPhase !== 'none') _musicGain.gain.value = music;
}

export function resumeAudio(): void {
  _ctx?.resume().catch(() => {});
}

export function getCardSound(tags: string[]): SoundId {
  if (tags.includes('lightning')) return 'card_lightning';
  if (tags.includes('fire')) return 'card_fire';
  if (tags.includes('ice')) return 'card_ice';
  if (tags.includes('void')) return 'card_void';
  if (tags.includes('tech')) return 'card_tech';
  return 'card_base';
}

export function getHitSound(damage: number): SoundId {
  if (damage >= 14) return 'hit_heavy';
  if (damage >= 8) return 'hit_crit';
  return 'hit_normal';
}
