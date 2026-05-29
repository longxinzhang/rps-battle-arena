import {
  CONTROL_ZONE_CAPTURE_RATE,
  CONTROL_ZONE_RADIUS,
  CONTROL_ZONE_SCORE_RATE,
  CONTROL_ZONE_TARGET,
} from "../config/constants.js";
import { logEvent } from "../services/battleLog.js?v=0.2.6";

export function createZonesFeature({
  state,
  typeInfo,
  audio,
  clamp,
  rand,
  arenaBounds,
  emitBurst,
  addEvent,
}) {
  function resetControlZones() {
    state.zones.points = [];
    state.zones.scores = [0, 0, 0];
  }

  function generateControlZones() {
    if (!state.options.zones) return;
    const bounds = arenaBounds();
    const width = bounds.right - bounds.left;
    const height = bounds.bottom - bounds.top;
    const cx = (bounds.left + bounds.right) / 2;
    const cy = (bounds.top + bounds.bottom) / 2;
    const spreadX = Math.min(width * 0.26, 210);
    const spreadY = Math.min(height * 0.22, 150);
    const radius = clamp(Math.min(width, height) * 0.085, 42, CONTROL_ZONE_RADIUS);
    const positions = [
      { x: cx, y: cy - spreadY * 0.86 },
      { x: cx - spreadX, y: cy + spreadY * 0.72 },
      { x: cx + spreadX, y: cy + spreadY * 0.72 },
    ];
    state.zones.points = positions.map((point, index) => ({
      label: String.fromCharCode(65 + index),
      x: clamp(point.x, bounds.left + radius + 8, bounds.right - radius - 8),
      y: clamp(point.y, bounds.top + radius + 8, bounds.bottom - radius - 8),
      r: radius,
      owner: null,
      claimType: null,
      claim: 0,
      pulse: rand(0, Math.PI * 2),
    }));
    addEvent("据点争夺开始", "#20a4f3");
  }

  function updateControlZones(now, dt) {
    if (!state.options.zones || !state.zones.points.length) return;
    for (const zone of state.zones.points) {
      zone.pulse += 0.04 * dt;
      const presence = [0, 0, 0];
      for (const entity of state.entities) {
        if (entity.dead) continue;
        const dx = entity.x - zone.x;
        const dy = entity.y - zone.y;
        if (dx * dx + dy * dy <= zone.r * zone.r) {
          presence[entity.type] += 1;
        }
      }
      updateZoneClaim(zone, presence, dt);
      if (zone.owner !== null) {
        state.zones.scores[zone.owner] = Math.min(
          CONTROL_ZONE_TARGET,
          state.zones.scores[zone.owner] + CONTROL_ZONE_SCORE_RATE * dt,
        );
      }
    }
  }

  function updateZoneClaim(zone, presence, dt) {
    const ranked = presence
      .map((count, type) => ({ count, type }))
      .sort((a, b) => b.count - a.count);
    const hasDominant = ranked[0].count > 0 && ranked[0].count > ranked[1].count;
    if (hasDominant) {
      claimZone(zone, ranked, dt);
    } else if (zone.owner === null) {
      zone.claim *= Math.max(0, 1 - 0.012 * dt);
      if (zone.claim < 0.02) zone.claimType = null;
    }
  }

  function claimZone(zone, ranked, dt) {
    const dominant = ranked[0].type;
    if (zone.claimType !== dominant) {
      zone.claimType = dominant;
      zone.claim = zone.owner === dominant ? 1 : Math.max(0, zone.claim * 0.28);
    }
    const pressure = ranked[0].count - ranked[1].count;
    zone.claim = clamp(
      zone.claim + CONTROL_ZONE_CAPTURE_RATE * (1 + Math.min(pressure, 8) * 0.2) * dt,
      0,
      1,
    );
    if (zone.claim >= 1 && zone.owner !== dominant) {
      zone.owner = dominant;
      logEvent("event_trigger", {
        eventName: "据点_占领",
        detail: { pointId: zone.label, factionType: dominant },
      });
      addEvent(`${typeInfo[dominant].emoji} 占领据点 ${zone.label}`, typeInfo[dominant].color);
      emitBurst(zone.x, zone.y, typeInfo[dominant].color, 20, 4);
      audio.event();
    }
  }

  return {
    resetControlZones,
    generateControlZones,
    updateControlZones,
  };
}
