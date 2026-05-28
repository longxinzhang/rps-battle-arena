import {
  FIELD_RADIUS,
  LAST_STAND_REVIVE_DELAY,
  POWER_INFO,
} from "../config/constants.js";
import { drawEntitiesLayer } from "./entities.js";

export function createCanvasRenderer({
  ctx,
  state,
  typeInfo,
  arenaBounds,
  entityRadius,
  pendingTraitorFor,
  isTenFightHero,
  clamp,
}) {
  function draw() {
    ctx.clearRect(0, 0, state.W, state.H);
    drawBackground();
    drawArena();
    drawControlZones();
    drawObstacles();
    drawPowerUps();
    drawBlackHoles();
    drawLastStandRevives(performance.now());
    drawEntities();
    drawPointerField(performance.now());
    drawParticles();
  }

  function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, state.W, state.H);
    gradient.addColorStop(0, "#f4f2eb");
    gradient.addColorStop(0.48, "#edf5f1");
    gradient.addColorStop(1, "#eef0fa");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, state.W, state.H);

    ctx.save();
    ctx.strokeStyle = "rgba(23,32,28,0.045)";
    ctx.lineWidth = 1;
    const step = 42;
    for (let x = -step; x < state.W + step; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.H);
      ctx.stroke();
    }
    for (let y = -step; y < state.H + step; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.W, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawArena() {
    const bounds = arenaBounds();
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.strokeStyle = state.options.shrink ? "rgba(44,143,127,0.72)" : "rgba(23,32,28,0.18)";
    ctx.lineWidth = 2;
    ctx.setLineDash(state.options.shrink ? [9, 8] : []);
    roundedRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top, 8);
    ctx.fill();
    ctx.stroke();

    if (state.options.shrink && state.arena.targetPadding > 0) {
      ctx.setLineDash([]);
      ctx.strokeStyle = "rgba(217,92,71,0.42)";
      ctx.lineWidth = 5;
      roundedRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top, 8);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawControlZones() {
    if (!state.options.zones || !state.zones.points.length) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const zone of state.zones.points) {
      const owner = zone.owner === null ? null : typeInfo[zone.owner];
      const claim = zone.claimType === null ? null : typeInfo[zone.claimType];
      const pulse = Math.sin(zone.pulse) * 2;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.r + pulse, 0, Math.PI * 2);
      ctx.fillStyle = owner ? `${owner.color}1f` : "rgba(23,32,28,0.055)";
      ctx.fill();
      ctx.strokeStyle = owner ? `${owner.color}88` : "rgba(23,32,28,0.18)";
      ctx.lineWidth = 2;
      ctx.stroke();

      if (claim) {
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, zone.r + 8, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * zone.claim);
        ctx.strokeStyle = claim.color;
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(zone.x, zone.y, 25, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.84)";
      ctx.fill();
      ctx.strokeStyle = "rgba(23,32,28,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = owner ? owner.color : "#637067";
      ctx.font = "900 16px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(zone.label, zone.x, zone.y - 5);
      ctx.font = "800 10px -apple-system, BlinkMacSystemFont, sans-serif";
      const score = owner ? Math.floor(state.zones.scores[zone.owner]) : 0;
      ctx.fillText(String(score), zone.x, zone.y + 10);
    }
    ctx.restore();
  }

  function drawObstacles() {
    ctx.save();
    for (const obstacle of state.obstacles) {
      ctx.fillStyle = "rgba(39,51,46,0.14)";
      ctx.strokeStyle = "rgba(39,51,46,0.22)";
      ctx.lineWidth = 2;
      if (obstacle.shape === "circle") {
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(obstacle.x - obstacle.r * 0.25, obstacle.y - obstacle.r * 0.25, obstacle.r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.24)";
        ctx.fill();
      } else {
        roundedRect(obstacle.x - obstacle.w / 2, obstacle.y - obstacle.h / 2, obstacle.w, obstacle.h, 8);
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawPowerUps() {
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const power of state.powerUps) {
      const info = POWER_INFO[power.kind];
      const pulse = Math.sin(power.pulse) * 2;
      ctx.beginPath();
      ctx.arc(power.x, power.y, power.r + pulse, 0, Math.PI * 2);
      ctx.fillStyle = `${info.color}22`;
      ctx.fill();
      ctx.strokeStyle = info.color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = "18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = info.color;
      ctx.fillText(info.icon, power.x, power.y + 1);
    }
    ctx.restore();
  }

  function drawBlackHoles() {
    ctx.save();
    for (const hole of state.blackHoles) {
      const radius = hole.r + Math.sin(hole.spin * 1.7) * 2;
      const gradient = ctx.createRadialGradient(hole.x, hole.y, 3, hole.x, hole.y, radius);
      gradient.addColorStop(0, "#000");
      gradient.addColorStop(0.62, "#1f1728");
      gradient.addColorStop(1, "rgba(31,23,40,0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, radius * 1.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(240,180,41,0.75)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, radius, hole.spin, hole.spin + Math.PI * 1.35);
      ctx.stroke();
      ctx.strokeStyle = "rgba(32,164,243,0.45)";
      ctx.beginPath();
      ctx.arc(hole.x, hole.y, radius * 1.22, -hole.spin, -hole.spin + Math.PI * 1.1);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLastStandRevives(now) {
    if (!state.options.lastStand || !state.lastStand.pendingRevives.length) return;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const revive of state.lastStand.pendingRevives) {
      const info = typeInfo[revive.type];
      const remaining = Math.max(0, revive.at - now);
      const progress = 1 - remaining / LAST_STAND_REVIVE_DELAY;
      ctx.beginPath();
      ctx.arc(revive.x, revive.y, 28 + Math.sin(now * 0.012) * 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      ctx.strokeStyle = info.color;
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(revive.x, revive.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.72)";
      ctx.fill();
      ctx.font = "700 12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillStyle = info.color;
      ctx.fillText(`${Math.ceil(remaining / 1000)}`, revive.x, revive.y + 1);
    }
    ctx.restore();
  }

  function drawEntities() {
    drawEntitiesLayer({
      ctx,
      state,
      typeInfo,
      entityRadius,
      pendingTraitorFor,
      isTenFightHero,
      clamp,
    });
  }

  function drawPointerField(now) {
    if (!state.options.godHand) return;
    const age = now - state.pointer.lastMove;
    if (age > 520) return;
    const alpha = 1 - age / 520;
    ctx.save();
    ctx.globalAlpha = alpha * 0.72;
    const isPull = state.pointer.mode === "pull";
    ctx.strokeStyle = isPull ? "rgba(217,92,71,0.75)" : "rgba(32,164,243,0.75)";
    ctx.fillStyle = isPull ? "rgba(217,92,71,0.08)" : "rgba(32,164,243,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, FIELD_RADIUS * (0.82 + alpha * 0.18), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(state.pointer.x, state.pointer.y, 16, 0, Math.PI * 2);
    ctx.fillStyle = isPull ? "rgba(217,92,71,0.24)" : "rgba(32,164,243,0.24)";
    ctx.fill();
    ctx.restore();
  }

  function drawParticles() {
    ctx.save();
    for (const particle of state.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function roundedRect(x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return { draw };
}
