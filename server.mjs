import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";

const ROOT = fileURLToPath(new URL(".", import.meta.url));
const HOST = process.env.HOST || "127.0.0.1";
const PORT = Number(process.env.PORT || 5173);
const MAX_ROOMS = 2;
const MAX_PLAYERS = 10;
const BETTING_MS = 10000;
const SETTLE_MS = 5000;
const WATCH_TIMEOUT_MS = 90000;
const PLAYER_TTL_MS = 5 * 60 * 1000;
const MAX_JSON_BYTES = 512 * 1024;
const MAX_SNAPSHOT_ENTITIES = 220;

const ROOM_PRESETS = [
  { key: "classic", name: "经典大乱斗", mechanics: ["死斗"] },
  { key: "zones", name: "团队占点", mechanics: ["据点", "黑洞", "绝地求生"] },
  { key: "traitor", name: "小心叛徒", mechanics: ["缩圈", "黑洞", "叛徒", "死斗"] },
  { key: "equality", name: "众生平等", mechanics: ["灭霸响指", "地形障碍", "死斗"] },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".svg": "image/svg+xml",
};

const rooms = new Map();

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    cleanupRooms();
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    await serveStatic(req, res, url);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: "server_error", message: "服务器错误" });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`World of RPS server: http://${HOST}:${PORT}/`);
  console.log(`Room limit: ${MAX_ROOMS} rooms, ${MAX_PLAYERS} players each`);
});

async function handleApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      rooms: rooms.size,
      maxRooms: MAX_ROOMS,
      maxPlayers: MAX_PLAYERS,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rooms/join") {
    const body = await readJson(req);
    const result = joinRoom(body);
    sendJson(res, result.status, result.body);
    return;
  }

  const match = url.pathname.match(/^\/api\/rooms\/([0-9]{4})(?:\/([a-z]+))?$/);
  if (!match) {
    sendJson(res, 404, { error: "not_found", message: "接口不存在" });
    return;
  }

  const room = rooms.get(match[1]);
  const action = match[2] || "state";
  if (!room) {
    sendJson(res, 404, { error: "room_not_found", message: "房间不存在或已关闭" });
    return;
  }

  advanceRoom(room);

  if (req.method === "GET" && action === "state") {
    const playerId = url.searchParams.get("playerId");
    touchPlayer(room, playerId);
    sendJson(res, 200, roomState(room, playerId));
    return;
  }

  const body = await readJson(req);
  const playerId = body.playerId;
  touchPlayer(room, playerId);

  if (req.method === "POST" && action === "bet") {
    const result = setBet(room, playerId, body.type);
    sendJson(res, result.status, result.body);
    return;
  }

  if (req.method === "POST" && action === "end") {
    const result = finishRoomRound(room, playerId, body);
    sendJson(res, result.status, result.body);
    return;
  }

  if (req.method === "POST" && action === "snapshot") {
    const result = updateRoomSnapshot(room, playerId, body);
    sendJson(res, result.status, result.body);
    return;
  }

  if (req.method === "POST" && action === "leave") {
    const result = leaveRoom(room, playerId);
    sendJson(res, result.status, result.body);
    return;
  }

  sendJson(res, 404, { error: "not_found", message: "接口不存在" });
}

function joinRoom(body) {
  const name = normalizeName(body.name);
  const playerId = normalizeId(body.playerId) || randomUUID();
  let room = null;
  const requestedCode = String(body.roomCode || "").replace(/\D/g, "").slice(0, 4);

  if (requestedCode) {
    room = rooms.get(requestedCode);
    if (!room) {
      return {
        status: 404,
        body: { error: "room_not_found", message: "没有找到这个房间" },
      };
    }
  } else {
    if (rooms.size >= MAX_ROOMS) {
      return {
        status: 429,
        body: { error: "rooms_full", message: "服务器房间已满，目前最多同时开启 2 个房间" },
      };
    }
    room = createRoom();
  }

  if (!room.players.has(playerId) && room.players.size >= MAX_PLAYERS) {
    return {
      status: 429,
      body: { error: "room_full", message: "这个房间已满，最多 10 人" },
    };
  }

  const player = room.players.get(playerId) || createPlayer(playerId, name);
  player.name = name;
  player.lastSeen = Date.now();
  player.online = true;
  room.players.set(playerId, player);
  if (!room.hostId || !room.players.has(room.hostId)) {
    room.hostId = playerId;
  }
  advanceRoom(room);
  return {
    status: 200,
    body: roomState(room, playerId),
  };
}

function createRoom() {
  const room = {
    code: makeRoomCode(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
    round: 0,
    phase: "betting",
    phaseEndsAt: 0,
    watchingStartedAt: 0,
    preset: ROOM_PRESETS[0],
    hostId: null,
    players: new Map(),
    lastResult: null,
    snapshot: null,
  };
  rooms.set(room.code, room);
  beginBetting(room);
  return room;
}

function createPlayer(id, name) {
  return {
    id,
    name,
    score: 0,
    wins: 0,
    total: 0,
    streak: 0,
    bestStreak: 0,
    lastActiveRound: 0,
    pick: null,
    lockedPick: null,
    pointsThisRound: 0,
    lastSeen: Date.now(),
    online: true,
  };
}

function beginBetting(room) {
  room.round += 1;
  room.phase = "betting";
  room.phaseEndsAt = Date.now() + BETTING_MS;
  room.watchingStartedAt = 0;
  room.preset = ROOM_PRESETS[(room.round - 1) % ROOM_PRESETS.length];
  room.lastResult = null;
  room.snapshot = null;
  room.updatedAt = Date.now();
  for (const player of room.players.values()) {
    player.pick = null;
    player.lockedPick = null;
    player.pointsThisRound = 0;
  }
}

function advanceRoom(room) {
  assignHost(room);
  const now = Date.now();
  if (room.phase === "betting" && now >= room.phaseEndsAt) {
    for (const player of room.players.values()) {
      player.lockedPick = player.pick;
    }
    room.phase = "watching";
    room.phaseEndsAt = 0;
    room.watchingStartedAt = now;
    room.snapshot = null;
    room.updatedAt = now;
  }
  if (room.phase === "watching" && now - room.watchingStartedAt > WATCH_TIMEOUT_MS) {
    settleRoom(room, pickFallbackWinner(), "timeout");
  }
  if (room.phase === "settling" && now >= room.phaseEndsAt) {
    beginBetting(room);
  }
}

function assignHost(room) {
  if (room.hostId && room.players.has(room.hostId)) return;
  room.hostId = room.players.keys().next().value || null;
}

function setBet(room, playerId, type) {
  const player = room.players.get(playerId);
  if (!player) {
    return { status: 404, body: { error: "player_not_found", message: "玩家不存在" } };
  }
  if (room.phase !== "betting") {
    return { status: 409, body: { error: "betting_closed", message: "下注已截止" } };
  }
  const normalized = Number(type);
  if (![0, 1, 2].includes(normalized)) {
    return { status: 400, body: { error: "invalid_pick", message: "下注选项无效" } };
  }
  player.pick = normalized;
  room.updatedAt = Date.now();
  return { status: 200, body: roomState(room, playerId) };
}

function finishRoomRound(room, playerId, body) {
  if (room.hostId !== playerId) {
    return { status: 403, body: { error: "not_host", message: "只有房主页面可以提交结果" } };
  }
  if (room.phase !== "watching") {
    return { status: 409, body: { error: "not_watching", message: "当前不在观战阶段" } };
  }
  if (Number(body.round) !== room.round) {
    return { status: 409, body: { error: "round_mismatch", message: "对局轮次已变化" } };
  }
  const winnerType = [0, 1, 2].includes(Number(body.winnerType)) ? Number(body.winnerType) : null;
  settleRoom(room, winnerType, body.reason || "normal");
  return { status: 200, body: roomState(room, playerId) };
}

function updateRoomSnapshot(room, playerId, body) {
  if (room.hostId !== playerId) {
    return { status: 403, body: { error: "not_host", message: "只有房主页面可以同步画面" } };
  }
  if (room.phase !== "watching") {
    return { status: 409, body: { error: "not_watching", message: "当前不在观战阶段" } };
  }
  if (Number(body.round) !== room.round) {
    return { status: 409, body: { error: "round_mismatch", message: "对局轮次已变化" } };
  }
  const snapshot = sanitizeSnapshot(body.snapshot, room.round);
  if (!snapshot) {
    return { status: 400, body: { error: "invalid_snapshot", message: "画面快照无效" } };
  }
  room.snapshot = {
    ...snapshot,
    serverAt: Date.now(),
  };
  room.updatedAt = Date.now();
  return { status: 200, body: { ok: true } };
}

function settleRoom(room, winnerType, reason) {
  room.phase = "settling";
  room.phaseEndsAt = Date.now() + SETTLE_MS;
  room.updatedAt = Date.now();
  room.snapshot = null;
  room.lastResult = {
    winnerType,
    reason,
    round: room.round,
  };
  for (const player of room.players.values()) {
    player.pointsThisRound = 0;
    if (player.lockedPick === null || player.lockedPick === undefined) continue;
    player.total += 1;
    player.lastActiveRound = room.round;
    if (winnerType === player.lockedPick) {
      player.wins += 1;
      player.streak += 1;
      player.bestStreak = Math.max(player.bestStreak, player.streak);
      player.pointsThisRound = 10 + Math.min(player.streak - 1, 9) * 5;
      player.score += player.pointsThisRound;
    } else {
      player.streak = 0;
    }
  }
}

function leaveRoom(room, playerId) {
  if (playerId) {
    room.players.delete(playerId);
  }
  if (!room.players.size) {
    rooms.delete(room.code);
    return { status: 200, body: { ok: true } };
  }
  assignHost(room);
  return { status: 200, body: roomState(room, room.hostId) };
}

function roomState(room, currentPlayerId) {
  advanceRoom(room);
  const currentPlayer = room.players.get(currentPlayerId) || null;
  const secondsRemaining = room.phaseEndsAt
    ? Math.max(0, Math.ceil((room.phaseEndsAt - Date.now()) / 1000))
    : 0;
  return {
    ok: true,
    online: true,
    roomCode: room.code,
    maxRooms: MAX_ROOMS,
    maxPlayers: MAX_PLAYERS,
    roomCount: rooms.size,
    phase: room.phase,
    round: room.round,
    secondsRemaining,
    preset: room.preset,
    hostId: room.hostId,
    isHost: currentPlayerId === room.hostId,
    currentPlayerId,
    currentPlayer: currentPlayer ? publicPlayer(currentPlayer) : null,
    players: [...room.players.values()]
      .sort((a, b) => b.score - a.score || b.wins - a.wins || a.name.localeCompare(b.name))
      .map(publicPlayer),
    lastResult: room.lastResult,
    snapshot: room.phase === "watching" ? room.snapshot : null,
  };
}

function publicPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    wins: player.wins,
    total: player.total,
    streak: player.streak,
    bestStreak: player.bestStreak,
    lastActiveRound: player.lastActiveRound,
    pick: player.pick,
    lockedPick: player.lockedPick,
    pointsThisRound: player.pointsThisRound,
    online: player.online,
  };
}

function touchPlayer(room, playerId) {
  const player = playerId ? room.players.get(playerId) : null;
  if (!player) return;
  player.lastSeen = Date.now();
  player.online = true;
}

function cleanupRooms() {
  const now = Date.now();
  for (const room of rooms.values()) {
    for (const [id, player] of room.players) {
      if (now - player.lastSeen > PLAYER_TTL_MS) {
        room.players.delete(id);
      } else {
        player.online = now - player.lastSeen < 15000;
      }
    }
    if (!room.players.size && now - room.createdAt > 30000) {
      rooms.delete(room.code);
    } else {
      assignHost(room);
    }
  }
}

async function serveStatic(req, res, url) {
  if (!["GET", "HEAD"].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  const requestPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const normalized = normalize(requestPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(ROOT, normalized);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error("not_file");
    const type = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": info.size,
      "Cache-Control": "no-store",
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

async function readJson(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_JSON_BYTES) return {};
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(body));
}

function normalizeName(name) {
  return String(name || "玩家").trim().slice(0, 8) || "玩家";
}

function normalizeId(id) {
  return String(id || "").trim().slice(0, 80);
}

function sanitizeSnapshot(snapshot, round) {
  if (!snapshot || typeof snapshot !== "object") return null;
  if (Number(snapshot.round) !== round || Number(snapshot.schema) !== 1) return null;
  const entities = Array.isArray(snapshot.entities) ? snapshot.entities.slice(0, MAX_SNAPSHOT_ENTITIES) : [];
  return {
    ...snapshot,
    round,
    seq: Math.max(0, Number(snapshot.seq) || 0),
    entities,
  };
}

function makeRoomCode() {
  for (let i = 0; i < 80; i += 1) {
    const code = String(1000 + (randomBytes(2).readUInt16BE(0) % 9000));
    if (!rooms.has(code)) return code;
  }
  for (let code = 1000; code <= 9999; code += 1) {
    if (!rooms.has(String(code))) return String(code);
  }
  throw new Error("room_code_exhausted");
}

function pickFallbackWinner() {
  return Math.floor(Math.random() * 3);
}
