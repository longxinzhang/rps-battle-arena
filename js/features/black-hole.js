import {
  BASE_SPEED,
  BLACK_HOLE_BASE_RADIUS,
  BLACK_HOLE_GROWTH,
  BLACK_HOLE_MAX_PULL_RADIUS,
  BLACK_HOLE_MAX_RADIUS,
  BLACK_HOLE_PULL_RADIUS,
} from "../config/constants.js";

export function createBlackHoleFeature({
  state,
  typeInfo,
  audio,
  clamp,
  rand,
  safePoint,
  arenaBounds,
  entityRadius,
  emitBurst,
  addEvent,
}) {
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
      bounceBlackHole(hole, bounds);
      consumeNearbyEntities(hole, dt);
    }
    state.blackHoles = state.blackHoles.filter((hole) => now - hole.born < hole.life);
  }

  function bounceBlackHole(hole, bounds) {
    if (hole.x < bounds.left + hole.r || hole.x > bounds.right - hole.r) {
      hole.vx *= -1;
      hole.x = clamp(hole.x, bounds.left + hole.r, bounds.right - hole.r);
    }
    if (hole.y < bounds.top + hole.r || hole.y > bounds.bottom - hole.r) {
      hole.vy *= -1;
      hole.y = clamp(hole.y, bounds.top + hole.r, bounds.bottom - hole.r);
    }
  }

  function consumeNearbyEntities(hole, dt) {
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
        consumeEntity(hole, entity, dx, dy, dist);
      }
    }
  }

  function consumeEntity(hole, entity, dx, dy, dist) {
    if (entity.shield) {
      entity.shield = false;
      entity.vx -= (dx / dist) * BASE_SPEED * 2.8;
      entity.vy -= (dy / dist) * BASE_SPEED * 2.8;
      entity.scale = 1.45;
      audio.shield();
      emitBurst(entity.x, entity.y, "#20a4f3", 14, 3);
      return;
    }
    entity.dead = true;
    emitBurst(entity.x, entity.y, typeInfo[entity.type].color, 18, 4);
    growBlackHole(hole, entity);
    audio.void();
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

  return {
    maybeSpawnBlackHole,
    updateBlackHoles,
  };
}
