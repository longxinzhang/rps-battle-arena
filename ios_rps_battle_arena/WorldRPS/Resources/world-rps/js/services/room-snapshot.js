import {
  GAMEPLAY_OPTION_KEYS,
  ROOM_STAGE_HEIGHT,
  ROOM_STAGE_WIDTH,
} from "../config/constants.js";

export function createRoomSnapshotTools({
  state,
  updateHud,
  draw,
}) {
  function buildSnapshot(round) {
    const now = performance.now();
    const counts = countAlive();
    state.bettingRoom.snapshotSeq += 1;
    return {
      schema: 1,
      round,
      seq: state.bettingRoom.snapshotSeq,
      width: ROOM_STAGE_WIDTH,
      height: ROOM_STAGE_HEIGHT,
      elapsed: n(now - state.roundStart, 0),
      roundLimit: state.roundLimit,
      roundIndex: state.roundIndex,
      bestOf: state.bestOf,
      wins: [...state.wins],
      penalties: [...state.penalties],
      options: snapshotOptions(),
      counts,
      arena: snapshotArena(),
      entities: state.entities.filter((entity) => !entity.dead).map((entity) => snapshotEntity(entity, now)),
      obstacles: state.obstacles.map(snapshotObstacle),
      powerUps: state.powerUps.map((power) => snapshotPowerUp(power, now)),
      blackHoles: state.blackHoles.map(snapshotBlackHole),
      pendingTraitors: state.pendingTraitors.map((pending) => snapshotPendingTraitor(pending, now)),
      zones: {
        scores: state.zones.scores.map((score) => n(score, 2)),
        points: state.zones.points.map(snapshotZone),
      },
      bounty: {
        active: Boolean(state.bounty.active),
        leader: state.bounty.leader,
        lastLeader: state.bounty.lastLeader,
      },
      tenFight: snapshotTenFight(now),
      lastStand: {
        pendingRevives: state.lastStand.pendingRevives.map((revive) => snapshotRevive(revive, now)),
      },
      particles: state.particles.slice(0, 80).map(snapshotParticle),
    };
  }

  function applySnapshot(snapshot) {
    if (!snapshot || snapshot.schema !== 1) return false;
    const now = performance.now();
    const existingEntities = new Map(state.entities.map((entity) => [entity.id, entity]));
    state.bettingRoom.lastSnapshotAt = Date.now();
    state.bettingRoom.remoteFrameAt = now;
    state.running = true;
    state.paused = false;
    state.roundOver = false;
    state.roundLimit = Number(snapshot.roundLimit) || state.roundLimit;
    state.roundIndex = Number(snapshot.roundIndex) || 1;
    state.bestOf = Number(snapshot.bestOf) || 1;
    state.wins = numericArray(snapshot.wins, 3);
    state.penalties = numericArray(snapshot.penalties, 3);
    state.roundStart = now - (Number(snapshot.elapsed) || 0);
    Object.assign(state.options, sanitizeOptions(snapshot.options), { godHand: false });
    Object.assign(state.arena, sanitizeArena(snapshot.arena));
    state.entities = Array.isArray(snapshot.entities)
      ? snapshot.entities.map((entity) => restoreEntity(
        entity,
        now,
        state.bettingRoom.remoteSpectator ? existingEntities.get(Number(entity.id) || 0) : null,
      ))
      : [];
    state.obstacles = Array.isArray(snapshot.obstacles)
      ? snapshot.obstacles.map(restoreObstacle)
      : [];
    state.powerUps = Array.isArray(snapshot.powerUps)
      ? snapshot.powerUps.map((power) => restorePowerUp(power, now))
      : [];
    state.blackHoles = Array.isArray(snapshot.blackHoles)
      ? snapshot.blackHoles.map(restoreBlackHole)
      : [];
    state.pendingTraitors = Array.isArray(snapshot.pendingTraitors)
      ? snapshot.pendingTraitors.map((pending) => restorePendingTraitor(pending, now))
      : [];
    state.zones = restoreZones(snapshot.zones);
    state.bounty = restoreBounty(snapshot.bounty);
    Object.assign(state.tenFight, restoreTenFight(snapshot.tenFight, now));
    state.lastStand.pendingRevives = Array.isArray(snapshot.lastStand?.pendingRevives)
      ? snapshot.lastStand.pendingRevives.map((revive) => restoreRevive(revive, now))
      : [];
    state.particles = Array.isArray(snapshot.particles)
      ? snapshot.particles.map(restoreParticle)
      : [];
    updateHud(Array.isArray(snapshot.counts) ? numericArray(snapshot.counts, 3) : countAlive());
    draw();
    return true;
  }

  function advanceRemoteFrame(now) {
    if (!state.bettingRoom.remoteSpectator || !state.running || state.roundOver) return;
    const previous = state.bettingRoom.remoteFrameAt || now;
    const deltaMs = Math.min(50, Math.max(1, now - previous));
    const dt = deltaMs / 16.6667;
    state.bettingRoom.remoteFrameAt = now;
    const bounds = roomArenaBounds(state);

    for (const entity of state.entities) {
      if (entity.dead) continue;
      entity.x += entity.vx * dt;
      entity.y += entity.vy * dt;
      entity.flash *= 0.94;
      if (entity.scale > 1) {
        entity.scale += (1 - entity.scale) * 0.08 * dt;
      } else {
        entity.scale = 1;
      }
      entity.x = clamp(entity.x, bounds.left + 12, bounds.right - 12);
      entity.y = clamp(entity.y, bounds.top + 12, bounds.bottom - 12);
    }

    for (const hole of state.blackHoles) {
      hole.x += (hole.vx || 0) * dt;
      hole.y += (hole.vy || 0) * dt;
      hole.spin += 0.11 * dt;
      hole.x = clamp(hole.x, bounds.left + hole.r, bounds.right - hole.r);
      hole.y = clamp(hole.y, bounds.top + hole.r, bounds.bottom - hole.r);
    }

    for (const power of state.powerUps) {
      power.pulse += 0.08 * dt;
    }
    for (const zone of state.zones.points) {
      zone.pulse += 0.04 * dt;
    }
    for (const particle of state.particles) {
      particle.life -= deltaMs;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function snapshotOptions() {
    return GAMEPLAY_OPTION_KEYS.reduce((options, key) => {
      options[key] = Boolean(state.options[key]);
      return options;
    }, {});
  }

  function snapshotArena() {
    return {
      padding: n(state.arena.padding, 2),
      targetPadding: n(state.arena.targetPadding, 2),
      maxPadding: n(state.arena.maxPadding, 2),
      hardMaxPadding: n(state.arena.hardMaxPadding, 2),
      finalStarted: Boolean(state.arena.finalStarted),
    };
  }

  function snapshotEntity(entity, now) {
    return {
      id: entity.id,
      type: entity.type,
      x: n(entity.x, 1),
      y: n(entity.y, 1),
      vx: n(entity.vx, 3),
      vy: n(entity.vy, 3),
      scale: n(entity.scale || 1, 3),
      mutant: Boolean(entity.mutant),
      shield: Boolean(entity.shield),
      flash: n(entity.flash || 0, 3),
      speedRemaining: remaining(entity.speedUntil, now),
    };
  }

  function snapshotObstacle(obstacle) {
    if (obstacle.shape === "circle") {
      return {
        shape: "circle",
        x: n(obstacle.x, 1),
        y: n(obstacle.y, 1),
        r: n(obstacle.r, 1),
      };
    }
    return {
      shape: "rect",
      x: n(obstacle.x, 1),
      y: n(obstacle.y, 1),
      w: n(obstacle.w, 1),
      h: n(obstacle.h, 1),
    };
  }

  function snapshotPowerUp(power, now) {
    return {
      kind: power.kind,
      x: n(power.x, 1),
      y: n(power.y, 1),
      r: n(power.r, 1),
      pulse: n(power.pulse, 3),
      lifeRemaining: remaining((power.born || now) + (power.life || 0), now),
    };
  }

  function snapshotBlackHole(hole) {
    return {
      x: n(hole.x, 1),
      y: n(hole.y, 1),
      vx: n(hole.vx || 0, 3),
      vy: n(hole.vy || 0, 3),
      r: n(hole.r, 1),
      pullRadius: n(hole.pullRadius || 0, 1),
      spin: n(hole.spin || 0, 3),
    };
  }

  function snapshotPendingTraitor(pending, now) {
    return {
      id: pending.id,
      fromType: pending.fromType,
      targetType: pending.targetType,
      remaining: remaining(pending.at, now),
    };
  }

  function snapshotZone(zone) {
    return {
      label: zone.label,
      x: n(zone.x, 1),
      y: n(zone.y, 1),
      r: n(zone.r, 1),
      owner: zone.owner,
      claimType: zone.claimType,
      claim: n(zone.claim || 0, 3),
      pulse: n(zone.pulse || 0, 3),
    };
  }

  function snapshotTenFight(now) {
    return {
      used: Boolean(state.tenFight.used),
      pending: Boolean(state.tenFight.pending),
      active: Boolean(state.tenFight.active),
      minority: state.tenFight.minority,
      majority: state.tenFight.majority,
      freezeRemaining: remaining(state.tenFight.freezeUntil, now),
      activeRemaining: remaining(state.tenFight.endAt, now),
      lastKillAgo: Math.max(0, now - (state.tenFight.lastKillAt || now)),
    };
  }

  function snapshotRevive(revive, now) {
    return {
      type: revive.type,
      x: n(revive.x, 1),
      y: n(revive.y, 1),
      remaining: remaining(revive.at, now),
    };
  }

  function snapshotParticle(particle) {
    return {
      x: n(particle.x, 1),
      y: n(particle.y, 1),
      size: n(particle.size, 2),
      life: n(particle.life, 1),
      maxLife: n(particle.maxLife, 1),
      color: particle.color,
    };
  }

  function restoreEntity(entity, now, existing = null) {
    const targetX = Number(entity.x) || 0;
    const targetY = Number(entity.y) || 0;
    const useBlend = existing && Math.hypot(existing.x - targetX, existing.y - targetY) < 90;
    return {
      id: Number(entity.id) || 0,
      type: clampType(entity.type),
      x: useBlend ? existing.x + (targetX - existing.x) * 0.72 : targetX,
      y: useBlend ? existing.y + (targetY - existing.y) * 0.72 : targetY,
      vx: Number(entity.vx) || 0,
      vy: Number(entity.vy) || 0,
      lastConverted: -Infinity,
      scale: useBlend ? existing.scale + ((Number(entity.scale) || 1) - existing.scale) * 0.5 : Number(entity.scale) || 1,
      mutant: Boolean(entity.mutant),
      mutantShiftAt: Infinity,
      shield: Boolean(entity.shield),
      speedUntil: now + Math.max(0, Number(entity.speedRemaining) || 0),
      flash: Number(entity.flash) || 0,
      dead: false,
    };
  }

  function restoreObstacle(obstacle) {
    if (obstacle?.shape === "circle") {
      return {
        shape: "circle",
        x: Number(obstacle.x) || 0,
        y: Number(obstacle.y) || 0,
        r: Math.max(0, Number(obstacle.r) || 0),
      };
    }
    return {
      shape: "rect",
      x: Number(obstacle?.x) || 0,
      y: Number(obstacle?.y) || 0,
      w: Math.max(0, Number(obstacle?.w) || 0),
      h: Math.max(0, Number(obstacle?.h) || 0),
    };
  }

  function restorePowerUp(power, now) {
    const life = Math.max(0, Number(power.lifeRemaining) || 0);
    return {
      kind: String(power.kind || "speed"),
      x: Number(power.x) || 0,
      y: Number(power.y) || 0,
      r: Math.max(0, Number(power.r) || 0),
      born: now,
      life,
      pulse: Number(power.pulse) || 0,
    };
  }

  function restoreBlackHole(hole) {
    return {
      x: Number(hole.x) || 0,
      y: Number(hole.y) || 0,
      vx: Number(hole.vx) || 0,
      vy: Number(hole.vy) || 0,
      r: Math.max(0, Number(hole.r) || 0),
      pullRadius: Math.max(0, Number(hole.pullRadius) || 0),
      born: performance.now(),
      life: 10000,
      spin: Number(hole.spin) || 0,
    };
  }

  function restorePendingTraitor(pending, now) {
    return {
      id: Number(pending.id) || 0,
      fromType: clampType(pending.fromType),
      targetType: pending.targetType === null ? null : clampType(pending.targetType),
      born: now,
      at: now + Math.max(0, Number(pending.remaining) || 0),
    };
  }

  function restoreZones(zones) {
    return {
      scores: numericArray(zones?.scores, 3),
      points: Array.isArray(zones?.points) ? zones.points.map((zone) => ({
        label: String(zone.label || ""),
        x: Number(zone.x) || 0,
        y: Number(zone.y) || 0,
        r: Math.max(0, Number(zone.r) || 0),
        owner: zone.owner === null ? null : clampType(zone.owner),
        claimType: zone.claimType === null ? null : clampType(zone.claimType),
        claim: Number(zone.claim) || 0,
        pulse: Number(zone.pulse) || 0,
      })) : [],
    };
  }

  function restoreBounty(bounty) {
    return {
      active: Boolean(bounty?.active),
      leader: bounty?.leader === null || bounty?.leader === undefined ? null : clampType(bounty.leader),
      lastLeader: bounty?.lastLeader === null || bounty?.lastLeader === undefined ? null : clampType(bounty.lastLeader),
    };
  }

  function restoreTenFight(tenFight, now) {
    const freezeRemaining = Math.max(0, Number(tenFight?.freezeRemaining) || 0);
    const activeRemaining = Math.max(0, Number(tenFight?.activeRemaining) || 0);
    return {
      used: Boolean(tenFight?.used),
      pending: Boolean(tenFight?.pending),
      active: Boolean(tenFight?.active),
      minority: tenFight?.minority === null || tenFight?.minority === undefined ? null : clampType(tenFight.minority),
      majority: tenFight?.majority === null || tenFight?.majority === undefined ? null : clampType(tenFight.majority),
      freezeUntil: now + freezeRemaining,
      startAt: activeRemaining ? now : 0,
      endAt: now + activeRemaining,
      lastKillAt: now - Math.max(0, Number(tenFight?.lastKillAgo) || 0),
    };
  }

  function restoreRevive(revive, now) {
    return {
      type: clampType(revive.type),
      x: Number(revive.x) || 0,
      y: Number(revive.y) || 0,
      at: now + Math.max(0, Number(revive.remaining) || 0),
    };
  }

  function restoreParticle(particle) {
    return {
      x: Number(particle.x) || 0,
      y: Number(particle.y) || 0,
      size: Math.max(0, Number(particle.size) || 0),
      life: Math.max(0, Number(particle.life) || 0),
      maxLife: Math.max(1, Number(particle.maxLife) || 1),
      color: String(particle.color || "rgba(23,32,28,0.5)"),
    };
  }

  function sanitizeOptions(options) {
    return GAMEPLAY_OPTION_KEYS.reduce((result, key) => {
      result[key] = Boolean(options?.[key]);
      return result;
    }, {});
  }

  function sanitizeArena(arena) {
    return {
      padding: Number(arena?.padding) || 0,
      targetPadding: Number(arena?.targetPadding) || 0,
      maxPadding: Number(arena?.maxPadding) || 0,
      hardMaxPadding: Number(arena?.hardMaxPadding) || 0,
      finalStarted: Boolean(arena?.finalStarted),
    };
  }

  function countAlive() {
    const counts = [0, 0, 0];
    for (const entity of state.entities) {
      if (!entity.dead && counts[entity.type] !== undefined) counts[entity.type] += 1;
    }
    return counts;
  }

  return {
    buildSnapshot,
    applySnapshot,
    advanceRemoteFrame,
  };
}

function roomArenaBounds(state) {
  const pad = state.options.shrink ? Number(state.arena.padding) || 0 : 0;
  return {
    left: 20 + pad,
    right: ROOM_STAGE_WIDTH - 20 - pad,
    top: 112 + pad * 0.68,
    bottom: ROOM_STAGE_HEIGHT - 112 - pad,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function numericArray(value, length) {
  return Array.from({ length }, (_, index) => Number(value?.[index]) || 0);
}

function clampType(value) {
  const type = Number(value);
  return [0, 1, 2].includes(type) ? type : 0;
}

function remaining(deadline, now) {
  if (!Number.isFinite(deadline)) return 0;
  return n(Math.max(0, deadline - now), 0);
}

function n(value, digits) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  const factor = 10 ** digits;
  return Math.round(number * factor) / factor;
}
