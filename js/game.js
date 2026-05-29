import {
  GAMEPLAY_OPTION_KEYS,
  PRESETS,
} from "./config/constants.js";
import { createTypeInfo, THEMES } from "./config/themes.js";
import { createInitialState } from "./core/state.js";
import { createArenaSystem } from "./core/arena.js";
import { createEntityQueries } from "./core/entities.js";
import { createEffects } from "./core/effects.js";
import { createCombatSystem } from "./core/combat.js";
import { createGameLoop } from "./core/game-loop.js";
import { createGameUpdater } from "./core/game-updater.js";
import { createRoundFlow } from "./core/round-flow.js";
import { createRoundRules } from "./core/round-rules.js";
import { createAudioService } from "./services/audio.js";
import {
  configureBattleLog,
  getLog,
} from "./services/battleLog.js?v=0.2.6";
import { getDomElements } from "./ui/dom.js?v=0.2.6";
import { createHudController } from "./ui/hud.js";
import { createEventFeed } from "./ui/event-feed.js";
import { createSetupController } from "./ui/setup-controller.js";
import { createReportPanel } from "./ui/report-panel.js?v=0.2.6";
import { createBettingRoom } from "./features/betting-room.js?v=0.2.6";
import { bindPointerControls } from "./ui/pointer-controls.js";
import { bindInputControls } from "./ui/input-bindings.js";
import { createCanvasRenderer } from "./render/canvas.js";
import { createTenFightFeature } from "./features/ten-fight.js";
import { createThanosFeature } from "./features/thanos.js";
import { createWorldEventsFeature } from "./features/world-events.js";
import { createLastStandFeature } from "./features/last-stand.js";
import { createPowerUpFeature } from "./features/powerups.js";
import {
  beats,
  clamp,
  pick,
  predatorType,
  preyType,
  rand,
  shuffleInPlace,
} from "./utils/math.js";

const ui = getDomElements();
const app = ui.app;
const canvas = ui.canvas;
const ctx = canvas.getContext("2d");
const TYPE_INFO = createTypeInfo();
const state = createInitialState();
const audio = createAudioService({ state, typeInfo: TYPE_INFO, clamp });

let renderer = null;
let renderIntroSummary = () => {};
let update = () => {};
let updateAndCheckRound = () => countEntities();
let tenFightControls = {};
let isTenFightHero = () => false;
let tenFightPreyType = (entity) => preyType(entity.type);
let tenFightPredatorType = (entity) => predatorType(entity.type);
let handleTenFightCollision = () => false;
let bettingRoom = null;

function draw() {
  renderer?.draw();
}

const { countEntities, factionSnapshot } = createEntityQueries(state);
const { addEvent } = createEventFeed({ state, ui });
const { emitBurst, updateParticles } = createEffects({ state, rand });
const hudController = createHudController({
  state,
  ui,
  countEntities,
  getIntroSummaryRenderer: () => renderIntroSummary,
});
const {
  updateHud,
  updateBank,
  setPrediction,
  syncPredictionButtons,
} = hudController;

const arenaSystem = createArenaSystem({
  app,
  canvas,
  ctx,
  state,
  clamp,
  rand,
  isTenFightHero: (entity) => isTenFightHero(entity),
});

function syncHudMetrics() {
  arenaSystem.syncHudMetrics(ui);
}

function resize() {
  arenaSystem.resize(ui);
}

const {
  updateArenaMax,
  arenaBounds,
  entityRadius,
  createEntity,
  safePoint,
  spawnEntities,
  generateObstacles,
  resolveArenaCollision,
  resolveObstacleCollision,
} = arenaSystem;

const setupController = createSetupController({
  state,
  ui,
  TYPE_INFO,
  THEMES,
  GAMEPLAY_OPTION_KEYS,
  PRESETS,
  clamp,
  preyType,
  predatorType,
  audio,
  updateHud,
  draw,
  syncPredictionButtons,
  updateBank,
  syncHudMetrics,
});

const {
  countInputs,
  customThemeLabel,
  applyCustomLabel,
  applyTheme,
  currentRoundCounts,
  readSetup,
  calculateOdds,
  updateOddsFromInputs,
  updateOddsLabels,
  syncCountInput,
  stepCountInput,
  gameplayInputs,
  applyPreset,
  updateSetupSummaries,
  updateOptionVisibility,
  syncOptionsFromInputs,
  setVolume,
  setNotifications,
  enabledOptionLabels,
} = setupController;
renderIntroSummary = setupController.renderIntroSummary;
configureBattleLog({ state, countEntities });
const reportPanel = ui.reportScreen && ui.reportBtn && ui.reportText && ui.reportMvp
  ? createReportPanel({ ui })
  : null;

const lastStandFeature = createLastStandFeature({
  state,
  typeInfo: TYPE_INFO,
  audio,
  clamp,
  rand,
  factionSnapshot,
  createEntity,
  arenaBounds,
  entityRadius,
  resolveArenaCollision,
  emitBurst,
  addEvent,
});

const {
  resetLastStandState,
  hasPendingRevives,
  updateLastStand,
} = lastStandFeature;

const powerUpFeature = createPowerUpFeature({
  state,
  typeInfo: TYPE_INFO,
  audio,
  rand,
  createEntity,
  entityRadius,
  resolveArenaCollision,
  emitBurst,
  addEvent,
});

const {
  applyPowerUpPickups,
  aliveFactionMembers,
} = powerUpFeature;

const thanosFeature = createThanosFeature({
  state,
  ui,
  audio,
  rand,
  emitBurst,
  addEvent,
  shuffleInPlace,
});

const { resetThanosEvent, updateThanosSnap } = thanosFeature;

const worldEvents = createWorldEventsFeature({
  state,
  typeInfo: TYPE_INFO,
  audio,
  clamp,
  rand,
  pick,
  shuffleInPlace,
  countEntities,
  safePoint,
  arenaBounds,
  entityRadius,
  createEntity,
  resolveArenaCollision,
  emitBurst,
  addEvent,
});

const {
  resetControlZones,
  generateControlZones,
  updateControlZones,
  resetBountyState,
  updateBountyLeadership,
  updateArenaShrink,
  maybeSpawnPowerUp,
  updateTraitorEvent,
  updatePendingTraitors,
  pendingTraitorFor,
  maybeSpawnBlackHole,
  updateBlackHoles,
  updatePowerUps,
} = worldEvents;

const gameLoop = createGameLoop({
  state,
  update: (now, dt) => update(now, dt),
  draw,
  updateAndCheckRound: (now) => updateAndCheckRound(now),
  updateHud,
});

const roundFlow = createRoundFlow({
  state,
  ui,
  typeInfo: TYPE_INFO,
  audio,
  rand,
  clamp,
  loop: gameLoop.loop,
  draw,
  readSetup,
  currentRoundCounts,
  calculateOdds,
  updateOddsLabels,
  updateOddsFromInputs,
  updateHud,
  updateBank,
  countEntities,
  spawnEntities,
  updateArenaMax,
  generateObstacles,
  generateControlZones,
  resetControlZones,
  resetBountyState,
  resetLastStandState,
  resetThanosEvent,
  getTenFightControls: () => tenFightControls,
  syncPredictionButtons,
  renderIntroSummary,
  enabledOptionLabels,
  onGameEnd: (payload) => {
    state.lastBattleLog = payload.log;
    bettingRoom?.handleGameEnd(payload);
  },
});

const {
  startTournament,
  beginTournament,
  startRound,
  showStartScreen,
  finishRound,
} = roundFlow;

if (ui.roomBtn && ui.roomScreen && ui.roomNameInput && ui.roomNameConfirm) {
  bettingRoom = createBettingRoom({
    state,
    ui,
    audio,
    applyPreset,
    readSetup,
    startRound,
    showStartScreen,
    updateOptionVisibility,
    resize,
    draw,
    updateHud,
  });
}

const tenFightFeature = createTenFightFeature({
  state,
  ui,
  typeInfo: TYPE_INFO,
  audio,
  clamp,
  rand,
  beats,
  countEntities,
  hasPendingRevives,
  aliveFactionMembers,
  emitBurst,
  addEvent,
  finishRound,
});

tenFightControls = tenFightFeature;
isTenFightHero = tenFightFeature.isTenFightHero;
tenFightPreyType = tenFightFeature.tenFightPreyType;
tenFightPredatorType = tenFightFeature.tenFightPredatorType;
handleTenFightCollision = tenFightFeature.handleTenFightCollision;

const combatSystem = createCombatSystem({
  state,
  typeInfo: TYPE_INFO,
  audio,
  rand,
  beats,
  entityRadius,
  resolveArenaCollision,
  resolveObstacleCollision,
  emitBurst,
  addEvent,
  applyPowerUpPickups,
  tenFightPreyType,
  tenFightPredatorType,
  isTenFightHero,
  handleTenFightCollision,
});

const gameUpdater = createGameUpdater({
  state,
  updateTenFight: tenFightFeature.updateTenFight,
  updateParticles,
  updateArenaShrink,
  updateBountyLeadership,
  maybeSpawnPowerUp,
  updatePendingTraitors,
  updateTraitorEvent,
  maybeSpawnBlackHole,
  updateThanosSnap,
  updateBlackHoles,
  updatePowerUps,
  updateEntities: combatSystem.updateEntities,
  resolveEntityCollisions: combatSystem.resolveEntityCollisions,
  updateControlZones,
  updateLastStand,
  maybeTriggerTenFight: tenFightFeature.maybeTriggerTenFight,
});
update = gameUpdater.update;

const roundRules = createRoundRules({
  state,
  audio,
  pick,
  countEntities,
  hasPendingRevives,
  finishRound,
  addEvent,
});
updateAndCheckRound = roundRules.updateAndCheckRound;

renderer = createCanvasRenderer({
  ctx,
  state,
  typeInfo: TYPE_INFO,
  arenaBounds,
  entityRadius,
  pendingTraitorFor,
  isTenFightHero,
  clamp,
});

bindPointerControls({
  canvas,
  state,
  ui,
  audio,
});

bindInputControls({
  state,
  ui,
  audio,
  startTournament,
  beginTournament,
  showStartScreen,
  setPrediction,
  applyTheme,
  applyCustomLabel,
  applyPreset,
  countInputs,
  stepCountInput,
  syncCountInput,
  customThemeLabel,
  updateSetupSummaries,
  syncOptionsFromInputs,
  updateOddsFromInputs,
  setVolume,
  setNotifications,
  gameplayInputs,
  updateOptionVisibility,
  addEvent,
  resize,
});

resize();
applyTheme(state.theme);
setVolume("bgm", ui.inputs.bgmVolume.value);
setVolume("sfx", ui.inputs.sfxVolume.value);
syncOptionsFromInputs();
updateBank();
updateOddsFromInputs();
draw();

function openReportPanel() {
  if (!reportPanel) {
    addEvent("战报面板未就绪，请刷新页面", "#d95c47");
    return;
  }
  try {
    const log = state.lastBattleLog?.length ? state.lastBattleLog : getLog();
    reportPanel.showReport(log);
  } catch (error) {
    window.__rpsErrors?.push(String(error?.stack || error));
    addEvent("战报生成失败，请重新开一局", "#d95c47");
  }
}

function openBettingRoom() {
  if (!bettingRoom) {
    addEvent("竞猜房间未就绪，请刷新页面", "#d95c47");
    return;
  }
  bettingRoom.open();
}

document.addEventListener("click", (event) => {
  if (event.target.closest("#report-btn")) {
    event.preventDefault();
    event.stopPropagation();
    openReportPanel();
    return;
  }
  if (event.target.closest("#room-btn")) {
    event.preventDefault();
    event.stopPropagation();
    openBettingRoom();
  }
}, true);

window.rpsBattle = {
  state,
  startTournament,
  startRound,
  applyTheme,
  openReportPanel,
  openBettingRoom,
};
