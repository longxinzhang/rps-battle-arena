const PLAYER_ID_KEY = "wrps_room_player_id";
const ROOM_CODE_KEY = "wrps_room_code";

export function createRoomApi() {
  const playerId = getOrCreatePlayerId();

  async function health() {
    return request("/api/health", { method: "GET" });
  }

  async function join({ name, roomCode }) {
    const state = await request("/api/rooms/join", {
      method: "POST",
      body: {
        playerId,
        name,
        roomCode,
      },
    });
    if (state.roomCode) storageSet(ROOM_CODE_KEY, state.roomCode);
    return state;
  }

  async function getState(roomCode) {
    return request(`/api/rooms/${roomCode}/state?playerId=${encodeURIComponent(playerId)}`, {
      method: "GET",
    });
  }

  async function bet(roomCode, type) {
    return request(`/api/rooms/${roomCode}/bet`, {
      method: "POST",
      body: {
        playerId,
        type,
      },
    });
  }

  async function finish(roomCode, payload) {
    return request(`/api/rooms/${roomCode}/end`, {
      method: "POST",
      body: {
        playerId,
        ...payload,
      },
    });
  }

  async function snapshot(roomCode, payload) {
    return request(`/api/rooms/${roomCode}/snapshot`, {
      method: "POST",
      body: {
        playerId,
        ...payload,
      },
    });
  }

  async function leave(roomCode) {
    if (!roomCode) return null;
    return request(`/api/rooms/${roomCode}/leave`, {
      method: "POST",
      body: { playerId },
    });
  }

  return {
    playerId,
    lastRoomCode: storageGet(ROOM_CODE_KEY, ""),
    health,
    join,
    getState,
    bet,
    finish,
    snapshot,
    leave,
  };
}

async function request(path, options) {
  const init = {
    method: options.method,
    headers: {
      Accept: "application/json",
    },
  };
  if (options.body) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(options.body);
  }
  const response = await fetch(path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const error = new Error(data.message || "房间服务不可用");
    error.code = data.error || `http_${response.status}`;
    error.status = response.status;
    throw error;
  }
  return data;
}

function getOrCreatePlayerId() {
  const saved = storageGet(PLAYER_ID_KEY, "");
  if (saved) return saved;
  const id = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  storageSet(PLAYER_ID_KEY, id);
  return id;
}

function storageGet(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked in embedded WebViews; keep the in-memory value for this page.
  }
}
