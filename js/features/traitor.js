import {
  BASE_SPEED,
  TRAITOR_COLOR,
  TRAITOR_EARLY_END,
  TRAITOR_EARLY_START,
  TRAITOR_INTERVAL,
  TRAITOR_WARNING_DURATION,
} from "../config/constants.js";

export function createTraitorFeature({
  state,
  typeInfo,
  audio,
  rand,
  pick,
  shuffleInPlace,
  countEntities,
  emitBurst,
  addEvent,
}) {
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
      scheduled.push(typeInfo[entity.type].emoji);
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
    addEvent(`早期叛徒倒计时：${typeInfo[entity.type].emoji}`, TRAITOR_COLOR);
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
    return `${typeInfo[oldType].emoji}→${typeInfo[entity.type].emoji}`;
  }

  return {
    updateTraitorEvent,
    updatePendingTraitors,
    isPendingTraitor,
    pendingTraitorFor,
  };
}
