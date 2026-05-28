function createClip(src, volume = 0.8) {
  const clip = new Audio(src);
  clip.preload = "auto";
  clip.baseVolume = volume;
  clip.volume = volume;
  return clip;
}

function createClipPool(src, size = 3, volume = 0.8) {
  return Array.from({ length: size }, () => createClip(src, volume));
}

export function createAudioService({ state, typeInfo, clamp }) {
  const snapAudio = new Audio("assets/y2155.mp3");
  snapAudio.preload = "auto";
  snapAudio.baseVolume = 0.88;
  snapAudio.volume = 0.88;

  const bgmAudio = createClip("assets/bgm.mp3", 0.46);
  bgmAudio.loop = true;

  const sampleAudio = {
    attack: createClipPool("assets/attack.mp3", 5, 0.58),
    warningDengDeng: createClip("assets/warning-dengdeng.mp3", 0.86),
    warningDiuDiu: createClip("assets/warning-diudiu.mp3", 0.82),
    win: createClip("assets/win.mp3", 0.9),
  };

  return {
    context: null,
    master: null,
    enabled: true,
    poolIndex: 0,
    lastAttackAt: 0,
    bgmVolume: 0.45,
    sfxVolume: 0.8,

    async init() {
      if (!this.enabled) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.context.destination);
      }
      this.applyVolumes();
      if (this.context.state === "suspended") {
        await this.context.resume();
      }
    },

    sfxClips() {
      return [
        ...sampleAudio.attack,
        sampleAudio.warningDengDeng,
        sampleAudio.warningDiuDiu,
        sampleAudio.win,
        snapAudio,
      ];
    },

    applyVolumes() {
      if (this.master) {
        this.master.gain.value = 0.16 * this.sfxVolume;
      }
      for (const clip of this.sfxClips()) {
        clip.volume = (clip.baseVolume ?? 1) * this.sfxVolume;
      }
      bgmAudio.volume = (bgmAudio.baseVolume ?? 1) * this.bgmVolume;
    },

    setBgmVolume(volume) {
      this.bgmVolume = clamp(volume, 0, 1);
      bgmAudio.volume = (bgmAudio.baseVolume ?? 1) * this.bgmVolume;
      if (this.bgmVolume <= 0) {
        bgmAudio.pause();
      } else if (this.enabled && state.running && !state.roundOver && !state.paused) {
        this.startBgm();
      }
    },

    setSfxVolume(volume) {
      this.sfxVolume = clamp(volume, 0, 1);
      this.applyVolumes();
    },

    startBgm() {
      if (!this.enabled || this.bgmVolume <= 0) return;
      bgmAudio.play().catch(() => {});
    },

    pauseBgm() {
      bgmAudio.pause();
    },

    stopBgm() {
      bgmAudio.pause();
      bgmAudio.currentTime = 0;
    },

    playClip(clip) {
      if (!this.enabled || !clip) return;
      clip.volume = (clip.baseVolume ?? 1) * this.sfxVolume;
      clip.currentTime = 0;
      clip.play().catch(() => {});
    },

    playFromPool(pool) {
      if (!this.enabled || !pool?.length) return;
      const clip = pool[this.poolIndex % pool.length];
      this.poolIndex += 1;
      this.playClip(clip);
    },

    tone(freq, duration = 0.08, type = "sine", gain = 0.05, delay = 0) {
      if (!this.enabled || !this.context || this.context.state !== "running") return;
      const now = this.context.currentTime + delay;
      const osc = this.context.createOscillator();
      const amp = this.context.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.exponentialRampToValueAtTime(gain, now + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(amp);
      amp.connect(this.master);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    },

    convert(type) {
      this.attack();
      this.tone(typeInfo[type].tone, 0.07, "triangle", 0.035);
      this.tone(typeInfo[type].tone * 1.5, 0.05, "sine", 0.02, 0.035);
    },

    attack() {
      const now = performance.now();
      if (now - this.lastAttackAt < 32) return;
      this.lastAttackAt = now;
      this.playFromPool(sampleAudio.attack);
    },

    shield() {
      this.tone(420, 0.08, "square", 0.025);
      this.tone(260, 0.1, "triangle", 0.018, 0.025);
    },

    pickup(kind) {
      const isSpeed = kind === "speed" || kind === "teamSpeed";
      const isShield = kind === "shield" || kind === "teamShield";
      const base = isSpeed ? 560 : isShield ? 440 : 680;
      this.tone(base, 0.07, "sine", 0.04);
      this.tone(base * 1.33, 0.09, "triangle", 0.025, 0.045);
    },

    event() {
      this.tone(360, 0.12, "sawtooth", 0.028);
      this.tone(540, 0.14, "triangle", 0.02, 0.06);
    },

    void() {
      this.tone(92, 0.18, "sawtooth", 0.04);
      this.tone(58, 0.22, "triangle", 0.025, 0.04);
    },

    warningDengDeng() {
      this.playClip(sampleAudio.warningDengDeng);
      this.event();
    },

    warningDiuDiu() {
      this.playClip(sampleAudio.warningDiuDiu);
    },

    snap() {
      if (!this.enabled) return false;
      snapAudio.currentTime = 0;
      snapAudio.play().catch(() => {
        this.event();
      });
      return true;
    },

    finalWin(type) {
      this.playClip(sampleAudio.win);
      this.win(type);
    },

    win(type) {
      const root = typeInfo[type]?.tone || 220;
      this.tone(root, 0.16, "triangle", 0.05);
      this.tone(root * 1.25, 0.18, "sine", 0.035, 0.08);
      this.tone(root * 1.5, 0.22, "sine", 0.035, 0.16);
    },
  };
}
