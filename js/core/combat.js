import {
  BASE_SPEED,
  BOUNTY_CHASE_STRENGTH,
  CHASE_STRENGTH,
  CONVERT_COOLDOWN,
  FIELD_RADIUS,
  FLEE_STRENGTH,
  FRICTION,
} from "../config/constants.js";

export function createCombatSystem({
  state,
  typeInfo,
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
}) {
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
      limitAndMoveEntity(entity, now, dt);
    }
  }

  function limitAndMoveEntity(entity, now, dt) {
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
    emitBurst(loser.x, loser.y, typeInfo[winner.type].color, 8, 3);
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
    addEvent(`${typeInfo[entity.type].emoji} 兑现悬赏`, "#f0b429");
    audio.pickup("shield");
  }

  return {
    updateEntities,
    resolveEntityCollisions,
    findNearest,
  };
}
