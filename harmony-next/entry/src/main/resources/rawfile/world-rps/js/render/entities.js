import {
  IS_IOS,
  TRAITOR_COLOR,
  TRAITOR_WARNING_DURATION,
} from "../config/constants.js";

export function drawEntitiesLayer({
  ctx,
  state,
  typeInfo,
  entityRadius,
  pendingTraitorFor,
  isTenFightHero,
  clamp,
}) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const now = performance.now();
  for (const entity of state.entities) {
    drawEntity({
      ctx,
      state,
      typeInfo,
      entityRadius,
      pendingTraitorFor,
      isTenFightHero,
      clamp,
      entity,
      now,
    });
  }
  ctx.restore();
}

function drawEntity(context) {
  const {
    ctx,
    state,
    typeInfo,
    entityRadius,
    pendingTraitorFor,
    isTenFightHero,
    entity,
    now,
  } = context;
  const radius = entityRadius(entity);
  const info = typeInfo[entity.type];
  ctx.save();
  ctx.translate(entity.x, entity.y);
  ctx.scale(entity.scale, entity.scale);

  if (isTenFightHero(entity)) {
    drawTenFightTrail(ctx, entity, radius, info, now);
  }
  drawEntityStatusRings(context, radius, info);

  const pendingTraitor = pendingTraitorFor(entity);
  if (pendingTraitor) {
    drawPendingTraitorBadge(context, pendingTraitor, radius, now);
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.9, 0, Math.PI * 2);
  ctx.fillStyle = IS_IOS ? "rgba(255,255,255,0.52)" : "rgba(255,255,255,0.34)";
  ctx.fill();
  ctx.font = `${radius * (IS_IOS ? 1.72 : 1.55)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
  ctx.fillStyle = "#17201c";
  ctx.fillText(info.emoji, 0, 0);
  ctx.restore();
}

function drawEntityStatusRings(context, radius, info) {
  const { ctx, state, isTenFightHero, entity, now } = context;
  if (entity.mutant) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6 + entity.flash * 4, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(139,92,246,0.92)";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12 + Math.sin(performance.now() * 0.014 + entity.id) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(139,92,246,0.38)";
    ctx.lineWidth = 5;
    ctx.stroke();
  }

  if (entity.shield) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 8, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(32,164,243,0.86)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (entity.speedUntil > now) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 12, -Math.PI * 0.2, Math.PI * 1.1);
    ctx.strokeStyle = "rgba(239,155,32,0.75)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (state.options.bounty && state.bounty.active && entity.type === state.bounty.leader) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 13 + Math.sin(now * 0.016 + entity.id) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(240,180,41,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  if (isTenFightHero(entity)) {
    ctx.beginPath();
    ctx.arc(0, 0, radius + 14 + Math.sin(now * 0.02 + entity.id) * 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(240,180,41,0.9)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

function drawPendingTraitorBadge(context, pending, radius, now) {
  const { ctx, clamp } = context;
  const remaining = clamp(pending.at - now, 0, TRAITOR_WARNING_DURATION);
  const progress = remaining / TRAITOR_WARNING_DURATION;
  const pulse = Math.sin(now * 0.018 + pending.id) * 1.7;
  const badgeY = -radius - 18;
  const badgeRadius = 12;

  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, radius + 9 + pulse, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(139,92,246,0.82)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, badgeY, badgeRadius + 4, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(139,92,246,0.18)";
  ctx.fill();
  ctx.strokeStyle = "rgba(139,92,246,0.46)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, badgeY, badgeRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(
    0,
    badgeY,
    badgeRadius + 2,
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI * 2 * progress,
  );
  ctx.strokeStyle = TRAITOR_COLOR;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = TRAITOR_COLOR;
  ctx.font = "900 11px -apple-system, BlinkMacSystemFont, sans-serif";
  ctx.fillText(`${Math.ceil(remaining / 1000)}`, 0, badgeY + 1);
  ctx.restore();
}

function drawTenFightTrail(ctx, entity, radius, info, now) {
  const speed = Math.sqrt(entity.vx * entity.vx + entity.vy * entity.vy);
  const tx = speed > 0.05 ? -entity.vx / speed : Math.cos(now * 0.004 + entity.id);
  const ty = speed > 0.05 ? -entity.vy / speed : Math.sin(now * 0.004 + entity.id);
  ctx.save();
  for (let i = 3; i >= 1; i -= 1) {
    const offset = radius * (0.45 + i * 0.52);
    ctx.beginPath();
    ctx.arc(tx * offset, ty * offset, radius * (0.92 - i * 0.16), 0, Math.PI * 2);
    ctx.fillStyle = i % 2 === 0
      ? "rgba(240,180,41,0.18)"
      : `${info.color}2b`;
    ctx.fill();
  }
  ctx.restore();
}
