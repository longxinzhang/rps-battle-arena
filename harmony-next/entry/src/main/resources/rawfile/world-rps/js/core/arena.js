import {
  BASE_RADIUS,
  BASE_SPEED,
  SHRINK_MIN_ARENA,
} from "../config/constants.js";

export function createArenaSystem({
  app,
  canvas,
  ctx,
  state,
  clamp,
  rand,
  isTenFightHero,
}) {
  let nextEntityId = 1;

  function syncViewportHeight() {
    const viewport = window.visualViewport;
    const height = Math.max(1, Math.round(viewport?.height || window.innerHeight || document.documentElement.clientHeight || 320));
    document.documentElement.style.setProperty("--app-height", `${height}px`);
  }

  function syncHudMetrics(ui) {
    const hudBox = ui.hud.getBoundingClientRect();
    const appBox = app.getBoundingClientRect();
    const top = Math.round(hudBox.bottom - appBox.top + 8);
    document.documentElement.style.setProperty("--event-top", `${top}px`);
  }

  function resize(ui) {
    syncViewportHeight();
    const rect = app.getBoundingClientRect();
    state.dpr = window.devicePixelRatio || 1;
    state.W = Math.round(rect.width || window.innerWidth);
    state.H = Math.round(rect.height || window.innerHeight);
    canvas.width = Math.floor(state.W * state.dpr);
    canvas.height = Math.floor(state.H * state.dpr);
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    syncHudMetrics(ui);
    updateArenaMax();
    for (const entity of state.entities) {
      resolveArenaCollision(entity);
    }
  }

  function hudReserve() {
    if (state.W <= 560) return Math.min(112, state.H * 0.18);
    if (state.W <= 860) return Math.min(132, state.H * 0.22);
    return 76;
  }

  function bottomReserve() {
    const base = state.W <= 560 ? 112 : state.W <= 860 ? 100 : 86;
    return Math.min(base, Math.max(74, state.H * 0.26));
  }

  function updateArenaMax() {
    const top = hudReserve();
    const bottom = bottomReserve();
    const maxX = Math.max(0, (state.W - 270) / 2);
    const maxY = Math.max(0, (state.H - top - bottom - 250) / 2);
    state.arena.maxPadding = Math.max(0, Math.min(maxX, maxY, Math.min(state.W, state.H) * 0.22));
    const hardX = Math.max(0, (state.W - 40 - SHRINK_MIN_ARENA) / 2);
    const hardY = Math.max(0, (state.H - top - bottom - SHRINK_MIN_ARENA) / 1.68);
    state.arena.hardMaxPadding = Math.max(state.arena.maxPadding, Math.min(hardX, hardY));
    state.arena.targetPadding = Math.min(state.arena.targetPadding, state.arena.hardMaxPadding);
    state.arena.padding = Math.min(state.arena.padding, state.arena.hardMaxPadding);
  }

  function arenaBounds() {
    const pad = state.options.shrink ? state.arena.padding : 0;
    const topBase = hudReserve();
    const left = 20 + pad;
    const right = state.W - 20 - pad;
    const top = topBase + pad * 0.68;
    const bottom = state.H - bottomReserve() - pad;
    return { left, right, top, bottom };
  }

  function entityRadius(entity) {
    return BASE_RADIUS * (entity.mutant ? 1.32 : 1) * (isTenFightHero(entity) ? 1.16 : 1);
  }

  function createEntity(type, x, y, options = {}) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(BASE_SPEED * 0.45, BASE_SPEED * 1.25);
    return {
      id: nextEntityId++,
      type,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      lastConverted: -Infinity,
      scale: options.mutant ? 1.28 : 1,
      mutant: Boolean(options.mutant),
      mutantShiftAt: Infinity,
      shield: Boolean(options.shield),
      speedUntil: 0,
      flash: 0,
      dead: false,
    };
  }

  function safePoint(radius = BASE_RADIUS, attempts = 80) {
    const bounds = arenaBounds();
    for (let i = 0; i < attempts; i += 1) {
      const point = {
        x: rand(bounds.left + radius, bounds.right - radius),
        y: rand(bounds.top + radius, bounds.bottom - radius),
      };
      if (!state.obstacles.some((obstacle) => pointHitsObstacle(point.x, point.y, radius + 4, obstacle))) {
        return point;
      }
    }
    return {
      x: (bounds.left + bounds.right) / 2 + rand(-20, 20),
      y: (bounds.top + bounds.bottom) / 2 + rand(-20, 20),
    };
  }

  function spawnEntities(counts) {
    state.entities = [];
    nextEntityId = 1;
    for (let type = 0; type < 3; type += 1) {
      for (let i = 0; i < counts[type]; i += 1) {
        const point = safePoint(BASE_RADIUS + 3);
        state.entities.push(createEntity(type, point.x, point.y));
      }
    }
  }

  function generateObstacles() {
    state.obstacles = [];
    if (!state.options.obstacles) return;
    const bounds = arenaBounds();
    const area = Math.max(1, (bounds.right - bounds.left) * (bounds.bottom - bounds.top));
    const count = clamp(Math.round(area / 155000), 3, 7);
    for (let i = 0; i < count; i += 1) {
      const shape = Math.random() < 0.58 ? "circle" : "rect";
      const point = safePoint(58, 120);
      if (shape === "circle") {
        state.obstacles.push({
          shape,
          x: point.x,
          y: point.y,
          r: rand(25, 48),
        });
      } else {
        state.obstacles.push({
          shape,
          x: point.x,
          y: point.y,
          w: rand(82, 136),
          h: rand(22, 38),
        });
      }
    }
  }

  function resolveArenaCollision(entity) {
    const bounds = arenaBounds();
    const radius = entityRadius(entity);
    if (entity.x < bounds.left + radius) {
      entity.x = bounds.left + radius;
      entity.vx = Math.abs(entity.vx) * 0.82;
    }
    if (entity.x > bounds.right - radius) {
      entity.x = bounds.right - radius;
      entity.vx = -Math.abs(entity.vx) * 0.82;
    }
    if (entity.y < bounds.top + radius) {
      entity.y = bounds.top + radius;
      entity.vy = Math.abs(entity.vy) * 0.82;
    }
    if (entity.y > bounds.bottom - radius) {
      entity.y = bounds.bottom - radius;
      entity.vy = -Math.abs(entity.vy) * 0.82;
    }
  }

  function pointHitsObstacle(x, y, radius, obstacle) {
    if (obstacle.shape === "circle") {
      const dx = x - obstacle.x;
      const dy = y - obstacle.y;
      return Math.sqrt(dx * dx + dy * dy) < radius + obstacle.r;
    }
    const closestX = clamp(x, obstacle.x - obstacle.w / 2, obstacle.x + obstacle.w / 2);
    const closestY = clamp(y, obstacle.y - obstacle.h / 2, obstacle.y + obstacle.h / 2);
    const dx = x - closestX;
    const dy = y - closestY;
    return dx * dx + dy * dy < radius * radius;
  }

  function resolveObstacleCollision(entity, obstacle) {
    const radius = entityRadius(entity);
    if (obstacle.shape === "circle") {
      const dx = entity.x - obstacle.x;
      const dy = entity.y - obstacle.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const minDist = radius + obstacle.r;
      if (dist >= minDist) return;
      const nx = dx / dist;
      const ny = dy / dist;
      entity.x += nx * (minDist - dist);
      entity.y += ny * (minDist - dist);
      reflectEntity(entity, nx, ny, 0.84);
      return;
    }

    const left = obstacle.x - obstacle.w / 2;
    const right = obstacle.x + obstacle.w / 2;
    const top = obstacle.y - obstacle.h / 2;
    const bottom = obstacle.y + obstacle.h / 2;
    const closestX = clamp(entity.x, left, right);
    const closestY = clamp(entity.y, top, bottom);
    let dx = entity.x - closestX;
    let dy = entity.y - closestY;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      const distances = [
        { nx: -1, ny: 0, d: Math.abs(entity.x - left) },
        { nx: 1, ny: 0, d: Math.abs(right - entity.x) },
        { nx: 0, ny: -1, d: Math.abs(entity.y - top) },
        { nx: 0, ny: 1, d: Math.abs(bottom - entity.y) },
      ].sort((a, b) => a.d - b.d);
      dx = distances[0].nx;
      dy = distances[0].ny;
      dist = 1;
    }

    if (dist < radius) {
      const nx = dx / dist;
      const ny = dy / dist;
      entity.x += nx * (radius - dist);
      entity.y += ny * (radius - dist);
      reflectEntity(entity, nx, ny, 0.86);
    }
  }

  function reflectEntity(entity, nx, ny, dampening) {
    const dot = entity.vx * nx + entity.vy * ny;
    if (dot < 0) {
      entity.vx -= (1 + dampening) * dot * nx;
      entity.vy -= (1 + dampening) * dot * ny;
    }
  }

  return {
    syncViewportHeight,
    syncHudMetrics,
    resize,
    updateArenaMax,
    arenaBounds,
    entityRadius,
    createEntity,
    safePoint,
    spawnEntities,
    generateObstacles,
    resolveArenaCollision,
    pointHitsObstacle,
    resolveObstacleCollision,
  };
}
