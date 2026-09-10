// src/utils/zenAudio.ts
'use client';

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * 程序化合成空灵沉静的西藏颂钵 / 铜磬 (Tibetan Singing Bowl)
 * 采用 432Hz 基频与多重非谐泛音衰减包络，零音频文件依赖，零网络开销
 */
export function playSingingBowl(freq = 432, volume = 0.35) {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // 主音量增益
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume, now);
    masterGain.connect(ctx.destination);

    // 颂钵多重泛音列结构 (基频 + 泛音比率 + 相对振幅 + 衰减时长)
    const partials = [
      { ratio: 1.0, gain: 0.5, decay: 3.8 }, // 基音
      { ratio: 2.76, gain: 0.28, decay: 2.4 }, // 次泛音（产生铜磬独特的金属质感）
      { ratio: 4.75, gain: 0.12, decay: 1.5 }, // 高次泛音（空灵光泽感）
      { ratio: 5.4, gain: 0.05, decay: 0.9 }, // 敲击瞬态光芒
    ];

    partials.forEach(({ ratio, gain: pGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      // 加入极其细微的微调频率(0.3Hz)，产生颂钵特有的双耳节拍余韵(binaural beat shimmer)
      osc.frequency.setValueAtTime(freq * ratio + (ratio === 1.0 ? 0.3 : 0), now);

      // 击打瞬态快速建立，随后呈指数衰减
      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(pGain, now + 0.015);
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(now);
      osc.stop(now + decay + 0.1);
    });
  } catch {
    // 忽略未交互时的浏览器静音策略拦截
  }
}

// ==================== 禅意环境白噪/微风流水合成 ====================
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;
let ambientFilter: BiquadFilterNode | null = null;
let ambientLfo: OscillatorNode | null = null;
let isPlayingAmbient = false;
const listeners = new Set<(playing: boolean) => void>();

function notifyListeners() {
  listeners.forEach((cb) => cb(isPlayingAmbient));
}

/** 生成 4 秒平滑循环的粉红/布朗自然环境噪声 buffer */
function createAmbientBuffer(ctx: AudioContext): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 4;
  const buffer = ctx.createBuffer(2, bufferSize, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0,
      b1 = 0,
      b2 = 0,
      b3 = 0,
      b4 = 0,
      b5 = 0,
      b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // 经典的 Paul Kellet 7段粉红噪声滤波
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }
  }
  return buffer;
}

export function startAmbientSoundscape() {
  const ctx = getAudioContext();
  if (!ctx || isPlayingAmbient) return;

  try {
    const buffer = createAmbientBuffer(ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // 低通滤波器模拟山间清泉与竹林风声
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    // 0.12Hz 超慢速 LFO 调制滤波，模拟自然的呼吸律动与风水起伏
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime);
    lfoGain.gain.setValueAtTime(160, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    // 平滑淡入增益
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.22, ctx.currentTime + 1.8);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    source.start();

    ambientSource = source;
    ambientGain = gain;
    ambientFilter = filter;
    ambientLfo = lfo;
    isPlayingAmbient = true;
    notifyListeners();
  } catch (err) {
    console.warn('Failed to start ambient soundscape:', err);
  }
}

export function stopAmbientSoundscape() {
  if (!isPlayingAmbient || !ambientGain || !audioCtx) {
    isPlayingAmbient = false;
    notifyListeners();
    return;
  }

  try {
    const now = audioCtx.currentTime;
    ambientGain.gain.setValueAtTime(ambientGain.gain.value, now);
    ambientGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    setTimeout(() => {
      try {
        ambientSource?.stop();
        ambientSource?.disconnect();
        ambientLfo?.stop();
        ambientLfo?.disconnect();
      } catch {}
      ambientSource = null;
      ambientGain = null;
      ambientFilter = null;
      ambientLfo = null;
      isPlayingAmbient = false;
      notifyListeners();
    }, 1300);
  } catch {
    isPlayingAmbient = false;
    notifyListeners();
  }
}

export function toggleAmbientSoundscape(): boolean {
  if (isPlayingAmbient) {
    stopAmbientSoundscape();
    return false;
  } else {
    startAmbientSoundscape();
    return true;
  }
}

export function isAmbientPlaying(): boolean {
  return isPlayingAmbient;
}

export function subscribeAmbientState(cb: (playing: boolean) => void): () => void {
  listeners.add(cb);
  cb(isPlayingAmbient);
  return () => {
    listeners.delete(cb);
  };
}
