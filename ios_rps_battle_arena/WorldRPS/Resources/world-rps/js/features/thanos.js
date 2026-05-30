import {
  SNAP_OVERLAY_DURATION,
  SNAP_REVEAL_DELAY,
} from "../config/constants.js";
import { logEvent } from "../services/battleLog.js?v=0.2.7";

export function createThanosFeature({
  state,
  ui,
  audio,
  rand,
  emitBurst,
  addEvent,
  shuffleInPlace,
}) {
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
    audio.snap();
    addEvent("灭霸登场，响指将至", "#f0b429");
  }

  function applyThanosSnap() {
    const before = countAliveByType();
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
    const after = countAliveByType();
    logEvent("event_trigger", {
      eventName: "灭霸响指",
      detail: {
        rockBefore: before[0],
        scissorsBefore: before[1],
        paperBefore: before[2],
        rockAfter: after[0],
        scissorsAfter: after[1],
        paperAfter: after[2],
      },
    });
    addEvent("响指完成：所有派系减半", "#f0b429");
    audio.void();
  }

  function countAliveByType() {
    const counts = [0, 0, 0];
    for (const entity of state.entities) {
      if (!entity.dead) counts[entity.type] += 1;
    }
    return counts;
  }

  return {
    resetThanosEvent,
    updateThanosSnap,
  };
}
