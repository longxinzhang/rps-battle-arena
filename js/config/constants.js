export const VERSION = "0.1.0";

export const TYPES = {
  ROCK: 0,
  SCISSORS: 1,
  PAPER: 2,
};

export const GAMEPLAY_OPTION_KEYS = [
  "betting",
  "tournament",
  "deathmatch",
  "zones",
  "godHand",
  "obstacles",
  "shrink",
  "bounty",
  "traitor",
  "blackHole",
  "powerups",
  "tenFight",
  "lastStand",
  "thanos",
];

export const PRESETS = {
  classic: {
    groups: ["format"],
    options: {
      deathmatch: true,
    },
  },
  zones: {
    groups: ["events", "format"],
    options: {
      zones: true,
      blackHole: true,
      lastStand: true,
    },
  },
  traitor: {
    groups: ["mechanics", "events", "format"],
    options: {
      deathmatch: true,
      shrink: true,
      blackHole: true,
      traitor: true,
    },
  },
  equality: {
    groups: ["mechanics", "events", "format"],
    options: {
      deathmatch: true,
      obstacles: true,
      thanos: true,
    },
  },
};

export const POWER_INFO = {
  speed: { label: "加速", icon: "⚡", color: "#ef9b20" },
  shield: { label: "护盾", icon: "◌", color: "#20a4f3" },
  split: { label: "分裂", icon: "✦", color: "#7c5cff" },
  teamSpeed: { label: "团队加速", icon: "⚡+", color: "#f59e0b" },
  teamShield: { label: "团队护盾", icon: "◌+", color: "#0ea5e9" },
  teamSplit: { label: "团队分裂", icon: "✦+", color: "#8b5cf6" },
};

export const BASE_RADIUS = 17;
export const BASE_SPEED = 2.25;
export const CHASE_STRENGTH = 0.014;
export const FLEE_STRENGTH = 0.01;
export const FRICTION = 0.992;
export const CONVERT_COOLDOWN = 280;
export const DEFAULT_ROUND_LIMIT = 60000;
export const FIELD_RADIUS = 146;
export const MAX_ENTITIES = 180;
export const SHRINK_DELAY = 9000;
export const SHRINK_INTERVAL = 5400;
export const SHRINK_STEP = 18;
export const SHRINK_FINAL_STEP = 14;
export const SHRINK_FINAL_SETTLE = 9000;
export const SHRINK_MIN_ARENA = 118;
export const LAST_STAND_SPLIT_CHANCE = 0.76;
export const LAST_STAND_REVIVE_CHANCE = 0.22;
export const LAST_STAND_REVIVE_DELAY = 5000;
export const SNAP_REVEAL_DELAY = 1450;
export const SNAP_OVERLAY_DURATION = 4200;
export const CONTROL_ZONE_RADIUS = 58;
export const CONTROL_ZONE_CAPTURE_RATE = 0.0085;
export const CONTROL_ZONE_SCORE_RATE = 0.018;
export const CONTROL_ZONE_TARGET = 80;
export const BOUNTY_SHARE = 0.54;
export const BOUNTY_LEAD = 6;
export const BOUNTY_CHASE_STRENGTH = 0.009;
export const TRAITOR_EARLY_START = 10000;
export const TRAITOR_EARLY_END = 15000;
export const TRAITOR_FIRST_DELAY = 20000;
export const TRAITOR_INTERVAL = 10000;
export const TRAITOR_WARNING_DURATION = 2000;
export const TRAITOR_COLOR = "#8b5cf6";
export const BLACK_HOLE_BASE_RADIUS = 24;
export const BLACK_HOLE_PULL_RADIUS = 165;
export const BLACK_HOLE_GROWTH = 1.3;
export const BLACK_HOLE_MAX_RADIUS = 74;
export const BLACK_HOLE_MAX_PULL_RADIUS = 360;
export const TEN_FIGHT_DURATION = 10000;
export const TEN_FIGHT_FREEZE = 1600;
export const TEN_FIGHT_TRIGGER_CHANCE = 0.1;
export const TEN_FIGHT_RATIO = 10;
export const TEN_FIGHT_CHECK_INTERVAL = 1200;

export const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
