import {
  SHRINK_DELAY,
  SHRINK_FINAL_STEP,
  SHRINK_INTERVAL,
  SHRINK_STEP,
} from "../config/constants.js";
import { logEvent } from "../services/battleLog.js?v=0.2.7";

export function createShrinkFeature({
  state,
  audio,
  addEvent,
}) {
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
      logEvent("event_trigger", {
        eventName: "缩圈",
        detail: { newBoundary: Math.round(state.arena.targetPadding) },
      });
      addEvent("边界收缩", "#2c8f7f");
      audio.warningDiuDiu();
    }
    state.arena.padding += (state.arena.targetPadding - state.arena.padding) * 0.045 * dt;
  }

  return { updateArenaShrink };
}
