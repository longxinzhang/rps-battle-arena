import {
  BASE_SPEED,
  MAX_ENTITIES,
  POWER_INFO,
} from "../config/constants.js";
import { logEvent } from "../services/battleLog.js?v=0.2.6";

export function createPowerUpFeature({
  state,
  typeInfo,
  audio,
  rand,
  createEntity,
  entityRadius,
  resolveArenaCollision,
  emitBurst,
  addEvent,
}) {
  function applyPowerUpPickups(entity, now) {
    for (const power of state.powerUps) {
      if (power.dead) continue;
      const dx = power.x - entity.x;
      const dy = power.y - entity.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < power.r + entityRadius(entity)) {
        power.dead = true;
        applyPowerUp(entity, power.kind, now);
      }
    }
  }

  function applyPowerUp(entity, kind, now) {
    if (kind === "speed") {
      applySpeedPower(entity, now);
    } else if (kind === "shield") {
      applyShieldPower(entity);
    } else if (kind === "split") {
      splitEntity(entity, now, 1);
      entity.scale = Math.max(entity.scale, 1.35);
    } else if (kind === "teamSpeed") {
      const members = aliveFactionMembers(entity.type);
      for (const member of members) {
        applySpeedPower(member, now);
      }
    } else if (kind === "teamShield") {
      const members = aliveFactionMembers(entity.type);
      for (const member of members) {
        applyShieldPower(member);
      }
    } else if (kind === "teamSplit") {
      const members = aliveFactionMembers(entity.type);
      const available = Math.max(0, MAX_ENTITIES - state.entities.length);
      for (const member of members.slice(0, available)) {
        splitEntity(member, now, 1.12);
      }
      for (const member of members) {
        member.scale = Math.max(member.scale, 1.32);
      }
    }
    const info = POWER_INFO[kind];
    logEvent("event_trigger", {
      eventName: "道具_拾取",
      detail: {
        entityId: entity.id,
        itemType: powerLogKind(kind),
      },
    });
    addEvent(powerUpEventText(entity, kind), info.color);
    emitBurst(entity.x, entity.y, info.color, 16, 3);
    audio.pickup(kind);
  }

  function aliveFactionMembers(type) {
    return state.entities.filter((member) => !member.dead && member.type === type);
  }

  function applySpeedPower(entity, now) {
    entity.speedUntil = Math.max(entity.speedUntil, now + 6800);
    entity.scale = Math.max(entity.scale, 1.35);
    entity.flash = Math.max(entity.flash, 0.45);
  }

  function applyShieldPower(entity) {
    entity.shield = true;
    entity.scale = Math.max(entity.scale, 1.34);
    entity.flash = Math.max(entity.flash, 0.4);
  }

  function splitEntity(entity, now, force = 1) {
    if (state.entities.length >= MAX_ENTITIES) return null;
    const angle = rand(0, Math.PI * 2);
    const radius = entityRadius(entity);
    const clone = createEntity(
      entity.type,
      entity.x + Math.cos(angle) * radius * 1.8,
      entity.y + Math.sin(angle) * radius * 1.8,
    );
    clone.vx = entity.vx * -0.5 + Math.cos(angle) * BASE_SPEED * force;
    clone.vy = entity.vy * -0.5 + Math.sin(angle) * BASE_SPEED * force;
    clone.scale = 1.55;
    clone.lastConverted = now;
    resolveArenaCollision(clone);
    state.entities.push(clone);
    return clone;
  }

  function powerUpEventText(entity, kind) {
    const info = POWER_INFO[kind];
    const prefix = typeInfo[entity.type].emoji;
    if (kind === "teamSpeed" || kind === "teamShield") {
      const count = aliveFactionMembers(entity.type).length;
      return `${prefix} 获得${info.label}，全队 ${count} 个生效`;
    }
    if (kind === "teamSplit") {
      const count = aliveFactionMembers(entity.type).length;
      return `${prefix} 获得${info.label}，全队尝试分裂`;
    }
    return `${prefix} 获得${info.label}`;
  }

  function powerLogKind(kind) {
    return kind.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  return {
    applyPowerUpPickups,
    aliveFactionMembers,
    splitEntity,
  };
}
