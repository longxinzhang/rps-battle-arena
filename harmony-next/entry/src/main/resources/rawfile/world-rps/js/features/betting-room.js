import {
  ROOM_SNAPSHOT_UPLOAD_MS,
  ROOM_STAGE_COUNT,
  ROOM_STATE_POLL_MS,
} from "../config/constants.js";
import { createRoomApi } from "../services/room-api.js?v=0.2.6";
import { createRoomSnapshotTools } from "../services/room-snapshot.js?v=0.2.6";
import { createBettingUI } from "../ui/betting-ui.js?v=0.2.6";

const PLAYERS_KEY = "wrps_betting_players";
const ROUND_KEY = "wrps_betting_round";
const USER_KEY = "wrps_betting_current_user";
const ROOM_CODE_KEY = "wrps_room_code";
const LOCAL_ROOM_CODE = "";

const ROOM_PRESETS = [
  { key: "classic", name: "经典大乱斗", mechanics: ["死斗"] },
  { key: "zones", name: "团队占点", mechanics: ["据点", "黑洞", "绝地求生"] },
  { key: "traitor", name: "小心叛徒", mechanics: ["缩圈", "黑洞", "叛徒", "死斗"] },
  { key: "equality", name: "众生平等", mechanics: ["灭霸响指", "地形障碍", "死斗"] },
];

export function createBettingRoom({
  state,
  ui,
  audio,
  applyPreset,
  readSetup,
  startRound,
  showStartScreen,
  updateOptionVisibility,
  resize,
  draw,
  updateHud,
}) {
  const bettingUI = createBettingUI({ ui });
  const roomApi = createRoomApi();
  const snapshots = createRoomSnapshotTools({ state, updateHud, draw });
  let players = loadPlayers();
  let syncing = false;
  let snapshotUploading = false;

  function open() {
    const savedName = storageGet(USER_KEY, "");
    const savedRoom = storageGet(ROOM_CODE_KEY, roomApi.lastRoomCode || "");
    bettingUI.showNameEntry(savedName, {
      roomCode: savedRoom,
      status: "输入房间号加入朋友；留空自动创建。服务器最多 2 个房间，每房 10 人。",
    });
    checkRoomService();
  }

  async function checkRoomService() {
    try {
      const health = await roomApi.health();
      ui.roomStatus.textContent = `联网房间可用：${health.rooms}/${health.maxRooms} 个房间，单房最多 ${health.maxPlayers} 人。`;
    } catch {
      ui.roomStatus.textContent = "当前是静态服务，竞猜房间会退回本机模式；要多人同步请用 node server.mjs 启动。";
    }
  }

  async function joinRoom() {
    const name = ui.roomNameInput.value.trim().slice(0, 8) || "玩家";
    const roomCode = sanitizeRoomCode(ui.roomCodeInput.value);
    state.bettingRoom.currentUser = name;
    storageSet(USER_KEY, name);

    try {
      const remote = await roomApi.join({ name, roomCode });
      enterOnlineRoom(remote);
    } catch (error) {
      if (roomCode || isCapacityError(error)) {
        bettingUI.showNameEntry(name, {
          roomCode,
          status: error.message || "无法加入房间，请确认房间号。",
        });
        return;
      }
      beginLocalRoom(name);
    }
  }

  function enterOnlineRoom(remote) {
    clearTimers();
    storageSet(ROOM_CODE_KEY, remote.roomCode);
    state.bettingRoom.active = true;
    state.bettingRoom.online = true;
    state.bettingRoom.roomCode = remote.roomCode;
    state.bettingRoom.playerId = roomApi.playerId;
    state.bettingRoom.currentUser = remote.currentPlayer?.name || state.bettingRoom.currentUser;
    state.bettingRoom.startedRound = 0;
    state.bettingRoom.settledRound = 0;
    syncFromServer(remote, { force: true });
    state.bettingRoom.syncTimer = window.setInterval(pollRoomState, ROOM_STATE_POLL_MS);
  }

  async function pollRoomState() {
    if (!state.bettingRoom.online || !state.bettingRoom.roomCode || syncing) return;
    syncing = true;
    try {
      const remote = await roomApi.getState(state.bettingRoom.roomCode);
      syncFromServer(remote);
    } catch (error) {
      ui.roomStatus.textContent = error.message || "房间同步失败";
    } finally {
      syncing = false;
    }
  }

  function syncFromServer(remote, options = {}) {
    const current = remote.currentPlayer || {};
    players = remote.players || [];
    state.bettingRoom.phase = remote.phase;
    state.bettingRoom.round = remote.round;
    state.bettingRoom.roomCode = remote.roomCode;
    state.bettingRoom.isHost = Boolean(remote.isHost);
    state.bettingRoom.currentPreset = remote.preset;
    state.bettingRoom.selectedType = current.pick;
    state.bettingRoom.lockedType = current.lockedPick;
    state.bettingRoom.lastResult = remote.lastResult;

    if (remote.phase === "betting") {
      state.bettingRoom.remoteSpectator = false;
      stopSnapshotSync();
      stopLocalGame();
      setFixedRoomStage(false);
      applyRoomPreset(remote.preset);
      bettingUI.showBetting({
        preset: remote.preset,
        seconds: remote.secondsRemaining,
        selectedType: current.pick,
        players,
        currentUser: current.name,
        currentPlayerId: remote.currentPlayerId,
        roomCode: remote.roomCode,
        playerCount: players.length,
        maxPlayers: remote.maxPlayers,
        isHost: remote.isHost,
        online: true,
      });
      state.bettingRoom.startedRound = 0;
      return;
    }

    if (remote.phase === "watching") {
      handleWatchingPhase(remote, options);
      return;
    }

    if (remote.phase === "settling") {
      state.bettingRoom.remoteSpectator = false;
      stopSnapshotSync();
      stopLocalGame();
      setFixedRoomStage(false);
      bettingUI.showSettlement({
        winnerType: remote.lastResult?.winnerType,
        selectedType: current.lockedPick,
        points: current.pointsThisRound || 0,
        streak: current.streak || 0,
        seconds: remote.secondsRemaining,
        players,
        currentUser: current.name,
        currentPlayerId: remote.currentPlayerId,
      });
      state.bettingRoom.settledRound = remote.round;
    }
  }

  function handleWatchingPhase(remote, options = {}) {
    const needsStart = state.bettingRoom.startedRound !== remote.round || options.force;
    if (remote.isHost) {
      if (needsStart || state.bettingRoom.remoteSpectator) {
        startHostRound(remote);
      } else {
        showWatching(remote);
      }
      return;
    }

    if (needsStart || !state.bettingRoom.remoteSpectator) {
      startRemoteSpectator(remote);
    } else {
      showWatching(remote);
    }
    if (remote.snapshot?.round === remote.round) {
      snapshots.applySnapshot(remote.snapshot);
    }
  }

  function startHostRound(remote) {
    applyRoomPreset(remote.preset);
    readSetup();
    state.options.godHand = false;
    ui.inputs.godHand.checked = false;
    updateOptionVisibility();
    state.roundIndex = 1;
    state.wins = [0, 0, 0];
    state.penalties = [0, 0, 0];
    state.suddenDeath = false;
    state.bettingRoom.remoteSpectator = false;
    setFixedRoomStage(true);
    ui.startScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    showWatching(remote);
    audio.init().catch(() => {});
    startRound();
    startSnapshotSync();
    state.bettingRoom.startedRound = remote.round;
  }

  function startRemoteSpectator(remote) {
    applyRoomPreset(remote.preset);
    readSetup();
    state.options.godHand = false;
    ui.inputs.godHand.checked = false;
    updateOptionVisibility();
    state.roundIndex = 1;
    state.wins = [0, 0, 0];
    state.penalties = [0, 0, 0];
    state.suddenDeath = false;
    state.bettingRoom.remoteSpectator = true;
    stopSnapshotSync();
    setFixedRoomStage(true);
    cancelAnimationFrame(state.animId);
    state.running = true;
    state.paused = false;
    state.roundOver = false;
    state.roundStart = performance.now();
    state.lastTs = 0;
    state.entities = [];
    state.obstacles = [];
    state.powerUps = [];
    state.blackHoles = [];
    state.pendingTraitors = [];
    state.particles = [];
    state.zones.points = [];
    state.zones.scores = [0, 0, 0];
    ui.startScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    showWatching(remote);
    audio.init().then(() => audio.startBgm()).catch(() => {});
    if (!remote.snapshot) draw();
    startRemoteRenderLoop();
    state.bettingRoom.startedRound = remote.round;
  }

  function showWatching(remote) {
    const current = remote.currentPlayer || {};
    bettingUI.showWatching({
      selectedType: current.lockedPick,
      players,
      currentUser: current.name,
      currentPlayerId: remote.currentPlayerId,
      roomCode: remote.roomCode,
      online: true,
      spectator: !remote.isHost,
    });
  }

  function applyRoomPreset(preset) {
    if (preset?.key) applyPreset(preset.key);
    if (state.bettingRoom.online) {
      setRoomCounts(ROOM_STAGE_COUNT);
    }
    ui.inputs.godHand.checked = false;
    state.options.godHand = false;
    updateOptionVisibility();
  }

  function setRoomCounts(count) {
    ui.inputs.syncCounts.checked = true;
    [ui.inputs.rock, ui.inputs.scissors, ui.inputs.paper].forEach((input) => {
      input.value = String(count);
    });
  }

  async function pick(type) {
    if (!state.bettingRoom.active || state.bettingRoom.phase !== "betting") return;
    state.bettingRoom.selectedType = type;
    bettingUI.updateSelectedPick(type);
    if (state.bettingRoom.online) {
      try {
        const remote = await roomApi.bet(state.bettingRoom.roomCode, type);
        syncFromServer(remote);
      } catch (error) {
        ui.roomPickStatus.textContent = error.message || "下注失败";
      }
      return;
    }
    bettingUI.updateSelectedPick(type);
  }

  async function handleGameEnd({ winnerType, reason }) {
    if (!state.bettingRoom.active) return;
    if (state.bettingRoom.online) {
      if (!state.bettingRoom.isHost || state.bettingRoom.phase !== "watching") return;
      stopSnapshotSync();
      try {
        const remote = await roomApi.finish(state.bettingRoom.roomCode, {
          winnerType,
          reason,
          round: state.bettingRoom.round,
        });
        syncFromServer(remote);
      } catch (error) {
        console.warn(error);
      }
      return;
    }
    settleLocalRoom(winnerType);
  }

  function beginLocalRoom(name) {
    clearTimers();
    players = loadPlayers();
    state.bettingRoom.active = true;
    state.bettingRoom.online = false;
    state.bettingRoom.roomCode = LOCAL_ROOM_CODE;
    state.bettingRoom.currentUser = name;
    upsertPlayer(name);
    state.bettingRoom.round = loadRound();
    beginLocalBettingPhase();
  }

  function beginLocalBettingPhase() {
    clearTimers({ keepSync: true });
    state.bettingRoom.phase = "betting";
    state.bettingRoom.round += 1;
    state.bettingRoom.selectedType = null;
    state.bettingRoom.lockedType = null;
    saveRound(state.bettingRoom.round);
    const preset = ROOM_PRESETS[(state.bettingRoom.round - 1) % ROOM_PRESETS.length];
    state.bettingRoom.currentPreset = preset;
    applyRoomPreset(preset);
    bettingUI.showBetting({
      preset,
      seconds: 10,
      selectedType: null,
      players,
      currentUser: state.bettingRoom.currentUser,
      roomCode: "",
      playerCount: players.length,
      maxPlayers: 10,
      isHost: true,
      online: false,
    });
    let seconds = 10;
    state.bettingRoom.countdownTimer = window.setInterval(() => {
      seconds -= 1;
      bettingUI.updateBettingCountdown(seconds);
      if (seconds <= 0) {
        lockLocalBetAndStart();
      }
    }, 1000);
  }

  function lockLocalBetAndStart() {
    window.clearInterval(state.bettingRoom.countdownTimer);
    state.bettingRoom.countdownTimer = 0;
    state.bettingRoom.phase = "watching";
    state.bettingRoom.lockedType = state.bettingRoom.selectedType;
    readSetup();
    state.options.godHand = false;
    ui.inputs.godHand.checked = false;
    updateOptionVisibility();
    state.roundIndex = 1;
    state.wins = [0, 0, 0];
    state.penalties = [0, 0, 0];
    state.suddenDeath = false;
    ui.startScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    bettingUI.showWatching({
      selectedType: state.bettingRoom.lockedType,
      players,
      currentUser: state.bettingRoom.currentUser,
      online: false,
    });
    audio.init().catch(() => {});
    startRound();
  }

  function settleLocalRoom(winnerType) {
    clearTimers({ keepSync: true });
    state.bettingRoom.phase = "settling";
    players = loadPlayers();
    const player = upsertPlayer(state.bettingRoom.currentUser);
    const picked = state.bettingRoom.lockedType;
    let points = 0;
    if (picked !== null && picked !== undefined) {
      player.total += 1;
      player.lastActiveRound = state.bettingRoom.round;
      if (winnerType === picked) {
        player.wins += 1;
        player.streak += 1;
        player.bestStreak = Math.max(player.bestStreak, player.streak);
        points = 10 + Math.min(player.streak - 1, 9) * 5;
        player.score += points;
      } else {
        player.streak = 0;
      }
    }
    savePlayers(players);
    let seconds = 5;
    bettingUI.showSettlement({
      winnerType,
      selectedType: picked,
      points,
      streak: player.streak,
      seconds,
      players,
      currentUser: state.bettingRoom.currentUser,
    });
    state.bettingRoom.settleTimer = window.setInterval(() => {
      seconds -= 1;
      bettingUI.updateSettlementCountdown(seconds);
      if (seconds <= 0) beginLocalBettingPhase();
    }, 1000);
  }

  function exitRoom() {
    const roomCode = state.bettingRoom.roomCode;
    const wasOnline = state.bettingRoom.online;
    clearTimers();
    state.bettingRoom.active = false;
    state.bettingRoom.online = false;
    state.bettingRoom.phase = "idle";
    state.bettingRoom.remoteSpectator = false;
    setFixedRoomStage(false);
    bettingUI.hideAll();
    if (wasOnline && roomCode) {
      roomApi.leave(roomCode).catch(() => {});
    }
    showStartScreen();
  }

  function stopLocalGame() {
    if (!state.running && state.roundOver) return;
    state.running = false;
    state.roundOver = true;
    cancelAnimationFrame(state.animId);
    audio.pauseBgm();
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
  }

  function startRemoteRenderLoop() {
    cancelAnimationFrame(state.animId);
    state.bettingRoom.remoteFrameAt = performance.now();
    const loop = (now) => {
      if (!state.bettingRoom.remoteSpectator || state.bettingRoom.phase !== "watching") return;
      snapshots.advanceRemoteFrame(now);
      draw();
      state.animId = requestAnimationFrame(loop);
    };
    state.animId = requestAnimationFrame(loop);
  }

  function startSnapshotSync() {
    stopSnapshotSync();
    pushSnapshot();
    state.bettingRoom.snapshotTimer = window.setInterval(pushSnapshot, ROOM_SNAPSHOT_UPLOAD_MS);
  }

  async function pushSnapshot() {
    if (
      snapshotUploading
      || !state.bettingRoom.online
      || !state.bettingRoom.isHost
      || state.bettingRoom.phase !== "watching"
      || !state.bettingRoom.roomCode
    ) {
      return;
    }
    snapshotUploading = true;
    try {
      await roomApi.snapshot(state.bettingRoom.roomCode, {
        round: state.bettingRoom.round,
        snapshot: snapshots.buildSnapshot(state.bettingRoom.round),
      });
    } catch (error) {
      if (error.code === "not_host" || error.code === "not_watching" || error.code === "round_mismatch") {
        stopSnapshotSync();
      }
    } finally {
      snapshotUploading = false;
    }
  }

  function stopSnapshotSync() {
    window.clearInterval(state.bettingRoom.snapshotTimer);
    state.bettingRoom.snapshotTimer = 0;
  }

  function setFixedRoomStage(enabled) {
    state.bettingRoom.fixedStage = Boolean(enabled);
    ui.app.classList.toggle("room-fixed-stage", state.bettingRoom.fixedStage);
    document.body.classList.toggle("room-stage-active", state.bettingRoom.fixedStage);
    resize();
  }

  function clearTimers(options = {}) {
    window.clearInterval(state.bettingRoom.countdownTimer);
    window.clearInterval(state.bettingRoom.settleTimer);
    window.clearInterval(state.bettingRoom.snapshotTimer);
    window.clearTimeout(state.bettingRoom.autoTimer);
    if (!options.keepSync) {
      window.clearInterval(state.bettingRoom.syncTimer);
      state.bettingRoom.syncTimer = 0;
    }
    state.bettingRoom.countdownTimer = 0;
    state.bettingRoom.settleTimer = 0;
    state.bettingRoom.snapshotTimer = 0;
    state.bettingRoom.autoTimer = 0;
  }

  function upsertPlayer(name) {
    let player = players.find((item) => item.name === name);
    if (!player) {
      player = {
        name,
        score: 0,
        wins: 0,
        total: 0,
        streak: 0,
        bestStreak: 0,
        lastActiveRound: 0,
      };
      players.push(player);
      savePlayers(players);
    }
    return player;
  }

  ui.roomScreen.addEventListener("click", (event) => {
    const confirm = event.target.closest("#room-name-confirm");
    if (confirm) {
      joinRoom();
      return;
    }
    const exit = event.target.closest("#room-exit");
    if (exit) {
      exitRoom();
      return;
    }
    const pickButton = event.target.closest("[data-room-pick]");
    if (pickButton) {
      pick(parseInt(pickButton.dataset.roomPick, 10));
    }
  });
  ui.roomNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinRoom();
  });
  ui.roomCodeInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") joinRoom();
  });
  ui.roomRankToggle.addEventListener("click", bettingUI.toggleRankPanel);

  return {
    open,
    handleGameEnd,
    exitRoom,
  };
}

function loadPlayers() {
  try {
    const parsed = JSON.parse(storageGet(PLAYERS_KEY, "[]"));
    return Array.isArray(parsed) ? parsed.map(normalizePlayer) : [];
  } catch {
    return [];
  }
}

function savePlayers(players) {
  storageSet(PLAYERS_KEY, JSON.stringify(players.map(normalizePlayer)));
}

function normalizePlayer(player) {
  return {
    name: String(player.name || "").slice(0, 8),
    score: Number(player.score) || 0,
    wins: Number(player.wins) || 0,
    total: Number(player.total) || 0,
    streak: Number(player.streak) || 0,
    bestStreak: Number(player.bestStreak) || 0,
    lastActiveRound: Number(player.lastActiveRound) || 0,
  };
}

function loadRound() {
  return Number(storageGet(ROUND_KEY, "0")) || 0;
}

function saveRound(round) {
  storageSet(ROUND_KEY, String(round));
}

function sanitizeRoomCode(value) {
  const code = String(value || "").replace(/\D/g, "").slice(0, 4);
  return code.length === 4 ? code : "";
}

function isCapacityError(error) {
  return ["rooms_full", "room_full", "room_not_found"].includes(error.code);
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
    // Storage can be unavailable in some embedded WebViews; the room still runs in memory.
  }
}
