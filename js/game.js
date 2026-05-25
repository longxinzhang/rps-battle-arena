(() => {
  "use strict";

  const app = document.getElementById("app");
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const ui = {
    hud: document.getElementById("hud"),
    startScreen: document.getElementById("start-screen"),
    betScreen: document.getElementById("bet-screen"),
    betCountdown: document.getElementById("bet-countdown"),
    thanosScreen: document.getElementById("thanos-screen"),
    tenFightScreen: document.getElementById("ten-fight-screen"),
    tenFightTitle: document.getElementById("ten-fight-title"),
    tenFightSubtext: document.getElementById("ten-fight-subtext"),
    tenFightBar: document.getElementById("ten-fight-bar"),
    tenFightBarFill: document.getElementById("ten-fight-bar-fill"),
    tenFightTime: document.getElementById("ten-fight-time"),
    resultScreen: document.getElementById("result-screen"),
    settingsPanel: document.getElementById("settings-panel"),
    brandMark: document.getElementById("brand-mark"),
    brandSubtitle: document.getElementById("brand-subtitle"),
    startBtn: document.getElementById("start-btn"),
    restartBtn: document.getElementById("restart-btn"),
    nextRoundBtn: document.getElementById("next-round-btn"),
    pauseToggle: document.getElementById("pause-toggle"),
    homeBtn: document.getElementById("home-btn"),
    godHandToggle: document.getElementById("god-hand-toggle"),
    settingsToggle: document.getElementById("settings-toggle"),
    settingsClose: document.getElementById("settings-close"),
    soundToggle: document.getElementById("sound-toggle"),
    pushTool: document.getElementById("push-tool"),
    pullTool: document.getElementById("pull-tool"),
    eventFeed: document.getElementById("event-feed"),
    bettingControls: document.getElementById("betting-controls"),
    tournamentControls: document.getElementById("tournament-controls"),
    score: [
      document.getElementById("s-rock"),
      document.getElementById("s-scissors"),
      document.getElementById("s-paper"),
    ],
    odds: [
      document.getElementById("odds-rock"),
      document.getElementById("odds-scissors"),
      document.getElementById("odds-paper"),
    ],
    roundIndex: document.getElementById("round-index"),
    roundTotal: document.getElementById("round-total"),
    matchScore: document.getElementById("match-score"),
    timer: document.getElementById("timer"),
    bank: document.getElementById("bank"),
    winnerEmoji: document.getElementById("winner-emoji"),
    winnerText: document.getElementById("winner-text"),
    winnerSubtext: document.getElementById("winner-subtext"),
    nextBetPanel: document.getElementById("next-bet-panel"),
    nextStake: document.getElementById("next-stake"),
    inputs: {
      rock: document.getElementById("cfg-rock"),
      scissors: document.getElementById("cfg-scissors"),
      paper: document.getElementById("cfg-paper"),
      names: [
        document.getElementById("cfg-name-0"),
        document.getElementById("cfg-name-1"),
        document.getElementById("cfg-name-2"),
      ],
      syncCounts: document.getElementById("cfg-sync-counts"),
      duration: document.getElementById("cfg-duration"),
      bgmVolume: document.getElementById("cfg-bgm-volume"),
      sfxVolume: document.getElementById("cfg-sfx-volume"),
      notifications: document.getElementById("cfg-notifications"),
      liveBgmVolume: document.getElementById("live-bgm-volume"),
      liveSfxVolume: document.getElementById("live-sfx-volume"),
      liveNotifications: document.getElementById("live-notifications"),
      stake: document.getElementById("cfg-stake"),
      penalty: document.getElementById("cfg-penalty"),
      betting: document.getElementById("opt-betting"),
      tournament: document.getElementById("opt-tournament"),
      deathmatch: document.getElementById("opt-deathmatch"),
      zones: document.getElementById("opt-zones"),
      godHand: document.getElementById("opt-god-hand"),
      obstacles: document.getElementById("opt-obstacles"),
      shrink: document.getElementById("opt-shrink"),
      bounty: document.getElementById("opt-bounty"),
      traitor: document.getElementById("opt-traitor"),
      blackHole: document.getElementById("opt-black-hole"),
      powerups: document.getElementById("opt-powerups"),
      tenFight: document.getElementById("opt-ten-fight"),
      lastStand: document.getElementById("opt-last-stand"),
      thanos: document.getElementById("opt-thanos"),
    },
    nextOdds: [
      document.getElementById("next-odds-rock"),
      document.getElementById("next-odds-scissors"),
      document.getElementById("next-odds-paper"),
    ],
    presetButtons: [...document.querySelectorAll("[data-preset]")],
    themeButtons: [...document.querySelectorAll("[data-theme]")],
    setupSummaries: [...document.querySelectorAll("[data-setup-summary]")],
  };

  const TYPES = {
    ROCK: 0,
    SCISSORS: 1,
    PAPER: 2,
  };

  const THEMES = {
    rps: {
      mark: "🪨✂️✋🏻",
      subtitle: "石头剪刀布 · 物理碰撞吞并战",
      types: [
        { key: "rock", label: "石头", emoji: "🪨", color: "#d95c47", tone: 196 },
        { key: "scissors", label: "剪刀", emoji: "✂️", color: "#2c8f7f", tone: 277 },
        { key: "paper", label: "布", emoji: "✋🏻", color: "#4e6edb", tone: 330 },
      ],
    },
    colors: {
      mark: "🔴🟢🔵",
      subtitle: "颜色球联赛 · 红绿蓝循环吞并",
      types: [
        { key: "red", label: "红球", emoji: "🔴", color: "#e84f4f", tone: 196 },
        { key: "green", label: "绿球", emoji: "🟢", color: "#22a65a", tone: 277 },
        { key: "blue", label: "蓝球", emoji: "🔵", color: "#3478f6", tone: 330 },
      ],
    },
    countries: {
      mark: "🇨🇳🇺🇸🇧🇷",
      subtitle: "国家队表演赛 · 阵营身份换皮",
      types: [
        { key: "china", label: "中国队", emoji: "🇨🇳", color: "#de3f32", tone: 196 },
        { key: "usa", label: "美国队", emoji: "🇺🇸", color: "#2456c6", tone: 277 },
        { key: "brazil", label: "巴西队", emoji: "🇧🇷", color: "#18a55f", tone: 330 },
      ],
    },
    brands: {
      mark: "◆✦⬢",
      subtitle: "虚构品牌战 · 三家公司抢占场面",
      types: [
        { key: "nova", label: "Nova", emoji: "◆", color: "#e0574f", tone: 196 },
        { key: "pulse", label: "Pulse", emoji: "✦", color: "#15a38b", tone: 277 },
        { key: "orbit", label: "Orbit", emoji: "⬢", color: "#5867db", tone: 330 },
      ],
    },
  };

  const TYPE_INFO = THEMES.rps.types.map((item) => ({ ...item }));

  const PRESETS = {
    classic: {
      options: {
        deathmatch: true,
      },
    },
    zones: {
      options: {
        zones: true,
        blackHole: true,
        lastStand: true,
      },
    },
    traitor: {
      options: {
        deathmatch: true,
        shrink: true,
        blackHole: true,
        traitor: true,
      },
    },
    equality: {
      options: {
        deathmatch: true,
        obstacles: true,
        thanos: true,
      },
    },
  };

  const POWER_INFO = {
    speed: { label: "加速", icon: "⚡", color: "#ef9b20" },
    shield: { label: "护盾", icon: "◌", color: "#20a4f3" },
    split: { label: "分裂", icon: "✦", color: "#7c5cff" },
    teamSpeed: { label: "团队加速", icon: "⚡+", color: "#f59e0b" },
    teamShield: { label: "团队护盾", icon: "◌+", color: "#0ea5e9" },
    teamSplit: { label: "团队分裂", icon: "✦+", color: "#8b5cf6" },
  };

  const BASE_RADIUS = 17;
  const BASE_SPEED = 2.25;
  const CHASE_STRENGTH = 0.014;
  const FLEE_STRENGTH = 0.01;
  const FRICTION = 0.992;
  const CONVERT_COOLDOWN = 280;
  const DEFAULT_ROUND_LIMIT = 60000;
  const FIELD_RADIUS = 146;
  const MAX_ENTITIES = 180;
  const SHRINK_DELAY = 9000;
  const SHRINK_INTERVAL = 5400;
  const SHRINK_STEP = 18;
  const SHRINK_FINAL_STEP = 14;
  const SHRINK_FINAL_SETTLE = 9000;
  const SHRINK_MIN_ARENA = 118;
  const LAST_STAND_SPLIT_CHANCE = 0.76;
  const LAST_STAND_REVIVE_CHANCE = 0.22;
  const LAST_STAND_REVIVE_DELAY = 5000;
  const SNAP_REVEAL_DELAY = 1450;
  const SNAP_OVERLAY_DURATION = 4200;
  const CONTROL_ZONE_RADIUS = 58;
  const CONTROL_ZONE_CAPTURE_RATE = 0.0085;
  const CONTROL_ZONE_SCORE_RATE = 0.018;
  const CONTROL_ZONE_TARGET = 80;
  const BOUNTY_SHARE = 0.54;
  const BOUNTY_LEAD = 6;
  const BOUNTY_CHASE_STRENGTH = 0.009;
  const TRAITOR_EARLY_START = 10000;
  const TRAITOR_EARLY_END = 15000;
  const TRAITOR_FIRST_DELAY = 20000;
  const TRAITOR_INTERVAL = 10000;
  const TRAITOR_WARNING_DURATION = 2000;
  const TRAITOR_COLOR = "#8b5cf6";
  const BLACK_HOLE_BASE_RADIUS = 24;
  const BLACK_HOLE_PULL_RADIUS = 165;
  const BLACK_HOLE_GROWTH = 1.3;
  const BLACK_HOLE_MAX_RADIUS = 74;
  const BLACK_HOLE_MAX_PULL_RADIUS = 360;
  const TEN_FIGHT_DURATION = 10000;
  const TEN_FIGHT_FREEZE = 1600;
  const TEN_FIGHT_TRIGGER_CHANCE = 0.1;
  const TEN_FIGHT_RATIO = 10;
  const TEN_FIGHT_CHECK_INTERVAL = 1200;
  const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let nextEntityId = 1;

  const state = {
    W: 0,
    H: 0,
    dpr: 1,
    entities: [],
    obstacles: [],
    powerUps: [],
    blackHoles: [],
    pendingTraitors: [],
    particles: [],
    running: false,
    paused: false,
    roundOver: false,
    suddenDeath: false,
    animId: 0,
    lastTs: 0,
    roundStart: 0,
    nextPowerAt: 0,
    nextTraitorAt: 0,
    nextBlackHoleAt: 0,
    traitorEarlyUsed: false,
    roundLimit: DEFAULT_ROUND_LIMIT,
    countdownTimer: 0,
    countdownTimers: [],
    theme: "rps",
    roundIndex: 1,
    bestOf: 3,
    wins: [0, 0, 0],
    penalties: [0, 0, 0],
    baseCounts: [10, 10, 10],
    customLabels: {
      colors: THEMES.colors.types.map((item) => item.label),
      countries: THEMES.countries.types.map((item) => item.label),
      brands: THEMES.brands.types.map((item) => item.label),
    },
    winnerPenalty: 5,
    bank: 1000,
    prediction: 0,
    stake: 100,
    odds: [2, 2, 2],
    settings: {
      bgmVolume: 0.45,
      sfxVolume: 0.8,
      notifications: true,
    },
    options: {
      betting: false,
      tournament: false,
      deathmatch: false,
      zones: false,
      godHand: false,
      obstacles: false,
      shrink: false,
      bounty: false,
      traitor: false,
      blackHole: false,
      powerups: false,
      tenFight: false,
      lastStand: false,
      thanos: false,
    },
    zones: {
      points: [],
      scores: [0, 0, 0],
    },
    bounty: {
      active: false,
      leader: null,
      lastLeader: null,
    },
    lastStand: {
      splitUsed: [false, false, false],
      reviveUsed: [false, false, false],
      pendingRevives: [],
      lastCounts: [0, 0, 0],
      lastPositions: [null, null, null],
    },
    arena: {
      padding: 0,
      targetPadding: 0,
      maxPadding: 0,
      hardMaxPadding: 0,
      lastShrink: 0,
      finalAt: 0,
      finalStarted: false,
    },
    pointer: {
      active: false,
      x: 0,
      y: 0,
      px: 0,
      py: 0,
      vx: 0,
      vy: 0,
      lastMove: -1000,
      mode: "push",
    },
    thanos: {
      nextAt: Infinity,
      warningAt: Infinity,
      active: false,
      applied: false,
      used: false,
      warned: false,
      snapAt: Infinity,
      hideAt: Infinity,
    },
    tenFight: {
      used: false,
      pending: false,
      active: false,
      minority: null,
      majority: null,
      checkAt: 0,
      freezeUntil: 0,
      startAt: 0,
      endAt: 0,
      overlayTimer: 0,
      lastKillAt: 0,
    },
  };

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

  const audio = {
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
      this.tone(TYPE_INFO[type].tone, 0.07, "triangle", 0.035);
      this.tone(TYPE_INFO[type].tone * 1.5, 0.05, "sine", 0.02, 0.035);
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

    finalWin(type) {
      this.playClip(sampleAudio.win);
      this.win(type);
    },

    win(type) {
      const root = TYPE_INFO[type]?.tone || 220;
      this.tone(root, 0.16, "triangle", 0.05);
      this.tone(root * 1.25, 0.18, "sine", 0.035, 0.08);
      this.tone(root * 1.5, 0.22, "sine", 0.035, 0.16);
    },
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function countInputs() {
    return [ui.inputs.rock, ui.inputs.scissors, ui.inputs.paper];
  }

  function sanitizeCount(value) {
    return clamp(parseInt(value, 10) || 10, 3, 60);
  }

  function defaultThemeLabel(themeKey, index) {
    return THEMES[themeKey]?.types[index]?.label || THEMES.rps.types[index].label;
  }

  function customThemeLabel(themeKey, index) {
    if (themeKey === "rps") return defaultThemeLabel(themeKey, index);
    const label = state.customLabels[themeKey]?.[index]?.trim();
    return label || defaultThemeLabel(themeKey, index);
  }

  function updateTypeDom() {
    document.querySelectorAll("[data-type-emoji]").forEach((element) => {
      element.textContent = TYPE_INFO[parseInt(element.dataset.typeEmoji, 10)].emoji;
    });
    document.querySelectorAll("[data-type-label]").forEach((element) => {
      element.textContent = TYPE_INFO[parseInt(element.dataset.typeLabel, 10)].label;
    });
  }

  function syncCustomNameControls() {
    const canCustomize = state.theme !== "rps";
    document.querySelectorAll(".custom-name-row").forEach((row) => {
      row.classList.toggle("hidden", !canCustomize);
    });
    ui.inputs.names.forEach((input, index) => {
      input.disabled = !canCustomize;
      input.value = customThemeLabel(state.theme, index);
    });
  }

  function applyCustomLabel(index, value) {
    if (state.theme === "rps") return;
    const label = value.trim() || defaultThemeLabel(state.theme, index);
    state.customLabels[state.theme][index] = label;
    TYPE_INFO[index].label = label;
    updateTypeDom();
    syncPredictionButtons();
    updateSetupSummaries();
    draw();
  }

  function applyTheme(themeKey) {
    const key = THEMES[themeKey] ? themeKey : "rps";
    const theme = THEMES[key];
    state.theme = key;
    theme.types.forEach((item, index) => {
      Object.assign(TYPE_INFO[index], item, { label: customThemeLabel(key, index) });
    });

    const root = document.documentElement;
    root.style.setProperty("--rock", TYPE_INFO[0].color);
    root.style.setProperty("--scissors", TYPE_INFO[1].color);
    root.style.setProperty("--paper", TYPE_INFO[2].color);
    ui.brandMark.textContent = theme.mark;
    ui.brandSubtitle.textContent = theme.subtitle;
    ui.themeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.theme === key);
    });
    updateTypeDom();
    syncCustomNameControls();
    syncPredictionButtons();
    updateHud();
    updateSetupSummaries();
    draw();
  }

  function beats(a, b) {
    return (a === TYPES.ROCK && b === TYPES.SCISSORS)
      || (a === TYPES.SCISSORS && b === TYPES.PAPER)
      || (a === TYPES.PAPER && b === TYPES.ROCK);
  }

  function preyType(type) {
    return (type + 1) % 3;
  }

  function predatorType(type) {
    return (type + 2) % 3;
  }

  function syncViewportHeight() {
    const viewport = window.visualViewport;
    const height = Math.max(1, Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 320));
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }

  function syncHudMetrics() {
    const hudBox = ui.hud.getBoundingClientRect();
    const appBox = app.getBoundingClientRect();
    const top = Math.round(hudBox.bottom - appBox.top + 8);
    document.documentElement.style.setProperty("--event-top", `${top}px`);
  }

  function resize() {
    syncViewportHeight();
    const rect = app.getBoundingClientRect();
    state.dpr = window.devicePixelRatio || 1;
    state.W = Math.round(rect.width || window.innerWidth);
    state.H = Math.round(rect.height || window.innerHeight);
    canvas.width = Math.floor(state.W * state.dpr);
    canvas.height = Math.floor(state.H * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    syncHudMetrics();
    updateArenaMax();
    for (const entity of state.entities) {
      resolveArenaCollision(entity);
    }
  }

  function hudReserve() {
    if (state.W <= 560) return Math.min(112, state.H * 0.18);
    if (state.W <= 860) return Math.min(132, state.H * 0.22);
    return 76;
  }

  function bottomReserve() {
    const base = state.W <= 560 ? 112 : state.W <= 860 ? 100 : 86;
    return Math.min(base, Math.max(74, state.H * 0.26));
  }

  function updateArenaMax() {
    const top = hudReserve();
    const bottom = bottomReserve();
    const maxX = Math.max(0, (state.W - 270) / 2);
    const maxY = Math.max(0, (state.H - top - bottom - 250) / 2);
    state.arena.maxPadding = Math.max(0, Math.min(maxX, maxY, Math.min(state.W, state.H) * 0.22));
    const hardX = Math.max(0, (state.W - 40 - SHRINK_MIN_ARENA) / 2);
    const hardY = Math.max(0, (state.H - top - bottom - SHRINK_MIN_ARENA) / 1.68);
    state.arena.hardMaxPadding = Math.max(state.arena.maxPadding, Math.min(hardX, hardY));
    state.arena.targetPadding = Math.min(state.arena.targetPadding, state.arena.hardMaxPadding);
    state.arena.padding = Math.min(state.arena.padding, state.arena.hardMaxPadding);
  }

  function arenaBounds() {
    const pad = state.options.shrink ? state.arena.padding : 0;
    const topBase = hudReserve();
    const left = 20 + pad;
    const right = state.W - 20 - pad;
    const top = topBase + pad * 0.68;
    const bottom = state.H - bottomReserve() - pad;
    return { left, right, top, bottom };
  }

  function entityRadius(entity) {
    return BASE_RADIUS * (entity.mutant ? 1.32 : 1) * (isTenFightHero(entity) ? 1.16 : 1);
  }

  function createEntity(type, x, y, options = {}) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(BASE_SPEED * 0.45, BASE_SPEED * 1.25);
    return {
      id: nextEntityId++,
      type,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lastConverted: -Infinity,
      scale: options.mutant ? 1.28 : 1,
      mutant: Boolean(options.mutant),
      mutantShiftAt: Infinity,
      shield: Boolean(options.shield),
      speedUntil: 0,
      flash: 0,
      dead: false,
    };
  }

  function safePoint(radius = BASE_RADIUS, attempts = 80) {
    const bounds = arenaBounds();
    for (let i = 0; i < attempts; i += 1) {
      const point = {
        x: rand(bounds.left + radius, bounds.right - radius),
        y: rand(bounds.top + radius, bounds.bottom - radius),
      };
      if (!state.obstacles.some((obstacle) => pointHitsObstacle(point.x, point.y, radius + 4, obstacle))) {
        return point;
      }
    }
    return {
      x: (bounds.left + bounds.right) / 2 + rand(-20, 20),
      y: (bounds.top + bounds.bottom) / 2 + rand(-20, 20),
    };
  }

  function spawnEntities(counts) {
    state.entities = [];
    nextEntityId = 1;
    for (let type = 0; type < 3; type += 1) {
      for (let i = 0; i < counts[type]; i += 1) {
        const point = safePoint(BASE_RADIUS + 3);
        state.entities.push(createEntity(type, point.x, point.y));
      }
    }
  }

  function generateObstacles() {
    state.obstacles = [];
    if (!state.options.obstacles) return;
    const bounds = arenaBounds();
    const area = Math.max(1, (bounds.right - bounds.left) * (bounds.bottom - bounds.top));
    const count = clamp(Math.round(area / 155000), 3, 7);
    for (let i = 0; i < count; i += 1) {
      const shape = Math.random() < 0.58 ? "circle" : "rect";
      const point = safePoint(58, 120);
      if (shape === "circle") {
        state.obstacles.push({
          shape,
          x: point.x,
          y: point.y,
          r: rand(25, 48),
        });
      } else {
        state.obstacles.push({
          shape,
          x: point.x,
          y: point.y,
          w: rand(82, 136),
          h: rand(22, 38),
        });
      }
    }
  }

  function currentRoundCounts() {
    return state.baseCounts.map((count, type) => Math.max(3, count - state.penalties[type]));
  }

  function readSetup() {
    let r = sanitizeCount(ui.inputs.rock.value);
    let s = sanitizeCount(ui.inputs.scissors.value);
    let p = sanitizeCount(ui.inputs.paper.value);
    if (ui.inputs.syncCounts.checked) {
      s = r;
      p = r;
    }
    const duration = clamp(parseInt(ui.inputs.duration.value, 10) || 60, 10, 300);
    const stakeMax = Math.max(0, state.bank);
    const stake = clamp(parseInt(ui.inputs.stake.value, 10) || 0, 0, stakeMax);
    ui.inputs.rock.value = r;
    ui.inputs.scissors.value = s;
    ui.inputs.paper.value = p;
    ui.inputs.duration.value = duration;
    ui.inputs.stake.value = stake;
    state.baseCounts = [r, s, p];
    state.roundLimit = duration * 1000;
    state.stake = stake;
    state.winnerPenalty = clamp(parseInt(ui.inputs.penalty.value, 10) || 0, 0, 20);
    ui.inputs.penalty.value = state.winnerPenalty;
    state.options.betting = ui.inputs.betting.checked;
    state.options.tournament = ui.inputs.tournament.checked;
    state.options.deathmatch = ui.inputs.deathmatch.checked;
    state.options.zones = ui.inputs.zones.checked;
    state.options.godHand = ui.inputs.godHand.checked;
    state.bestOf = state.options.tournament
      ? parseInt(document.querySelector("#match-length button.active").dataset.bestOf, 10)
      : 1;
    state.options.obstacles = ui.inputs.obstacles.checked;
    state.options.shrink = ui.inputs.shrink.checked;
    state.options.bounty = ui.inputs.bounty.checked;
    state.options.traitor = ui.inputs.traitor.checked;
    state.options.blackHole = ui.inputs.blackHole.checked;
    state.options.powerups = ui.inputs.powerups.checked;
    state.options.tenFight = ui.inputs.tenFight.checked;
    state.options.lastStand = ui.inputs.lastStand.checked;
    state.options.thanos = ui.inputs.thanos.checked;
    state.settings.notifications = ui.inputs.notifications.checked;
    syncNotificationControls();
    updateOptionVisibility();
  }

  function calculateOdds(counts) {
    const total = counts.reduce((sum, count) => sum + count, 0);
    return counts.map((count, type) => {
      const prey = counts[preyType(type)];
      const predator = counts[predatorType(type)];
      const strength = Math.max(1.2, count + prey * 0.3 - predator * 0.18);
      return clamp((total / strength) * 0.72, 1.18, 4.8);
    });
  }

  function updateOddsFromInputs() {
    const counts = [
      sanitizeCount(ui.inputs.rock.value),
      sanitizeCount(ui.inputs.scissors.value),
      sanitizeCount(ui.inputs.paper.value),
    ];
    state.odds = calculateOdds(counts);
    updateOddsLabels(ui.odds, state.odds);
  }

  function updateOddsLabels(target, odds) {
    for (let i = 0; i < 3; i += 1) {
      target[i].textContent = `x${odds[i].toFixed(2)}`;
    }
  }

  function syncCountInput(source) {
    const value = sanitizeCount(source.value);
    if (ui.inputs.syncCounts.checked) {
      countInputs().forEach((input) => {
        input.value = String(value);
      });
    } else {
      source.value = String(value);
    }
    updateOddsFromInputs();
    updateSetupSummaries();
  }

  function presetCount() {
    return window.matchMedia("(max-width: 560px)").matches ? 10 : 30;
  }

  function setCounts(value) {
    ui.inputs.syncCounts.checked = true;
    countInputs().forEach((input) => {
      input.value = String(value);
    });
  }

  function clearGameplayOptions() {
    [
      ui.inputs.betting,
      ui.inputs.tournament,
      ui.inputs.deathmatch,
      ui.inputs.zones,
      ui.inputs.godHand,
      ui.inputs.obstacles,
      ui.inputs.shrink,
      ui.inputs.bounty,
      ui.inputs.traitor,
      ui.inputs.blackHole,
      ui.inputs.powerups,
      ui.inputs.tenFight,
      ui.inputs.lastStand,
      ui.inputs.thanos,
    ].forEach((input) => {
      input.checked = false;
    });
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    setCounts(presetCount());
    clearGameplayOptions();
    for (const [option, enabled] of Object.entries(preset.options)) {
      if (ui.inputs[option]) {
        ui.inputs[option].checked = enabled;
      }
    }
    ui.presetButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === key);
    });
    syncOptionsFromInputs();
    updateOddsFromInputs();
  }

  function setupSummary(key, text) {
    const target = ui.setupSummaries.find((item) => item.dataset.setupSummary === key);
    if (target) target.textContent = text;
  }

  function selectedOptions(items, fallback = "默认") {
    const active = items
      .filter(([input]) => input.checked)
      .map(([, label]) => label);
    if (!active.length) return fallback;
    if (active.length <= 2) return active.join("、");
    return `${active.slice(0, 2).join("、")} +${active.length - 2}`;
  }

  function updateSetupSummaries() {
    const themeLabel = ui.themeButtons.find((button) => button.classList.contains("active"))?.textContent.trim() || "RPS";
    const counts = [
      sanitizeCount(ui.inputs.rock.value),
      sanitizeCount(ui.inputs.scissors.value),
      sanitizeCount(ui.inputs.paper.value),
    ];
    const duration = ui.inputs.deathmatch.checked
      ? "死斗"
      : `${clamp(parseInt(ui.inputs.duration.value, 10) || 60, 10, 300)}秒`;
    setupSummary("lineup", `${themeLabel} · ${counts.join("/")} · ${duration}`);
    setupSummary(
      "settings",
      `BGM ${Math.round(state.settings.bgmVolume * 100)}% · 音效 ${Math.round(state.settings.sfxVolume * 100)}% · 通知${state.settings.notifications ? "开" : "关"}`,
    );
    setupSummary("mechanics", selectedOptions([
      [ui.inputs.godHand, "上帝之手"],
      [ui.inputs.obstacles, "障碍"],
      [ui.inputs.shrink, "缩圈"],
      [ui.inputs.bounty, "悬赏"],
    ]));
    setupSummary("events", selectedOptions([
      [ui.inputs.traitor, "叛徒"],
      [ui.inputs.blackHole, "黑洞"],
      [ui.inputs.powerups, "道具"],
      [ui.inputs.tenFight, "打十个"],
      [ui.inputs.lastStand, "绝地"],
      [ui.inputs.thanos, "响指"],
    ]));
    setupSummary("format", selectedOptions([
      [ui.inputs.tournament, "多局"],
      [ui.inputs.deathmatch, "死斗"],
      [ui.inputs.zones, "据点"],
    ], "单局"));
    setupSummary("betting", ui.inputs.betting.checked
      ? `已开 · ${clamp(parseInt(ui.inputs.stake.value, 10) || 0, 0, 1000)}`
      : "未开");
  }

  function updateOptionVisibility() {
    ui.bettingControls.classList.toggle("disabled", !ui.inputs.betting.checked);
    ui.tournamentControls.classList.toggle("disabled", !ui.inputs.tournament.checked);
    ui.bettingControls.querySelectorAll("button, input").forEach((control) => {
      control.disabled = !ui.inputs.betting.checked;
    });
    ui.tournamentControls.querySelectorAll("button, input").forEach((control) => {
      control.disabled = !ui.inputs.tournament.checked;
    });
    ui.inputs.duration.disabled = ui.inputs.deathmatch.checked;
    ui.nextBetPanel.classList.toggle("hidden", !state.options.betting);
    canvas.classList.toggle("god-hand-on", state.options.godHand);
    ui.godHandToggle.classList.toggle("active", state.options.godHand);
    document.querySelectorAll(".field-tool").forEach((button) => {
      button.classList.toggle("hidden", !state.options.godHand);
    });
    ui.roundTotal.textContent = String(ui.inputs.tournament.checked ? state.bestOf : 1);
    if (ui.inputs.tournament.checked) {
      ui.matchScore.textContent = state.wins.join(" · ");
    } else if (ui.inputs.zones.checked) {
      ui.matchScore.textContent = `据点 ${state.zones.scores.map((score) => Math.floor(score)).join(" · ")}`;
    } else {
      ui.matchScore.textContent = "单局";
    }
    ui.timer.textContent = ui.inputs.deathmatch.checked
      ? "死斗"
      : `${(state.roundLimit / 1000).toFixed(1)}`;
    updateBank();
    updateSetupSummaries();
    requestAnimationFrame(syncHudMetrics);
  }

  function syncOptionsFromInputs() {
    state.options.betting = ui.inputs.betting.checked;
    state.options.tournament = ui.inputs.tournament.checked;
    state.options.deathmatch = ui.inputs.deathmatch.checked;
    state.options.zones = ui.inputs.zones.checked;
    state.options.godHand = ui.inputs.godHand.checked;
    state.options.obstacles = ui.inputs.obstacles.checked;
    state.options.shrink = ui.inputs.shrink.checked;
    state.options.bounty = ui.inputs.bounty.checked;
    state.options.traitor = ui.inputs.traitor.checked;
    state.options.blackHole = ui.inputs.blackHole.checked;
    state.options.powerups = ui.inputs.powerups.checked;
    state.options.tenFight = ui.inputs.tenFight.checked;
    state.options.lastStand = ui.inputs.lastStand.checked;
    state.options.thanos = ui.inputs.thanos.checked;
    state.roundLimit = clamp(parseInt(ui.inputs.duration.value, 10) || 60, 10, 300) * 1000;
    state.bestOf = state.options.tournament
      ? parseInt(document.querySelector("#match-length button.active").dataset.bestOf, 10)
      : 1;
    updateOptionVisibility();
  }

  function setVolume(kind, value) {
    const percent = clamp(parseInt(value, 10) || 0, 0, 100);
    const volume = percent / 100;
    if (kind === "bgm") {
      state.settings.bgmVolume = volume;
      audio.setBgmVolume(volume);
    } else {
      state.settings.sfxVolume = volume;
      audio.setSfxVolume(volume);
    }
    syncVolumeControls(kind, percent);
  }

  function syncVolumeControls(kind, percent) {
    const controls = kind === "bgm"
      ? [ui.inputs.bgmVolume, ui.inputs.liveBgmVolume]
      : [ui.inputs.sfxVolume, ui.inputs.liveSfxVolume];
    for (const control of controls) {
      control.value = String(percent);
    }
    document.querySelectorAll(`[data-volume-value="${kind}"]`).forEach((label) => {
      label.textContent = `${percent}%`;
    });
    updateSetupSummaries();
  }

  function setNotifications(enabled) {
    state.settings.notifications = Boolean(enabled);
    syncNotificationControls();
    if (!state.settings.notifications) {
      ui.eventFeed.replaceChildren();
      ui.eventFeed.classList.remove("has-events");
    }
    updateSetupSummaries();
  }

  function syncNotificationControls() {
    ui.inputs.notifications.checked = state.settings.notifications;
    ui.inputs.liveNotifications.checked = state.settings.notifications;
  }

  async function startTournament() {
    await audio.init();
    audio.startBgm();
    readSetup();
    state.roundIndex = 1;
    state.wins = [0, 0, 0];
    state.penalties = [0, 0, 0];
    state.suddenDeath = false;
    state.bank = state.options.betting ? state.bank : 1000;
    showBetIntro();
  }

  function beginTournament() {
    ui.startScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    startRound();
  }

  function showBetIntro() {
    clearCountdownTimers();
    ui.startScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.remove("hidden");
    syncPredictionButtons();
    startBetCountdown();
  }

  function startBetCountdown() {
    clearCountdownTimers();
    const schedule = [
      [0, "3"],
      [1000, "2"],
      [2000, "1"],
      [3000, "开始！"],
    ];
    for (const [delay, text] of schedule) {
      state.countdownTimers.push(window.setTimeout(() => {
        ui.betCountdown.textContent = text;
      }, delay));
    }
    state.countdownTimers.push(window.setTimeout(beginTournament, 4000));
  }

  function clearCountdownTimers() {
    clearTimeout(state.countdownTimer);
    for (const timer of state.countdownTimers) {
      clearTimeout(timer);
    }
    state.countdownTimers = [];
  }

  function startRound() {
    const now = performance.now();
    state.running = true;
    state.paused = false;
    state.roundOver = false;
    state.suddenDeath = false;
    state.lastTs = 0;
    state.roundStart = now;
    state.nextPowerAt = now + rand(2600, 4300);
    state.nextTraitorAt = now + TRAITOR_FIRST_DELAY;
    state.nextBlackHoleAt = now + rand(13500, 18500);
    state.traitorEarlyUsed = false;
    resetThanosEvent(now);
    resetTenFightEvent(now);
    resetControlZones();
    resetBountyState();
    state.powerUps = [];
    state.blackHoles = [];
    state.pendingTraitors = [];
    state.particles = [];
    state.arena.padding = 0;
    state.arena.targetPadding = 0;
    state.arena.lastShrink = now;
    state.arena.finalAt = 0;
    state.arena.finalStarted = false;
    ui.pauseToggle.textContent = "暂停";
    ui.homeBtn.classList.add("hidden");
    ui.settingsPanel.classList.add("hidden");
    audio.startBgm();
    updateArenaMax();
    generateObstacles();
    generateControlZones();
    const counts = currentRoundCounts();
    state.odds = calculateOdds(counts);
    updateOddsLabels(ui.odds, state.odds);
    updateOddsLabels(ui.nextOdds, state.odds);
    spawnEntities(counts);
    resetLastStandState();
    updateHud();
    cancelAnimationFrame(state.animId);
    state.animId = requestAnimationFrame(loop);
  }

  function showStartScreen() {
    state.running = false;
    state.roundOver = true;
    cancelAnimationFrame(state.animId);
    clearCountdownTimers();
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    ui.thanosScreen.classList.add("hidden");
    hideTenFightUi();
    ui.settingsPanel.classList.add("hidden");
    ui.startScreen.classList.remove("hidden");
    ui.pauseToggle.textContent = "暂停";
    ui.homeBtn.classList.add("hidden");
    audio.stopBgm();
    updateOddsFromInputs();
    draw();
  }

  function finishRound(winnerType, reason) {
    if (state.roundOver) return;
    state.roundOver = true;
    state.running = false;
    cancelAnimationFrame(state.animId);
    audio.pauseBgm();
    if (reason === "ten-fight") {
      hideTenFightBar();
    } else {
      hideTenFightUi();
    }

    const counts = countEntities();
    let settlement = "本局没有结算";
    if (winnerType !== null && winnerType !== undefined) {
      if (state.options.tournament) {
        state.wins[winnerType] += 1;
        state.penalties[winnerType] += state.winnerPenalty;
      }
      settlement = settleBet(winnerType);
    }

    updateHud(counts);
    const maxWins = Math.ceil(state.bestOf / 2);
    const matchWinner = state.options.tournament
      ? state.wins.findIndex((wins) => wins >= maxWins)
      : -1;
    const isMatchDone = state.options.tournament && matchWinner !== -1;
    if (winnerType !== null && winnerType !== undefined) {
      if (!state.options.tournament || isMatchDone) {
        audio.finalWin(winnerType);
      } else {
        audio.win(winnerType);
      }
    }

    ui.winnerEmoji.textContent = winnerType === null ? "·" : TYPE_INFO[winnerType].emoji;
    ui.winnerText.textContent = winnerType === null
      ? "本局平局"
      : `${TYPE_INFO[winnerType].label}胜利`;

    let reasonText = "全场统一";
    if (reason === "timer") {
      reasonText = "时间到，数量领先";
    } else if (reason === "zones") {
      reasonText = "据点分数达标";
    } else if (reason === "zones-timer") {
      reasonText = "时间到，据点领先";
    } else if (reason === "sudden") {
      reasonText = "加时裁定";
    } else if (reason === "void") {
      reasonText = "全部消失";
    } else if (reason === "shrink") {
      reasonText = "终局缩圈裁定";
    } else if (reason === "ten-fight") {
      reasonText = "以弱胜强！";
    }
    let matchText = reasonText;
    if (state.options.tournament) {
      matchText = isMatchDone
        ? `赛点结束：${TYPE_INFO[matchWinner].label}拿下整场`
        : `胜场 ${formatWins()}，${reasonText}`;
    }

    ui.winnerSubtext.textContent = `${matchText}。${settlement}`;
    ui.nextRoundBtn.textContent = isMatchDone
      ? "新赛制"
      : state.options.tournament
        ? "下一局"
        : "再来一局";
    if (isMatchDone) {
      ui.nextBetPanel.classList.add("hidden");
    } else if (state.options.betting) {
      prepareNextBetPanel();
    } else {
      ui.nextBetPanel.classList.add("hidden");
    }
    ui.nextRoundBtn.onclick = isMatchDone ? showStartScreen : () => {
      applyNextBet();
      if (state.options.tournament) {
        state.roundIndex += 1;
      }
      ui.resultScreen.classList.add("hidden");
      showBetIntro();
    };
    ui.resultScreen.classList.remove("hidden");
  }

  function prepareNextBetPanel() {
    const nextOdds = calculateOdds(currentRoundCounts());
    state.odds = nextOdds;
    updateOddsLabels(ui.nextOdds, nextOdds);
    updateOddsLabels(ui.odds, nextOdds);
    ui.nextStake.value = String(clamp(
      parseInt(ui.inputs.stake.value, 10) || 0,
      0,
      Math.max(0, state.bank),
    ));
    ui.nextStake.max = String(Math.max(0, state.bank));
    syncPredictionButtons();
    ui.nextBetPanel.classList.remove("hidden");
  }

  function applyNextBet() {
    if (!state.options.betting) return;
    const stake = clamp(parseInt(ui.nextStake.value, 10) || 0, 0, Math.max(0, state.bank));
    state.stake = stake;
    ui.inputs.stake.value = stake;
    ui.nextStake.value = stake;
  }

  function settleBet(winnerType) {
    if (!state.options.betting) {
      updateBank();
      return "竞猜未开启";
    }
    const stake = clamp(parseInt(ui.inputs.stake.value, 10) || 0, 0, Math.max(0, state.bank));
    state.stake = stake;
    if (!stake) {
      updateBank();
      return "未下注";
    }
    if (state.prediction === winnerType) {
      const profit = Math.round(stake * (state.odds[winnerType] - 1));
      state.bank += profit;
      updateBank();
      return `猜中 +${profit}`;
    }
    state.bank = Math.max(0, state.bank - stake);
    updateBank();
    return `猜错 -${stake}`;
  }

  function formatWins() {
    return state.wins.map((wins, type) => `${TYPE_INFO[type].emoji}${wins}`).join(" ");
  }

  function setPrediction(type) {
    state.prediction = type;
    syncPredictionButtons();
  }

  function syncPredictionButtons() {
    document.querySelectorAll("[data-pick]").forEach((item) => {
      item.classList.toggle("active", parseInt(item.dataset.pick, 10) === state.prediction);
    });
    document.querySelectorAll("[data-intro-pick]").forEach((item) => {
      item.classList.toggle("active", parseInt(item.dataset.introPick, 10) === state.prediction);
    });
  }

  function updateBank() {
    if (!state.options.betting) {
      ui.bank.textContent = "未开";
      return;
    }
    ui.bank.textContent = String(state.bank);
    ui.inputs.stake.max = String(Math.max(0, state.bank));
    if ((parseInt(ui.inputs.stake.value, 10) || 0) > state.bank) {
      ui.inputs.stake.value = Math.max(0, state.bank);
    }
    ui.nextStake.max = String(Math.max(0, state.bank));
    if ((parseInt(ui.nextStake.value, 10) || 0) > state.bank) {
      ui.nextStake.value = Math.max(0, state.bank);
    }
  }

  function countEntities() {
    const counts = [0, 0, 0];
    for (const entity of state.entities) {
      if (!entity.dead) counts[entity.type] += 1;
    }
    return counts;
  }

  function factionSnapshot() {
    const counts = [0, 0, 0];
    const positions = [null, null, null];
    for (const entity of state.entities) {
      if (entity.dead) continue;
      counts[entity.type] += 1;
      positions[entity.type] = { x: entity.x, y: entity.y };
    }
    return { counts, positions };
  }

  function resetLastStandState() {
    const snapshot = factionSnapshot();
    state.lastStand.splitUsed = [false, false, false];
    state.lastStand.reviveUsed = [false, false, false];
    state.lastStand.pendingRevives = [];
    state.lastStand.lastCounts = snapshot.counts;
    state.lastStand.lastPositions = snapshot.positions;
  }

  function hasPendingRevives() {
    return state.options.lastStand && state.lastStand.pendingRevives.length > 0;
  }

  function updateHud(counts = countEntities()) {
    for (let i = 0; i < 3; i += 1) {
      ui.score[i].textContent = String(counts[i]);
    }
    ui.roundIndex.textContent = String(state.roundIndex);
    ui.roundTotal.textContent = String(state.options.tournament ? state.bestOf : 1);
    if (state.options.tournament) {
      ui.matchScore.textContent = state.wins.join(" · ");
    } else if (state.options.zones) {
      ui.matchScore.textContent = `据点 ${state.zones.scores.map((score) => Math.floor(score)).join(" · ")}`;
    } else {
      ui.matchScore.textContent = "单局";
    }
    updateBank();
    if (state.options.deathmatch) {
      ui.timer.textContent = "死斗";
    } else if (state.running && !state.roundOver) {
      const remaining = Math.max(0, state.roundLimit - (performance.now() - state.roundStart));
      ui.timer.textContent = (remaining / 1000).toFixed(1);
    } else {
      ui.timer.textContent = (state.roundLimit / 1000).toFixed(1);
    }
  }

  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const deltaMs = Math.min(34, Math.max(1, ts - state.lastTs));
    state.lastTs = ts;
    if (!state.paused) {
      update(ts, deltaMs / 16.6667);
      draw();
      const counts = updateAndCheckRound(ts);
      updateHud(counts);
    }
    state.animId = requestAnimationFrame(loop);
  }

  function updateAndCheckRound(now) {
    const counts = countEntities();
    const aliveTypes = counts
      .map((count, type) => ({ count, type }))
      .filter((item) => item.count > 0);

    if (hasPendingRevives()) {
      return counts;
    }

    if (aliveTypes.length === 0) {
      finishRound(null, "void");
      return counts;
    }
    if (aliveTypes.length === 1) {
      finishRound(aliveTypes[0].type, "elimination");
      return counts;
    }

    if (state.tenFight.pending || state.tenFight.active) {
      return counts;
    }

    if (state.options.shrink && state.arena.finalAt && now - state.arena.finalAt > SHRINK_FINAL_SETTLE) {
      const max = Math.max(...counts);
      const tied = counts
        .map((count, type) => ({ count, type }))
        .filter((item) => item.count === max);
      finishRound(pick(tied).type, "shrink");
      return counts;
    }

    const zoneWinner = controlZoneWinner();
    if (zoneWinner !== null) {
      finishRound(zoneWinner, "zones");
      return counts;
    }

    if (!state.options.deathmatch && now - state.roundStart >= state.roundLimit) {
      const decision = timedRoundDecision(counts);
      if (decision.tied.length === 1) {
        finishRound(decision.tied[0].type, decision.reason);
      } else if (!state.suddenDeath) {
        state.suddenDeath = true;
        state.roundStart = now - (state.roundLimit - 8000);
        addEvent("数量打平，进入 8 秒加时", "#d95c47");
        audio.event();
      } else {
        finishRound(pick(decision.tied).type, "sudden");
      }
    }
    return counts;
  }

  function controlZoneWinner() {
    if (!state.options.zones) return null;
    const max = Math.max(...state.zones.scores);
    if (max < CONTROL_ZONE_TARGET) return null;
    const tied = state.zones.scores
      .map((score, type) => ({ score, type }))
      .filter((item) => item.score === max);
    return tied.length === 1 ? tied[0].type : null;
  }

  function timedRoundDecision(counts) {
    if (state.options.zones) {
      const maxScore = Math.max(...state.zones.scores);
      const zoneTied = state.zones.scores
        .map((score, type) => ({ count: score, type }))
        .filter((item) => item.count === maxScore);
      if (maxScore >= 1 && zoneTied.length === 1) {
        return { tied: zoneTied, reason: "zones-timer" };
      }
    }
    const max = Math.max(...counts);
    const tied = counts
      .map((count, type) => ({ count, type }))
      .filter((item) => item.count === max);
    return { tied, reason: "timer" };
  }

  function update(now, dt) {
    updateTenFight(now);
    if (state.roundOver) {
      updateParticles(dt);
      return;
    }
    if (state.tenFight.pending) {
      updateParticles(dt);
      return;
    }

    updateArenaShrink(now, dt);
    updateBountyLeadership(now);
    maybeSpawnPowerUp(now);
    updatePendingTraitors(now);
    updateTraitorEvent(now);
    maybeSpawnBlackHole(now);
    updateThanosSnap(now);
    updateBlackHoles(now, dt);
    updatePowerUps(now, dt);
    updateEntities(now, dt);
    resolveEntityCollisions(now);
    state.entities = state.entities.filter((entity) => !entity.dead);
    updateControlZones(now, dt);
    updateLastStand(now);
    updateTenFight(now);
    if (state.roundOver) {
      updateParticles(dt);
      return;
    }
    maybeTriggerTenFight(now);
    updateParticles(dt);
  }

  function updateLastStand(now) {
    if (!state.options.lastStand) {
      const snapshot = factionSnapshot();
      state.lastStand.lastCounts = snapshot.counts;
      state.lastStand.lastPositions = snapshot.positions;
      state.lastStand.pendingRevives = [];
      return;
    }

    processPendingRevives(now);

    let snapshot = factionSnapshot();
    for (let type = 0; type < 3; type += 1) {
      if (snapshot.counts[type] !== 1 || state.lastStand.splitUsed[type]) continue;
      const survivor = state.entities.find((entity) => !entity.dead && entity.type === type);
      state.lastStand.splitUsed[type] = true;
      if (survivor && state.entities.length < MAX_ENTITIES && Math.random() < LAST_STAND_SPLIT_CHANCE) {
        splitLastSurvivor(survivor, now);
      }
    }

    snapshot = factionSnapshot();
    for (let type = 0; type < 3; type += 1) {
      const wasLastOne = state.lastStand.lastCounts[type] === 1;
      const isGone = snapshot.counts[type] === 0;
      const alreadyPending = state.lastStand.pendingRevives.some((revive) => revive.type === type);
      if (!wasLastOne || !isGone || state.lastStand.reviveUsed[type] || alreadyPending) continue;
      state.lastStand.reviveUsed[type] = true;
      if (Math.random() < LAST_STAND_REVIVE_CHANCE) {
        scheduleLastStandRevive(type, state.lastStand.lastPositions[type], now);
      }
    }

    snapshot = factionSnapshot();
    state.lastStand.lastCounts = snapshot.counts;
    state.lastStand.lastPositions = snapshot.positions;
  }

  function splitLastSurvivor(entity, now) {
    const angle = rand(0, Math.PI * 2);
    const radius = entityRadius(entity);
    const clone = createEntity(
      entity.type,
      entity.x + Math.cos(angle) * radius * 1.75,
      entity.y + Math.sin(angle) * radius * 1.75,
    );
    clone.vx = entity.vx * -0.35 + Math.cos(angle) * BASE_SPEED * 1.25;
    clone.vy = entity.vy * -0.35 + Math.sin(angle) * BASE_SPEED * 1.25;
    clone.scale = 1.65;
    clone.lastConverted = now;
    entity.scale = Math.max(entity.scale, 1.45);
    entity.flash = Math.max(entity.flash, 0.8);
    state.entities.push(clone);
    resolveArenaCollision(clone);
    emitBurst(entity.x, entity.y, TYPE_INFO[entity.type].color, 18, 3.2);
    addEvent(`${TYPE_INFO[entity.type].emoji} 绝地分裂`, TYPE_INFO[entity.type].color);
    audio.pickup("split");
  }

  function scheduleLastStandRevive(type, position, now) {
    if (!position) return;
    state.lastStand.pendingRevives.push({
      type,
      x: position.x,
      y: position.y,
      at: now + LAST_STAND_REVIVE_DELAY,
    });
    addEvent(`${TYPE_INFO[type].emoji} 绝地求生：5 秒后复活`, TYPE_INFO[type].color);
    audio.event();
  }

  function processPendingRevives(now) {
    const waiting = [];
    for (const revive of state.lastStand.pendingRevives) {
      if (now < revive.at) {
        waiting.push(revive);
        continue;
      }
      const entity = createEntity(
        revive.type,
        clamp(revive.x, arenaBounds().left + BASE_RADIUS, arenaBounds().right - BASE_RADIUS),
        clamp(revive.y, arenaBounds().top + BASE_RADIUS, arenaBounds().bottom - BASE_RADIUS),
        { shield: true },
      );
      entity.scale = 1.9;
      entity.lastConverted = now;
      state.entities.push(entity);
      resolveArenaCollision(entity);
      emitBurst(entity.x, entity.y, TYPE_INFO[revive.type].color, 26, 4);
      addEvent(`${TYPE_INFO[revive.type].emoji} 原地复活`, TYPE_INFO[revive.type].color);
      audio.win(revive.type);
    }
    state.lastStand.pendingRevives = waiting;
  }

  function resetTenFightEvent(now) {
    hideTenFightUi();
    Object.assign(state.tenFight, {
      used: false,
      pending: false,
      active: false,
      minority: null,
      majority: null,
      checkAt: now + TEN_FIGHT_CHECK_INTERVAL,
      freezeUntil: 0,
      startAt: 0,
      endAt: 0,
      lastKillAt: 0,
    });
  }

  function hideTenFightUi() {
    window.clearTimeout(state.tenFight.overlayTimer);
    state.tenFight.overlayTimer = 0;
    ui.tenFightScreen.classList.add("hidden");
    hideTenFightBar();
  }

  function hideTenFightBar() {
    ui.tenFightBar.classList.add("hidden");
    ui.tenFightBarFill.style.transform = "scaleX(0)";
  }

  function showTenFightOverlay(title, subtext, hideAfter = 0) {
    window.clearTimeout(state.tenFight.overlayTimer);
    state.tenFight.overlayTimer = 0;
    ui.tenFightTitle.textContent = title;
    ui.tenFightSubtext.textContent = subtext;
    ui.tenFightScreen.classList.remove("hidden");
    if (hideAfter > 0) {
      state.tenFight.overlayTimer = window.setTimeout(() => {
        ui.tenFightScreen.classList.add("hidden");
        state.tenFight.overlayTimer = 0;
      }, hideAfter);
    }
  }

  function maybeTriggerTenFight(now) {
    const tenFight = state.tenFight;
    if (!state.options.tenFight || tenFight.used || tenFight.pending || tenFight.active || state.roundOver) return;
    if (hasPendingRevives() || now < tenFight.checkAt) return;
    tenFight.checkAt = now + TEN_FIGHT_CHECK_INTERVAL;

    const candidate = tenFightCandidate();
    if (!candidate || Math.random() >= TEN_FIGHT_TRIGGER_CHANCE) return;
    triggerTenFight(candidate, now);
  }

  function tenFightCandidate() {
    const counts = countEntities();
    const alive = counts
      .map((count, type) => ({ count, type }))
      .filter((item) => item.count > 0)
      .sort((a, b) => a.count - b.count);
    if (alive.length !== 2) return null;

    const [minority, majority] = alive;
    if (minority.count <= 0 || majority.count < minority.count * TEN_FIGHT_RATIO) return null;
    if (!beats(majority.type, minority.type)) return null;

    return {
      minority: minority.type,
      majority: majority.type,
      minorityCount: minority.count,
      majorityCount: majority.count,
    };
  }

  function triggerTenFight(candidate, now) {
    const tenFight = state.tenFight;
    const info = TYPE_INFO[candidate.minority];
    Object.assign(tenFight, {
      used: true,
      pending: true,
      active: false,
      minority: candidate.minority,
      majority: candidate.majority,
      freezeUntil: now + TEN_FIGHT_FREEZE,
      startAt: 0,
      endAt: 0,
      lastKillAt: 0,
    });
    hideTenFightBar();
    showTenFightOverlay(
      `${info.emoji} 触发了「我要打十个」！`,
      `${candidate.minorityCount} 对 ${candidate.majorityCount}，克制关系即将反转`,
    );
    addEvent(`${info.emoji} 我要打十个触发`, "#f0b429");
    audio.warningDengDeng();
  }

  function updateTenFight(now) {
    const tenFight = state.tenFight;
    if (tenFight.pending) {
      if (now >= tenFight.freezeUntil) {
        tenFight.pending = false;
        tenFight.active = true;
        tenFight.startAt = now;
        tenFight.endAt = now + TEN_FIGHT_DURATION;
        ui.tenFightScreen.classList.add("hidden");
        updateTenFightBar(TEN_FIGHT_DURATION);
        addEvent(`${TYPE_INFO[tenFight.minority].emoji} 暴走反杀开始`, "#f0b429");
        audio.event();
      }
      return;
    }

    if (!tenFight.active) return;

    const counts = countEntities();
    if (counts[tenFight.minority] <= 0) {
      endTenFight(false);
      return;
    }
    if (counts[tenFight.majority] <= 0) {
      completeTenFightVictory();
      return;
    }

    const remaining = tenFight.endAt - now;
    updateTenFightBar(remaining);
    if (remaining <= 0) {
      endTenFight(false);
    }
  }

  function updateTenFightBar(remaining) {
    const safeRemaining = clamp(remaining, 0, TEN_FIGHT_DURATION);
    const progress = safeRemaining / TEN_FIGHT_DURATION;
    ui.tenFightBar.classList.remove("hidden");
    ui.tenFightBarFill.style.transform = `scaleX(${progress})`;
    ui.tenFightTime.textContent = `暴走 ${(safeRemaining / 1000).toFixed(1)}s`;
  }

  function endTenFight(announce) {
    state.tenFight.pending = false;
    state.tenFight.active = false;
    hideTenFightBar();
    if (announce === false) {
      addEvent("打十个结束，克制关系恢复", "#637067");
      audio.event();
    }
  }

  function completeTenFightVictory() {
    const winnerType = state.tenFight.minority;
    state.tenFight.pending = false;
    state.tenFight.active = false;
    hideTenFightBar();
    showTenFightOverlay(
      "以弱胜强！",
      `${TYPE_INFO[winnerType].emoji} ${TYPE_INFO[winnerType].label}完成反杀`,
      1400,
    );
    const members = aliveFactionMembers(winnerType);
    const center = members.length
      ? members.reduce((point, entity) => ({
        x: point.x + entity.x / members.length,
        y: point.y + entity.y / members.length,
      }), { x: 0, y: 0 })
      : { x: state.W / 2, y: state.H / 2 };
    emitBurst(center.x, center.y, "#f0b429", 42, 5.2);
    addEvent("以弱胜强，反杀完成", "#f0b429");
    finishRound(winnerType, "ten-fight");
  }

  function isTenFightHero(entity) {
    return state.tenFight.active && !entity.dead && entity.type === state.tenFight.minority;
  }

  function tenFightPreyType(entity) {
    if (!state.tenFight.active) return preyType(entity.type);
    if (entity.type === state.tenFight.minority) return state.tenFight.majority;
    if (entity.type === state.tenFight.majority && preyType(entity.type) === state.tenFight.minority) return null;
    return preyType(entity.type);
  }

  function tenFightPredatorType(entity) {
    if (!state.tenFight.active) return predatorType(entity.type);
    if (entity.type === state.tenFight.minority) return null;
    if (entity.type === state.tenFight.majority) return state.tenFight.minority;
    return predatorType(entity.type);
  }

  function resetThanosEvent(now) {
    const span = state.options.deathmatch ? rand(9000, 23000) : rand(7000, Math.max(9000, state.roundLimit * 0.72));
    state.thanos.nextAt = now + span;
    state.thanos.warningAt = state.thanos.nextAt - 3000;
    state.thanos.active = false;
    state.thanos.applied = false;
    state.thanos.used = false;
    state.thanos.warned = false;
    state.thanos.snapAt = Infinity;
    state.thanos.hideAt = Infinity;
    ui.thanosScreen.classList.add("hidden");
  }

  function updateThanosSnap(now) {
    if (!state.options.thanos) return;
    if (!state.thanos.warned && !state.thanos.used && state.entities.length >= 8 && now >= state.thanos.warningAt) {
      state.thanos.warned = true;
      audio.warningDengDeng();
      addEvent("危险来临：灭霸 3 秒后登场", "#f0b429");
    }
    if (!state.thanos.used && state.entities.length >= 8 && now >= state.thanos.nextAt) {
      triggerThanosSnap(now);
    }
    if (!state.thanos.active) return;
    if (!state.thanos.applied && now >= state.thanos.snapAt) {
      applyThanosSnap();
      state.thanos.applied = true;
    }
    if (now >= state.thanos.hideAt) {
      state.thanos.active = false;
      ui.thanosScreen.classList.add("hidden");
    }
  }

  function triggerThanosSnap(now) {
    state.thanos.used = true;
    state.thanos.active = true;
    state.thanos.applied = false;
    state.thanos.snapAt = now + SNAP_REVEAL_DELAY;
    state.thanos.hideAt = now + SNAP_OVERLAY_DURATION;
    ui.thanosScreen.classList.remove("hidden");
    playSnapAudio();
    addEvent("灭霸登场，响指将至", "#f0b429");
  }

  function playSnapAudio() {
    if (!audio.enabled) return;
    snapAudio.currentTime = 0;
    snapAudio.play().catch(() => {
      audio.event();
    });
  }

  function applyThanosSnap() {
    for (let type = 0; type < 3; type += 1) {
      const members = state.entities.filter((entity) => !entity.dead && entity.type === type);
      const removeCount = Math.floor(members.length / 2);
      shuffleInPlace(members);
      for (let i = 0; i < removeCount; i += 1) {
        const entity = members[i];
        entity.dead = true;
        emitBurst(entity.x, entity.y, "#f0b429", 18, 4);
      }
    }
    state.entities = state.entities.filter((entity) => !entity.dead);
    addEvent("响指完成：所有派系减半", "#f0b429");
    audio.void();
  }

  function shuffleInPlace(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  function resetControlZones() {
    state.zones.points = [];
    state.zones.scores = [0, 0, 0];
  }

  function generateControlZones() {
    if (!state.options.zones) return;
    const bounds = arenaBounds();
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const cx = (bounds.left + bounds.right) / 2;
    const cy = (bounds.top + bounds.bottom) / 2;
    const spreadX = Math.min(width * 0.26, 210);
    const spreadY = Math.min(height * 0.22, 150);
    const radius = clamp(Math.min(width, height) * 0.085, 42, CONTROL_ZONE_RADIUS);
    const positions = [
      { x: cx, y: cy - spreadY * 0.86 },
      { x: cx - spreadX, y: cy + spreadY * 0.72 },
      { x: cx + spreadX, y: cy + spreadY * 0.72 },
    ];
    state.zones.points = positions.map((point, index) => ({
      label: String.fromCharCode(65 + index),
      x: clamp(point.x, bounds.left + radius + 8, bounds.right - radius - 8),
      y: clamp(point.y, bounds.top + radius + 8, bounds.bottom - radius - 8),
      r: radius,
      owner: null,
      claimType: null,
      claim: 0,
      pulse: rand(0, Math.PI * 2),
    }));
    addEvent("据点争夺开始", "#20a4f3");
  }

  function updateControlZones(now, dt) {
    if (!state.options.zones || !state.zones.points.length) return;
    for (const zone of state.zones.points) {
      zone.pulse += 0.04 * dt;
      const presence = [0, 0, 0];
      for (const entity of state.entities) {
        if (entity.dead) continue;
        const dx = entity.x - zone.x;
        const dy = entity.y - zone.y;
        if (dx * dx + dy * dy <= zone.r * zone.r) {
          presence[entity.type] += 1;
        }
      }
      const ranked = presence
        .map((count, type) => ({ count, type }))
        .sort((a, b) => b.count - a.count);
      const hasDominant = ranked[0].count > 0 && ranked[0].count > ranked[1].count;
      if (hasDominant) {
        const dominant = ranked[0].type;
        if (zone.claimType !== dominant) {
          zone.claimType = dominant;
          zone.claim = zone.owner === dominant ? 1 : Math.max(0, zone.claim * 0.28);
        }
        const pressure = ranked[0].count - ranked[1].count;
        zone.claim = clamp(
          zone.claim + CONTROL_ZONE_CAPTURE_RATE * (1 + Math.min(pressure, 8) * 0.2) * dt,
          0,
          1,
        );
        if (zone.claim >= 1 && zone.owner !== dominant) {
          zone.owner = dominant;
          addEvent(`${TYPE_INFO[dominant].emoji} 占领据点 ${zone.label}`, TYPE_INFO[dominant].color);
          emitBurst(zone.x, zone.y, TYPE_INFO[dominant].color, 20, 4);
          audio.event();
        }
      } else if (zone.owner === null) {
        zone.claim *= Math.max(0, 1 - 0.012 * dt);
        if (zone.claim < 0.02) zone.claimType = null;
      }

      if (zone.owner !== null) {
        state.zones.scores[zone.owner] = Math.min(
          CONTROL_ZONE_TARGET,
          state.zones.scores[zone.owner] + CONTROL_ZONE_SCORE_RATE * dt,
        );
      }
    }
  }

  function resetBountyState() {
    state.bounty.active = false;
    state.bounty.leader = null;
    state.bounty.lastLeader = null;
  }

  function updateBountyLeadership(now) {
    if (!state.options.bounty) {
      state.bounty.active = false;
      state.bounty.leader = null;
      return;
    }
    const counts = countEntities();
    const total = counts.reduce((sum, count) => sum + count, 0);
    if (total < 12) {
      state.bounty.active = false;
      state.bounty.leader = null;
      return;
    }
    const ranked = counts
      .map((count, type) => ({ count, type }))
      .sort((a, b) => b.count - a.count);
    const leader = ranked[0];
    const lead = leader.count - ranked[1].count;
    const shouldBounty = leader.count / total >= BOUNTY_SHARE && lead >= BOUNTY_LEAD;
    if (!shouldBounty) {
      if (state.bounty.active && now - state.roundStart > 1400) {
        addEvent("悬赏解除", "#637067");
      }
      state.bounty.active = false;
      state.bounty.leader = null;
      return;
    }
    state.bounty.active = true;
    state.bounty.leader = leader.type;
    if (state.bounty.lastLeader !== leader.type) {
      state.bounty.lastLeader = leader.type;
      addEvent(`${TYPE_INFO[leader.type].emoji} 成为悬赏头名`, "#f0b429");
      audio.event();
    }
  }

  function updateArenaShrink(now, dt) {
    if (!state.options.shrink) return;
    if (now - state.roundStart > SHRINK_DELAY && now - state.arena.lastShrink > SHRINK_INTERVAL) {
      state.arena.lastShrink = now;
      const hardLimit = Math.max(state.arena.maxPadding, state.arena.hardMaxPadding);
      const atSoftLimit = state.arena.targetPadding >= state.arena.maxPadding - 1;
      const step = atSoftLimit ? SHRINK_FINAL_STEP : SHRINK_STEP;
      state.arena.targetPadding = Math.min(
        hardLimit,
        state.arena.targetPadding + step,
      );
      if (atSoftLimit && !state.arena.finalStarted) {
        state.arena.finalStarted = true;
        addEvent("终局缩圈启动", "#d95c47");
      }
      if (state.arena.targetPadding >= hardLimit - 1 && !state.arena.finalAt) {
        state.arena.finalAt = now;
        addEvent("终局压缩完成，准备裁定", "#d95c47");
      }
      addEvent("边界收缩", "#2c8f7f");
      audio.warningDiuDiu();
    }
    state.arena.padding += (state.arena.targetPadding - state.arena.padding) * 0.045 * dt;
  }

  function maybeSpawnPowerUp(now) {
    if (!state.options.powerups || now < state.nextPowerAt || state.powerUps.length >= 5) return;
    const kinds = [
      "speed",
      "shield",
      "split",
      "speed",
      "shield",
      "teamSpeed",
      "teamShield",
      "teamSplit",
    ];
    const kind = pick(kinds);
    const point = safePoint(22);
    state.powerUps.push({
      kind,
      x: point.x,
      y: point.y,
      r: 14,
      born: now,
      life: 10000,
      pulse: rand(0, Math.PI * 2),
    });
    state.nextPowerAt = now + rand(3800, 5900);
  }

  function updateTraitorEvent(now) {
    if (!state.options.traitor) {
      state.pendingTraitors = [];
      return;
    }
    if (maybeTriggerEarlyTraitor(now)) return;
    if (now < state.nextTraitorAt || state.entities.length < 6) return;
    const scheduled = [];
    const groups = [0, 1, 2]
      .map((type) => state.entities.filter((entity) => (
        !entity.dead && entity.type === type && !isPendingTraitor(entity)
      )))
      .filter((members) => members.length > 0);
    const traitorCount = Math.min(pick([1, 2]), groups.length);
    shuffleInPlace(groups);
    for (const members of groups.slice(0, traitorCount)) {
      const entity = pick(members);
      scheduleTraitor(entity, now);
      scheduled.push(TYPE_INFO[entity.type].emoji);
    }
    state.nextTraitorAt = now + TRAITOR_INTERVAL;
    if (scheduled.length > 0) {
      addEvent(`叛徒倒计时：${scheduled.join(" ")}`, TRAITOR_COLOR);
      audio.event();
    }
  }

  function maybeTriggerEarlyTraitor(now) {
    if (state.traitorEarlyUsed) return false;
    const elapsed = now - state.roundStart;
    if (elapsed < TRAITOR_EARLY_START) return false;
    if (elapsed > TRAITOR_EARLY_END) {
      state.traitorEarlyUsed = true;
      return false;
    }

    const counts = countEntities();
    const aliveTypes = counts
      .map((count, type) => ({ count, type }))
      .filter((item) => item.count > 0);
    if (aliveTypes.length !== 2) return false;

    const candidates = state.entities.filter((entity) => !entity.dead && !isPendingTraitor(entity));
    if (!candidates.length) return false;

    const entity = pick(candidates);
    const targetType = pick([0, 1, 2].filter((type) => type !== entity.type));
    scheduleTraitor(entity, now, { targetType });
    state.traitorEarlyUsed = true;
    addEvent(`早期叛徒倒计时：${TYPE_INFO[entity.type].emoji}`, TRAITOR_COLOR);
    audio.event();
    return true;
  }

  function scheduleTraitor(entity, now, options = {}) {
    state.pendingTraitors.push({
      id: entity.id,
      fromType: entity.type,
      targetType: options.targetType ?? null,
      born: now,
      at: now + TRAITOR_WARNING_DURATION,
    });
    entity.flash = Math.max(entity.flash, 0.8);
    entity.scale = Math.max(entity.scale, 1.3);
    emitBurst(entity.x, entity.y, TRAITOR_COLOR, 10, 2.8);
  }

  function updatePendingTraitors(now) {
    if (!state.options.traitor) {
      state.pendingTraitors = [];
      return;
    }
    if (!state.pendingTraitors.length) return;
    const waiting = [];
    const messages = [];
    for (const pending of state.pendingTraitors) {
      const entity = state.entities.find((item) => item.id === pending.id && !item.dead);
      if (!entity) continue;
      if (now < pending.at) {
        waiting.push(pending);
        continue;
      }
      messages.push(turnTraitor(entity, now, pending.targetType));
    }
    state.pendingTraitors = waiting;
    if (messages.length > 0) {
      addEvent(`叛徒出现：${messages.join(" ")}`, TRAITOR_COLOR);
      audio.event();
    }
  }

  function isPendingTraitor(entity) {
    return state.pendingTraitors.some((pending) => pending.id === entity.id);
  }

  function pendingTraitorFor(entity) {
    return state.pendingTraitors.find((pending) => pending.id === entity.id) || null;
  }

  function turnTraitor(entity, now, targetType = null) {
    const oldType = entity.type;
    entity.type = targetType !== null && targetType !== oldType
      ? targetType
      : pick([0, 1, 2].filter((type) => type !== oldType));
    entity.lastConverted = now;
    entity.scale = 1.78;
    entity.flash = 1;
    entity.vx += rand(-BASE_SPEED * 1.6, BASE_SPEED * 1.6);
    entity.vy += rand(-BASE_SPEED * 1.6, BASE_SPEED * 1.6);
    emitBurst(entity.x, entity.y, TRAITOR_COLOR, 24, 4.5);
    return `${TYPE_INFO[oldType].emoji}→${TYPE_INFO[entity.type].emoji}`;
  }

  function maybeSpawnBlackHole(now) {
    if (!state.options.blackHole || now < state.nextBlackHoleAt || state.blackHoles.length >= 1 || state.entities.length < 10) return;
    const point = safePoint(34);
    const angle = rand(0, Math.PI * 2);
    state.blackHoles.push({
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * 1.3,
      vy: Math.sin(angle) * 1.3,
      r: BLACK_HOLE_BASE_RADIUS,
      pullRadius: BLACK_HOLE_PULL_RADIUS,
      born: now,
      life: 8800,
      spin: rand(0, Math.PI * 2),
    });
    state.nextBlackHoleAt = now + rand(19000, 26000);
    addEvent("黑洞入场", "#1f1728");
    audio.warningDengDeng();
  }

  function updateBlackHoles(now, dt) {
    const bounds = arenaBounds();
    for (const hole of state.blackHoles) {
      hole.x += hole.vx * dt;
      hole.y += hole.vy * dt;
      hole.spin += 0.11 * dt;
      if (hole.x < bounds.left + hole.r || hole.x > bounds.right - hole.r) {
        hole.vx *= -1;
        hole.x = clamp(hole.x, bounds.left + hole.r, bounds.right - hole.r);
      }
      if (hole.y < bounds.top + hole.r || hole.y > bounds.bottom - hole.r) {
        hole.vy *= -1;
        hole.y = clamp(hole.y, bounds.top + hole.r, bounds.bottom - hole.r);
      }

      for (const entity of state.entities) {
        const dx = hole.x - entity.x;
        const dy = hole.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const pullRadius = hole.pullRadius || BLACK_HOLE_PULL_RADIUS;
        if (dist < pullRadius) {
          const pull = (1 - dist / pullRadius) * 0.035 * dt;
          entity.vx += (dx / dist) * pull;
          entity.vy += (dy / dist) * pull;
        }
        if (dist < hole.r + entityRadius(entity)) {
          if (entity.shield) {
            entity.shield = false;
            entity.vx -= (dx / dist) * BASE_SPEED * 2.8;
            entity.vy -= (dy / dist) * BASE_SPEED * 2.8;
            entity.scale = 1.45;
            audio.shield();
            emitBurst(entity.x, entity.y, "#20a4f3", 14, 3);
          } else {
            entity.dead = true;
            emitBurst(entity.x, entity.y, TYPE_INFO[entity.type].color, 18, 4);
            growBlackHole(hole, entity);
            audio.void();
          }
        }
      }
    }
    state.blackHoles = state.blackHoles.filter((hole) => now - hole.born < hole.life);
  }

  function growBlackHole(hole, entity) {
    hole.r = Math.min(BLACK_HOLE_MAX_RADIUS, hole.r * BLACK_HOLE_GROWTH);
    hole.pullRadius = Math.min(
      BLACK_HOLE_MAX_PULL_RADIUS,
      (hole.pullRadius || BLACK_HOLE_PULL_RADIUS) * BLACK_HOLE_GROWTH,
    );
    hole.spin += 0.9;
    emitBurst(entity.x, entity.y, "#1f1728", 10, 4);
  }

  function updatePowerUps(now, dt) {
    for (const power of state.powerUps) {
      power.pulse += 0.08 * dt;
    }
    state.powerUps = state.powerUps.filter((power) => now - power.born < power.life && !power.dead);
  }

  function updateEntities(now, dt) {
    for (const entity of state.entities) {
      const prey = findNearest(entity, tenFightPreyType(entity));
      if (prey) {
        const dx = prey.x - entity.x;
        const dy = prey.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        entity.vx += (dx / dist) * CHASE_STRENGTH * dt;
        entity.vy += (dy / dist) * CHASE_STRENGTH * dt;
      }

      const predator = findNearest(entity, tenFightPredatorType(entity));
      if (predator) {
        const dx = predator.x - entity.x;
        const dy = predator.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        entity.vx -= (dx / dist) * FLEE_STRENGTH * dt;
        entity.vy -= (dy / dist) * FLEE_STRENGTH * dt;
      } else {
        entity.vx += rand(-0.01, 0.01) * dt;
        entity.vy += rand(-0.01, 0.01) * dt;
      }

      applyPointerField(entity, now, dt);
      applyZoneAttraction(entity, dt);
      applyBountyPressure(entity, now, dt);
      applyPowerUpPickups(entity, now);

      const speedBoost = entity.speedUntil > now ? 1.55 : 1;
      const mutantBoost = entity.mutant ? 1.18 : 1;
      const tenFightBoost = isTenFightHero(entity) ? 1.5 : 1;
      const bountyBoost = state.options.bounty && state.bounty.active && entity.type !== state.bounty.leader
        ? 1.16
        : 1;
      if (isTenFightHero(entity)) {
        entity.scale = Math.max(entity.scale, 1.14);
        entity.flash = Math.max(entity.flash, 0.35);
      }
      const maxSpeed = BASE_SPEED * 2.75 * speedBoost * mutantBoost * bountyBoost * tenFightBoost;
      const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
      if (speed > maxSpeed) {
        entity.vx = (entity.vx / speed) * maxSpeed;
        entity.vy = (entity.vy / speed) * maxSpeed;
      }

      entity.vx *= FRICTION;
      entity.vy *= FRICTION;
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
      entity.flash *= 0.92;

      resolveArenaCollision(entity);
      for (const obstacle of state.obstacles) {
        resolveObstacleCollision(entity, obstacle);
      }

      if (entity.scale > 1) {
        entity.scale += (1 - entity.scale) * 0.12 * dt;
      } else {
        entity.scale = 1;
      }
    }
  }

  function findNearest(entity, targetType) {
    if (targetType === null || targetType === undefined) return null;
    let best = null;
    let bestDist = Infinity;
    for (const other of state.entities) {
      if (other === entity || other.type !== targetType || other.dead) continue;
      const dx = other.x - entity.x;
      const dy = other.y - entity.y;
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = other;
      }
    }
    return best;
  }

  function applyPointerField(entity, now, dt) {
    if (!state.options.godHand) return;
    const pointer = state.pointer;
    const age = now - pointer.lastMove;
    if (age > 520) return;
    const dx = entity.x - pointer.x;
    const dy = entity.y - pointer.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (dist > FIELD_RADIUS) return;
    const falloff = (1 - dist / FIELD_RADIUS) ** 1.6;
    const direction = pointer.mode === "pull" ? -1 : 1;
    const force = falloff * 0.18 * dt;
    entity.vx += (dx / dist) * force * direction;
    entity.vy += (dy / dist) * force * direction;

    const swipeSpeed = Math.sqrt(pointer.vx * pointer.vx + pointer.vy * pointer.vy);
    if (swipeSpeed > 0.6) {
      entity.vx += pointer.vx * 0.0055 * falloff * dt;
      entity.vy += pointer.vy * 0.0055 * falloff * dt;
    }
  }

  function applyZoneAttraction(entity, dt) {
    if (!state.options.zones || !state.zones.points.length) return;
    let target = null;
    let best = Infinity;
    for (const zone of state.zones.points) {
      const dx = zone.x - entity.x;
      const dy = zone.y - entity.y;
      const distSq = dx * dx + dy * dy;
      const ownPenalty = zone.owner === entity.type ? 58000 : 0;
      const value = distSq + ownPenalty;
      if (value < best) {
        best = value;
        target = zone;
      }
    }
    if (!target) return;
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    if (dist < target.r * 0.52) return;
    const force = (target.owner === entity.type ? 0.0024 : 0.0058) * dt;
    entity.vx += (dx / dist) * force;
    entity.vy += (dy / dist) * force;
  }

  function applyBountyPressure(entity, now, dt) {
    if (!state.options.bounty || !state.bounty.active || entity.type === state.bounty.leader) return;
    const target = findNearest(entity, state.bounty.leader);
    if (!target) return;
    const dx = target.x - entity.x;
    const dy = target.y - entity.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    entity.vx += (dx / dist) * BOUNTY_CHASE_STRENGTH * dt;
    entity.vy += (dy / dist) * BOUNTY_CHASE_STRENGTH * dt;
    if (now - target.lastConverted > CONVERT_COOLDOWN * 2 && dist < 170) {
      entity.vx += (dx / dist) * BOUNTY_CHASE_STRENGTH * 0.55 * dt;
      entity.vy += (dy / dist) * BOUNTY_CHASE_STRENGTH * 0.55 * dt;
    }
  }

  function applyPowerUpPickups(entity, now) {
    for (const power of state.powerUps) {
      if (power.dead) continue;
      const dx = power.x - entity.x;
      const dy = power.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < power.r + entityRadius(entity)) {
        power.dead = true;
        applyPowerUp(entity, power.kind, now);
      }
    }
  }

  function applyPowerUp(entity, kind, now) {
    if (kind === "speed") {
      applySpeedPower(entity, now);
    } else if (kind === "shield") {
      applyShieldPower(entity);
    } else if (kind === "split") {
      splitEntity(entity, now, 1);
      entity.scale = Math.max(entity.scale, 1.35);
    } else if (kind === "teamSpeed") {
      const members = aliveFactionMembers(entity.type);
      for (const member of members) {
        applySpeedPower(member, now);
      }
    } else if (kind === "teamShield") {
      const members = aliveFactionMembers(entity.type);
      for (const member of members) {
        applyShieldPower(member);
      }
    } else if (kind === "teamSplit") {
      const members = aliveFactionMembers(entity.type);
      const available = Math.max(0, MAX_ENTITIES - state.entities.length);
      for (const member of members.slice(0, available)) {
        splitEntity(member, now, 1.12);
      }
      for (const member of members) {
        member.scale = Math.max(member.scale, 1.32);
      }
    }
    const info = POWER_INFO[kind];
    addEvent(powerUpEventText(entity, kind), info.color);
    emitBurst(entity.x, entity.y, info.color, 16, 3);
    audio.pickup(kind);
  }

  function aliveFactionMembers(type) {
    return state.entities.filter((member) => !member.dead && member.type === type);
  }

  function applySpeedPower(entity, now) {
    entity.speedUntil = Math.max(entity.speedUntil, now + 6800);
    entity.scale = Math.max(entity.scale, 1.35);
    entity.flash = Math.max(entity.flash, 0.45);
  }

  function applyShieldPower(entity) {
    entity.shield = true;
    entity.scale = Math.max(entity.scale, 1.34);
    entity.flash = Math.max(entity.flash, 0.4);
  }

  function splitEntity(entity, now, force = 1) {
    if (state.entities.length >= MAX_ENTITIES) return null;
    const angle = rand(0, Math.PI * 2);
    const radius = entityRadius(entity);
    const clone = createEntity(
      entity.type,
      entity.x + Math.cos(angle) * radius * 1.8,
      entity.y + Math.sin(angle) * radius * 1.8,
    );
    clone.vx = entity.vx * -0.5 + Math.cos(angle) * BASE_SPEED * force;
    clone.vy = entity.vy * -0.5 + Math.sin(angle) * BASE_SPEED * force;
    clone.scale = 1.55;
    clone.lastConverted = now;
    resolveArenaCollision(clone);
    state.entities.push(clone);
    return clone;
  }

  function powerUpEventText(entity, kind) {
    const info = POWER_INFO[kind];
    const prefix = TYPE_INFO[entity.type].emoji;
    if (kind === "teamSpeed" || kind === "teamShield") {
      const count = aliveFactionMembers(entity.type).length;
      return `${prefix} 获得${info.label}，全队 ${count} 个生效`;
    }
    if (kind === "teamSplit") {
      const count = aliveFactionMembers(entity.type).length;
      return `${prefix} 获得${info.label}，全队尝试分裂`;
    }
    return `${prefix} 获得${info.label}`;
  }

  function resolveArenaCollision(entity) {
    const bounds = arenaBounds();
    const radius = entityRadius(entity);
    if (entity.x < bounds.left + radius) {
      entity.x = bounds.left + radius;
      entity.vx = Math.abs(entity.vx) * 0.82;
    }
    if (entity.x > bounds.right - radius) {
      entity.x = bounds.right - radius;
      entity.vx = -Math.abs(entity.vx) * 0.82;
    }
    if (entity.y < bounds.top + radius) {
      entity.y = bounds.top + radius;
      entity.vy = Math.abs(entity.vy) * 0.82;
    }
    if (entity.y > bounds.bottom - radius) {
      entity.y = bounds.bottom - radius;
      entity.vy = -Math.abs(entity.vy) * 0.82;
    }
  }

  function pointHitsObstacle(x, y, radius, obstacle) {
    if (obstacle.shape === "circle") {
      const dx = x - obstacle.x;
      const dy = y - obstacle.y;
      return Math.sqrt(dx * dx + dy * dy) < radius + obstacle.r;
    }
    const closestX = clamp(x, obstacle.x - obstacle.w / 2, obstacle.x + obstacle.w / 2);
    const closestY = clamp(y, obstacle.y - obstacle.h / 2, obstacle.y + obstacle.h / 2);
    const dx = x - closestX;
    const dy = y - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function resolveObstacleCollision(entity, obstacle) {
    const radius = entityRadius(entity);
    if (obstacle.shape === "circle") {
      const dx = entity.x - obstacle.x;
      const dy = entity.y - obstacle.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = radius + obstacle.r;
      if (dist >= minDist) return;
      const nx = dx / dist;
      const ny = dy / dist;
      entity.x += nx * (minDist - dist);
      entity.y += ny * (minDist - dist);
      reflectEntity(entity, nx, ny, 0.84);
      return;
    }

    const left = obstacle.x - obstacle.w / 2;
    const right = obstacle.x + obstacle.w / 2;
    const top = obstacle.y - obstacle.h / 2;
    const bottom = obstacle.y + obstacle.h / 2;
    const closestX = clamp(entity.x, left, right);
    const closestY = clamp(entity.y, top, bottom);
    let dx = entity.x - closestX;
    let dy = entity.y - closestY;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      const distances = [
        { nx: -1, ny: 0, d: Math.abs(entity.x - left) },
        { nx: 1, ny: 0, d: Math.abs(right - entity.x) },
        { nx: 0, ny: -1, d: Math.abs(entity.y - top) },
        { nx: 0, ny: 1, d: Math.abs(bottom - entity.y) },
      ].sort((a, b) => a.d - b.d);
      dx = distances[0].nx;
      dy = distances[0].ny;
      dist = 1;
    }

    if (dist < radius) {
      const nx = dx / dist;
      const ny = dy / dist;
      entity.x += nx * (radius - dist);
      entity.y += ny * (radius - dist);
      reflectEntity(entity, nx, ny, 0.86);
    }
  }

  function reflectEntity(entity, nx, ny, dampening) {
    const dot = entity.vx * nx + entity.vy * ny;
    if (dot < 0) {
      entity.vx -= (1 + dampening) * dot * nx;
      entity.vy -= (1 + dampening) * dot * ny;
    }
  }

  function resolveEntityCollisions(now) {
    const entities = state.entities;
    for (let i = 0; i < entities.length; i += 1) {
      const a = entities[i];
      if (a.dead) continue;
      for (let j = i + 1; j < entities.length; j += 1) {
        const b = entities[j];
        if (b.dead) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const minDist = entityRadius(a) + entityRadius(b);
        if (dist >= minDist) continue;

        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;

        if (a.type === b.type) {
          bounceSameType(a, b, nx, ny);
          continue;
        }

        if (handleTenFightCollision(a, b, nx, ny, now)) {
          continue;
        }

        if (beats(a.type, b.type)) {
          tryConvert(b, a, nx, ny, 1, now);
        } else if (beats(b.type, a.type)) {
          tryConvert(a, b, nx, ny, -1, now);
        }
      }
    }
  }

  function handleTenFightCollision(a, b, nx, ny, now) {
    const tenFight = state.tenFight;
    if (!tenFight.active) return false;

    let hero = null;
    let target = null;
    if (a.type === tenFight.minority && b.type === tenFight.majority) {
      hero = a;
      target = b;
    } else if (b.type === tenFight.minority && a.type === tenFight.majority) {
      hero = b;
      target = a;
    } else {
      return false;
    }

    target.dead = true;
    hero.scale = Math.max(hero.scale, 1.28);
    hero.flash = 1;
    const dx = target.x - hero.x;
    const dy = target.y - hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    hero.vx -= (dx / dist) * BASE_SPEED * 0.28;
    hero.vy -= (dy / dist) * BASE_SPEED * 0.28;
    emitBurst(target.x, target.y, TYPE_INFO[hero.type].color, 10, 3.2);
    emitBurst(target.x, target.y, "#f0b429", 7, 4);
    if (now - tenFight.lastKillAt > 650) {
      tenFight.lastKillAt = now;
      addEvent(`${TYPE_INFO[hero.type].emoji} 暴走击杀`, "#f0b429");
    }
    audio.attack();
    return true;
  }

  function bounceSameType(a, b, nx, ny) {
    const dvx = a.vx - b.vx;
    const dvy = a.vy - b.vy;
    const dot = dvx * nx + dvy * ny;
    if (dot > 0) {
      a.vx -= dot * nx * 0.78;
      a.vy -= dot * ny * 0.78;
      b.vx += dot * nx * 0.78;
      b.vy += dot * ny * 0.78;
    }
  }

  function tryConvert(loser, winner, nx, ny, loserSide, now) {
    if (now - loser.lastConverted <= CONVERT_COOLDOWN) return;
    if (loser.shield) {
      loser.shield = false;
      loser.lastConverted = now;
      loser.scale = 1.45;
      loser.vx += nx * loserSide * BASE_SPEED * 2;
      loser.vy += ny * loserSide * BASE_SPEED * 2;
      winner.vx -= nx * loserSide * BASE_SPEED * 0.7;
      winner.vy -= ny * loserSide * BASE_SPEED * 0.7;
      emitBurst(loser.x, loser.y, "#20a4f3", 12, 3);
      audio.attack();
      audio.shield();
      return;
    }

    const oldType = loser.type;
    loser.type = winner.type;
    loser.lastConverted = now;
    loser.scale = loser.mutant ? 1.75 : 1.52;
    loser.flash = 1;
    loser.vx = nx * loserSide * BASE_SPEED * 1.35;
    loser.vy = ny * loserSide * BASE_SPEED * 1.35;
    winner.vx -= nx * loserSide * BASE_SPEED * 0.55;
    winner.vy -= ny * loserSide * BASE_SPEED * 0.55;
    emitBurst(loser.x, loser.y, TYPE_INFO[winner.type].color, 8, 3);
    audio.convert(winner.type);

    if (state.options.bounty && state.bounty.active && oldType === state.bounty.leader) {
      applyBountyReward(winner, now);
    }

    if (winner.mutant) {
      winner.flash = Math.max(winner.flash, 0.85);
      winner.mutantShiftAt = Math.min(winner.mutantShiftAt, now + rand(900, 1800));
    }
  }

  function applyBountyReward(entity, now) {
    entity.shield = true;
    entity.speedUntil = Math.max(entity.speedUntil, now + 4600);
    entity.scale = Math.max(entity.scale, 1.5);
    emitBurst(entity.x, entity.y, "#f0b429", 14, 3.4);
    addEvent(`${TYPE_INFO[entity.type].emoji} 兑现悬赏`, "#f0b429");
    audio.pickup("shield");
  }

  function emitBurst(x, y, color, count = 10, size = 3) {
    for (let i = 0; i < count; i += 1) {
      const angle = rand(0, Math.PI * 2);
      const speed = rand(0.9, 4.2);
      state.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: rand(380, 720),
        maxLife: 720,
        color,
        size: rand(size * 0.55, size * 1.35),
      });
    }
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.life -= 16.6667 * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= 0.985;
      particle.vy *= 0.985;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function draw() {
    ctx.clearRect(0, 0, state.W, state.H);
    drawBackground();
    drawArena();
    drawControlZones();
    drawObstacles();
    drawPowerUps();
    drawBlackHoles();
    drawLastStandRevives(performance.now());
    drawEntities();
    drawPointerField(performance.now());
    drawParticles();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, state.W, state.H);
    gradient.addColorStop(0, "#f4f2eb");
    gradient.addColorStop(0.48, "#edf5f1");
    gradient.addColorStop(1, "#eef0fa");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.W, state.H);

    ctx.save();
    ctx.strokeStyle = "rgba(23,32,28,0.045)";
    ctx.lineWidth = 1;
    const step = 42;
    for (let x = -step; x < state.W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.H);
      ctx.stroke();
    }
    for (let y = -step; y < state.H + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawArena() {
    const bounds = arenaBounds();
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.strokeStyle = state.options.shrink ? "rgba(44,143,127,0.72)" : "rgba(23,32,28,0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash(state.options.shrink ? [9, 8] : []);
    roundedRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top, 8);
    ctx.fill();
    ctx.stroke();

    if (state.options.shrink && state.arena.targetPadding > 0) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(217,92,71,0.42)";
      ctx.lineWidth = 5;
      roundedRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top, 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawControlZones() {
    if (!state.options.zones || !state.zones.points.length) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const zone of state.zones.points) {
      const owner = zone.owner === null ? null : TYPE_INFO[zone.owner];
      const claim = zone.claimType === null ? null : TYPE_INFO[zone.claimType];
      const pulse = Math.sin(zone.pulse) * 2;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.r + pulse, 0, Math.PI * 2);
      ctx.fillStyle = owner ? `${owner.color}1f` : "rgba(23,32,28,0.055)";
      ctx.fill();
      ctx.strokeStyle = owner ? `${owner.color}88` : "rgba(23,32,28,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (claim) {
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * zone.claim);
        ctx.strokeStyle = claim.color;
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(zone.x, zone.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.84)";
      ctx.fill();
      ctx.strokeStyle = "rgba(23,32,28,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = owner ? owner.color : "#637067";
      ctx.font = "900 16px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(zone.label, zone.x, zone.y - 5);
      ctx.font = "800 10px -apple-system, BlinkMacSystemFont, sans-serif";
      const score = owner ? Math.floor(state.zones.scores[zone.owner]) : 0;
      ctx.fillText(String(score), zone.x, zone.y + 10);
    }
    ctx.restore();
  }

  function drawObstacles() {
    ctx.save();
    for (const obstacle of state.obstacles) {
      ctx.fillStyle = "rgba(39,51,46,0.14)";
      ctx.strokeStyle = "rgba(39,51,46,0.22)";
      ctx.lineWidth = 2;
      if (obstacle.shape === "circle") {
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(obstacle.x - obstacle.r * 0.25, obstacle.y - obstacle.r * 0.25, obstacle.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.fill();
      } else {
        roundedRect(obstacle.x - obstacle.w / 2, obstacle.y - obstacle.h / 2, obstacle.w, obstacle.h, 8);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawPowerUps() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const power of state.powerUps) {
      const info = POWER_INFO[power.kind];
      const pulse = Math.sin(power.pulse) * 2;
      ctx.beginPath();
      ctx.arc(power.x, power.y, power.r + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `${info.color}22`;
      ctx.fill();
      ctx.strokeStyle = info.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = info.color;
      ctx.fillText(info.icon, power.x, power.y + 1);
    }
    ctx.restore();
  }

  function drawBlackHoles() {
    ctx.save();
    for (const hole of state.blackHoles) {
      const radius = hole.r + Math.sin(hole.spin * 1.7) * 2;
      const gradient = ctx.createRadialGradient(hole.x, hole.y, 3, hole.x, hole.y, radius);
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(0.62, "#1f1728");
      gradient.addColorStop(1, "rgba(31,23,40,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, radius * 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(240,180,41,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, radius, hole.spin, hole.spin + Math.PI * 1.35);
      ctx.stroke();
      ctx.strokeStyle = "rgba(32,164,243,0.45)";
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, radius * 1.22, -hole.spin, -hole.spin + Math.PI * 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLastStandRevives(now) {
    if (!state.options.lastStand || !state.lastStand.pendingRevives.length) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const revive of state.lastStand.pendingRevives) {
      const info = TYPE_INFO[revive.type];
      const remaining = Math.max(0, revive.at - now);
      const progress = 1 - remaining / LAST_STAND_REVIVE_DELAY;
      ctx.beginPath();
      ctx.arc(revive.x, revive.y, 28 + Math.sin(now * 0.012) * 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = info.color;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(revive.x, revive.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fill();
      ctx.font = "700 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = info.color;
      ctx.fillText(`${Math.ceil(remaining / 1000)}`, revive.x, revive.y + 1);
    }
    ctx.restore();
  }

  function drawEntities() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const now = performance.now();
    for (const entity of state.entities) {
      const radius = entityRadius(entity);
      const info = TYPE_INFO[entity.type];
      ctx.save();
      ctx.translate(entity.x, entity.y);
      ctx.scale(entity.scale, entity.scale);

      if (isTenFightHero(entity)) {
        drawTenFightTrail(entity, radius, info, now);
      }

      if (entity.mutant) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 6 + entity.flash * 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139,92,246,0.92)";
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, radius + 12 + Math.sin(performance.now() * 0.014 + entity.id) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(139,92,246,0.38)";
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      if (entity.shield) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(32,164,243,0.86)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (entity.speedUntil > now) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 12, -Math.PI * 0.2, Math.PI * 1.1);
        ctx.strokeStyle = "rgba(239,155,32,0.75)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (state.options.bounty && state.bounty.active && entity.type === state.bounty.leader) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 13 + Math.sin(now * 0.016 + entity.id) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(240,180,41,0.8)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      if (isTenFightHero(entity)) {
        ctx.beginPath();
        ctx.arc(0, 0, radius + 14 + Math.sin(now * 0.02 + entity.id) * 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(240,180,41,0.9)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      const pendingTraitor = pendingTraitorFor(entity);
      if (pendingTraitor) {
        drawPendingTraitorBadge(pendingTraitor, radius, now);
      }

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
      ctx.fillStyle = IS_IOS ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.34)";
      ctx.fill();
      ctx.font = `${radius * (IS_IOS ? 1.72 : 1.55)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      ctx.fillStyle = "#17201c";
      ctx.fillText(info.emoji, 0, 0);
      ctx.restore();
    }
    ctx.restore();
  }

  function drawPendingTraitorBadge(pending, radius, now) {
    const remaining = clamp(pending.at - now, 0, TRAITOR_WARNING_DURATION);
    const progress = remaining / TRAITOR_WARNING_DURATION;
    const pulse = Math.sin(now * 0.018 + pending.id) * 1.7;
    const badgeY = -radius - 18;
    const badgeRadius = 12;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 9 + pulse, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(139,92,246,0.82)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, badgeY, badgeRadius + 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(139,92,246,0.18)";
    ctx.fill();
    ctx.strokeStyle = "rgba(139,92,246,0.46)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      0,
      badgeY,
      badgeRadius + 2,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * progress,
    );
    ctx.strokeStyle = TRAITOR_COLOR;
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = TRAITOR_COLOR;
    ctx.font = "900 11px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`${Math.ceil(remaining / 1000)}`, 0, badgeY + 1);
    ctx.restore();
  }

  function drawTenFightTrail(entity, radius, info, now) {
    const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
    const tx = speed > 0.05 ? -entity.vx / speed : Math.cos(now * 0.004 + entity.id);
    const ty = speed > 0.05 ? -entity.vy / speed : Math.sin(now * 0.004 + entity.id);
    ctx.save();
    for (let i = 3; i >= 1; i -= 1) {
      const offset = radius * (0.45 + i * 0.52);
      ctx.beginPath();
      ctx.arc(tx * offset, ty * offset, radius * (0.92 - i * 0.16), 0, Math.PI * 2);
      ctx.fillStyle = i % 2 === 0
        ? "rgba(240,180,41,0.18)"
        : `${info.color}2b`;
      ctx.fill();
    }
    ctx.restore();
  }

  function drawPointerField(now) {
    if (!state.options.godHand) return;
    const age = now - state.pointer.lastMove;
    if (age > 520) return;
    const alpha = 1 - age / 520;
    ctx.save();
    ctx.globalAlpha = alpha * 0.72;
    const isPull = state.pointer.mode === "pull";
    ctx.strokeStyle = isPull ? "rgba(217,92,71,0.75)" : "rgba(32,164,243,0.75)";
    ctx.fillStyle = isPull ? "rgba(217,92,71,0.08)" : "rgba(32,164,243,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, FIELD_RADIUS * (0.82 + alpha * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = isPull ? "rgba(217,92,71,0.24)" : "rgba(32,164,243,0.24)";
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (const particle of state.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function roundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function addEvent(text, color) {
    if (!state.settings.notifications && state.running && !state.roundOver) return;
    const item = document.createElement("div");
    item.className = "event-item";
    item.innerHTML = `<span class="event-dot"></span><span></span>`;
    item.querySelector(".event-dot").style.background = color;
    item.querySelector("span:last-child").textContent = text;
    ui.eventFeed.prepend(item);
    ui.eventFeed.classList.add("has-events");
    while (ui.eventFeed.children.length > 2) {
      ui.eventFeed.lastElementChild.remove();
    }
    window.setTimeout(() => {
      item.classList.add("fading");
    }, 1700);
    window.setTimeout(() => {
      item.remove();
      if (!ui.eventFeed.children.length) {
        ui.eventFeed.classList.remove("has-events");
      }
    }, 2100);
  }

  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function movePointer(event, active) {
    const point = pointerPoint(event);
    const pointer = state.pointer;
    const oldX = pointer.x;
    const oldY = pointer.y;
    pointer.vx = point.x - oldX;
    pointer.vy = point.y - oldY;
    pointer.px = oldX;
    pointer.py = oldY;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = active;
    pointer.lastMove = performance.now();
  }

  canvas.addEventListener("pointerdown", async (event) => {
    if (!state.running || state.roundOver || !state.options.godHand) return;
    await audio.init();
    canvas.setPointerCapture(event.pointerId);
    const point = pointerPoint(event);
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.px = point.x;
    state.pointer.py = point.y;
    state.pointer.vx = 0;
    state.pointer.vy = 0;
    state.pointer.active = true;
    state.pointer.lastMove = performance.now();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.running || state.roundOver || !state.options.godHand) return;
    movePointer(event, true);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!state.running || state.roundOver || !state.options.godHand) return;
    movePointer(event, false);
    state.pointer.active = false;
  });

  canvas.addEventListener("pointercancel", () => {
    state.pointer.active = false;
  });

  document.querySelectorAll("[data-field-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pointer.mode = button.dataset.fieldMode;
      ui.pushTool.classList.toggle("active", state.pointer.mode === "push");
      ui.pullTool.classList.toggle("active", state.pointer.mode === "pull");
    });
  });

  document.querySelectorAll(".setup-toggle").forEach((button) => {
    const group = button.closest(".setup-group");
    button.addEventListener("click", () => {
      const expanded = !group.classList.contains("expanded");
      group.classList.toggle("expanded", expanded);
      button.setAttribute("aria-expanded", String(expanded));
    });
  });

  ui.soundToggle.addEventListener("click", async () => {
    audio.enabled = !audio.enabled;
    ui.soundToggle.textContent = audio.enabled ? "🔊" : "🔇";
    if (audio.enabled) {
      await audio.init();
      if (state.running && !state.roundOver && !state.paused) {
        audio.startBgm();
      }
    } else {
      audio.pauseBgm();
    }
  });

  ui.settingsToggle.addEventListener("click", () => {
    ui.settingsPanel.classList.toggle("hidden");
  });

  ui.settingsClose.addEventListener("click", () => {
    ui.settingsPanel.classList.add("hidden");
  });

  ui.godHandToggle.addEventListener("click", () => {
    const enabled = !state.options.godHand;
    state.options.godHand = enabled;
    ui.inputs.godHand.checked = enabled;
    updateOptionVisibility();
    addEvent(enabled ? "上帝之手已开启" : "上帝之手已关闭", enabled ? "#20a4f3" : "#637067");
  });

  ui.pauseToggle.addEventListener("click", () => {
    if (!state.running || state.roundOver) return;
    state.paused = !state.paused;
    ui.pauseToggle.textContent = state.paused ? "继续" : "暂停";
    ui.homeBtn.classList.toggle("hidden", !state.paused);
    if (state.paused) {
      audio.pauseBgm();
    } else {
      audio.startBgm();
    }
  });

  ui.startBtn.addEventListener("click", startTournament);
  ui.homeBtn.addEventListener("click", showStartScreen);
  ui.restartBtn.addEventListener("click", showStartScreen);

  document.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      setPrediction(parseInt(button.dataset.pick, 10));
    });
  });

  document.querySelectorAll("[data-intro-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-intro-pick]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      setPrediction(parseInt(button.dataset.introPick, 10));
    });
  });

  document.querySelectorAll("#match-length button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#match-length button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      state.bestOf = parseInt(button.dataset.bestOf, 10);
      syncOptionsFromInputs();
    });
  });

  ui.themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
    });
  });

  ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  countInputs().forEach((input) => {
    input.addEventListener("input", () => {
      syncCountInput(input);
    });
  });

  ui.inputs.syncCounts.addEventListener("change", () => {
    if (ui.inputs.syncCounts.checked) {
      syncCountInput(ui.inputs.rock);
    } else {
      updateSetupSummaries();
    }
  });

  ui.inputs.names.forEach((input, index) => {
    input.addEventListener("input", () => {
      applyCustomLabel(index, input.value);
    });
    input.addEventListener("blur", () => {
      input.value = customThemeLabel(state.theme, index);
    });
  });

  [
    ui.inputs.duration,
    ui.inputs.stake,
    ui.inputs.penalty,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      syncOptionsFromInputs();
      updateOddsFromInputs();
    });
  });

  [
    [ui.inputs.bgmVolume, "bgm"],
    [ui.inputs.liveBgmVolume, "bgm"],
    [ui.inputs.sfxVolume, "sfx"],
    [ui.inputs.liveSfxVolume, "sfx"],
  ].forEach(([input, kind]) => {
    input.addEventListener("input", () => {
      setVolume(kind, input.value);
    });
  });

  [ui.inputs.notifications, ui.inputs.liveNotifications].forEach((input) => {
    input.addEventListener("change", () => {
      setNotifications(input.checked);
    });
  });

  [
    ui.inputs.betting,
    ui.inputs.tournament,
    ui.inputs.deathmatch,
    ui.inputs.zones,
    ui.inputs.godHand,
    ui.inputs.obstacles,
    ui.inputs.shrink,
    ui.inputs.bounty,
    ui.inputs.traitor,
    ui.inputs.blackHole,
    ui.inputs.powerups,
    ui.inputs.tenFight,
    ui.inputs.lastStand,
    ui.inputs.thanos,
  ].forEach((input) => {
    input.addEventListener("change", () => {
      syncOptionsFromInputs();
      updateOddsFromInputs();
    });
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 80));
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
    window.visualViewport.addEventListener("scroll", resize);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) {
      state.paused = true;
      ui.pauseToggle.textContent = "继续";
      ui.homeBtn.classList.remove("hidden");
      audio.pauseBgm();
    }
  });

  resize();
  applyTheme(state.theme);
  setVolume("bgm", ui.inputs.bgmVolume.value);
  setVolume("sfx", ui.inputs.sfxVolume.value);
  syncOptionsFromInputs();
  updateBank();
  updateOddsFromInputs();
  draw();

  window.rpsBattle = {
    state,
    startTournament,
    startRound,
    applyTheme,
  };
})();
