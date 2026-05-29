import {
  BASE_RADIUS,
  BASE_SPEED,
  LAST_STAND_REVIVE_CHANCE,
  LAST_STAND_REVIVE_DELAY,
  LAST_STAND_SPLIT_CHANCE,
  MAX_ENTITIES,
} from "../config/constants.js";
import { logEvent } from "../services/battleLog.js?v=0.2.6";

export function createLastStandFeature({
  state,
  typeInfo,
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
}) {
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
    emitBurst(entity.x, entity.y, typeInfo[entity.type].color, 18, 3.2);
    logEvent("event_trigger", {
      eventName: "绝地求生_分裂",
      detail: { entityId: entity.id, entityType: entity.type },
    });
    addEvent(`${typeInfo[entity.type].emoji} 绝地分裂`, typeInfo[entity.type].color);
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
    addEvent(`${typeInfo[type].emoji} 绝地求生：5 秒后复活`, typeInfo[type].color);
    audio.event();
  }

  function processPendingRevives(now) {
    const waiting = [];
    for (const revive of state.lastStand.pendingRevives) {
      if (now < revive.at) {
        waiting.push(revive);
        continue;
      }
      const bounds = arenaBounds();
      const entity = createEntity(
        revive.type,
        clamp(revive.x, bounds.left + BASE_RADIUS, bounds.right - BASE_RADIUS),
        clamp(revive.y, bounds.top + BASE_RADIUS, bounds.bottom - BASE_RADIUS),
        { shield: true },
      );
      entity.scale = 1.9;
      entity.lastConverted = now;
      state.entities.push(entity);
      resolveArenaCollision(entity);
      emitBurst(entity.x, entity.y, typeInfo[revive.type].color, 26, 4);
      logEvent("event_trigger", {
        eventName: "绝地求生_复活",
        detail: { factionType: revive.type },
      });
      addEvent(`${typeInfo[revive.type].emoji} 原地复活`, typeInfo[revive.type].color);
      audio.win(revive.type);
    }
    state.lastStand.pendingRevives = waiting;
  }

  return {
    resetLastStandState,
    hasPendingRevives,
    updateLastStand,
  };
}
