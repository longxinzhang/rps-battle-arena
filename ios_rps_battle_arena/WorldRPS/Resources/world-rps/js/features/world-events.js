import { createBlackHoleFeature } from "./black-hole.js";
import { createBountyFeature } from "./bounty.js";
import { createShrinkFeature } from "./shrink.js";
import { createTraitorFeature } from "./traitor.js";
import { createZonesFeature } from "./zones.js";

export function createWorldEventsFeature(context) {
  const zones = createZonesFeature(context);
  const bounty = createBountyFeature(context);
  const shrink = createShrinkFeature(context);
  const traitor = createTraitorFeature(context);
  const blackHole = createBlackHoleFeature(context);

  function maybeSpawnPowerUp(now) {
    const {
      state,
      pick,
      rand,
      safePoint,
    } = context;
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

  function updatePowerUps(now, dt) {
    const { state } = context;
    for (const power of state.powerUps) {
      power.pulse += 0.08 * dt;
    }
    state.powerUps = state.powerUps.filter((power) => now - power.born < power.life && !power.dead);
  }

  return {
    ...zones,
    ...bounty,
    ...shrink,
    ...traitor,
    ...blackHole,
    maybeSpawnPowerUp,
    updatePowerUps,
  };
}
