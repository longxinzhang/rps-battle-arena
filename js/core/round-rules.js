import {
  CONTROL_ZONE_TARGET,
  SHRINK_FINAL_SETTLE,
} from "../config/constants.js";

export function createRoundRules({
  state,
  audio,
  pick,
  countEntities,
  hasPendingRevives,
  finishRound,
  addEvent,
}) {
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

  return {
    updateAndCheckRound,
    controlZoneWinner,
    timedRoundDecision,
  };
}
