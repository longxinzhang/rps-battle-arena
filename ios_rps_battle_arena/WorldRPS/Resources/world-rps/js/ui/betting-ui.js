const TYPE_META = [
  { emoji: "🪨", label: "石头" },
  { emoji: "✂️", label: "剪刀" },
  { emoji: "✋🏻", label: "布" },
];

export function createBettingUI({ ui }) {
  function showNameEntry(defaultName = "", options = {}) {
    showElement(ui.roomScreen, "grid");
    showElement(ui.roomNamePanel, "grid");
    hideElement(ui.roomBettingPanel);
    hideElement(ui.roomSettlePanel);
    hideElement(ui.roomWatchBar);
    hideElement(ui.roomRankPanel);
    ui.roomNameInput.value = defaultName;
    ui.roomCodeInput.value = options.roomCode || "";
    ui.roomStatus.textContent = options.status || "留空房间号会自动创建；输入房间号可加入朋友的房间。";
    setTimeout(() => ui.roomNameInput.focus(), 0);
  }

  function showBetting({
    preset,
    seconds,
    selectedType,
    players,
    currentUser,
    currentPlayerId,
    roomCode,
    playerCount,
    maxPlayers,
    isHost,
    online,
  }) {
    showElement(ui.roomScreen, "grid");
    hideElement(ui.roomNamePanel);
    showElement(ui.roomBettingPanel, "grid");
    hideElement(ui.roomSettlePanel);
    hideElement(ui.roomWatchBar);
    hideElement(ui.roomRankPanel);
    ui.roomPresetTitle.textContent = `本局：${preset.name}`;
    ui.roomMechanics.textContent = `机制：${preset.mechanics.join(" / ") || "基础规则"}`;
    updateRoomBadge({ roomCode, playerCount, maxPlayers, isHost, online });
    updateBettingCountdown(seconds);
    updateSelectedPick(selectedType);
    renderLeaderboard(ui.roomLeaderboard, players, currentUser, currentPlayerId);
  }

  function updateBettingCountdown(seconds) {
    ui.roomCountdown.textContent = `下注时间：${seconds} 秒`;
  }

  function updateSelectedPick(type) {
    ui.roomPicks.forEach((button) => {
      button.classList.toggle("active", parseInt(button.dataset.roomPick, 10) === type);
    });
    ui.roomPickStatus.textContent = type === null || type === undefined
      ? "请选择本局赢家"
      : `你押了 ${TYPE_META[type].emoji}${TYPE_META[type].label}`;
  }

  function showWatching({
    selectedType,
    players,
    currentUser,
    currentPlayerId,
    roomCode,
    online,
    spectator,
  }) {
    hideElement(ui.roomScreen);
    showElement(ui.roomWatchBar, "flex");
    const prefix = online && roomCode ? `房间 ${roomCode} · ` : "";
    ui.roomWatchStatus.textContent = selectedType === null || selectedType === undefined
      ? `${prefix}${spectator ? "同步观战中" : "本局未下注"}`
      : `${prefix}${spectator ? "同步观战中 · " : ""}你押了 ${TYPE_META[selectedType].emoji}${TYPE_META[selectedType].label}`;
    renderLeaderboard(ui.roomWatchBoard, players, currentUser, currentPlayerId);
  }

  function showSettlement({
    winnerType,
    selectedType,
    points,
    streak,
    seconds,
    players,
    currentUser,
    currentPlayerId,
  }) {
    showElement(ui.roomScreen, "grid");
    hideElement(ui.roomNamePanel);
    hideElement(ui.roomBettingPanel);
    showElement(ui.roomSettlePanel, "grid");
    hideElement(ui.roomWatchBar);
    hideElement(ui.roomRankPanel);
    const winner = TYPE_META[winnerType];
    const picked = selectedType === null || selectedType === undefined ? null : TYPE_META[selectedType];
    const hit = winnerType !== null && winnerType !== undefined && selectedType === winnerType;
    ui.roomSettleEmoji.textContent = winner?.emoji || "·";
    ui.roomSettleTitle.textContent = winner ? `${winner.emoji} 获胜！` : "本局平局";
    ui.roomSettleDetail.textContent = picked
      ? `你押了 ${picked.emoji}${picked.label} — ${hit ? `猜中 +${points} 分，连胜 ${streak}` : "未猜中，本局 +0 分"}`
      : "本局未下注，不参与结算。";
    updateSettlementCountdown(seconds);
    renderLeaderboard(ui.roomSettleBoard, players, currentUser, currentPlayerId);
  }

  function updateSettlementCountdown(seconds) {
    ui.roomSettleCountdown.textContent = `下一局开始：${seconds} 秒`;
  }

  function hideAll() {
    hideElement(ui.roomScreen);
    hideElement(ui.roomWatchBar);
    hideElement(ui.roomRankPanel);
  }

  function toggleRankPanel() {
    if (ui.roomRankPanel.classList.contains("hidden")) {
      showElement(ui.roomRankPanel);
    } else {
      hideElement(ui.roomRankPanel);
    }
  }

  function renderLeaderboard(target, players, currentUser, currentPlayerId = "") {
    const sorted = [...players].sort((a, b) => b.score - a.score || b.wins - a.wins || a.name.localeCompare(b.name));
    const top = sorted.slice(0, 20);
    const current = sorted.find((player) => player.id === currentPlayerId || player.name === currentUser);
    const rows = [...top];
    if (current && !rows.some((player) => player.id === current.id || player.name === current.name)) {
      rows.push(current);
    }
    target.replaceChildren(...rows.map((player) => renderPlayerRow(player, sorted.indexOf(player) + 1, currentUser, currentPlayerId)));
  }

  function renderPlayerRow(player, rank, currentUser, currentPlayerId) {
    const row = document.createElement("div");
    const isCurrent = player.id === currentPlayerId || player.name === currentUser;
    row.className = `room-rank-row${isCurrent ? " current" : ""}`;
    const winRate = player.total ? `${Math.round((player.wins / player.total) * 100)}%` : "--";
    row.innerHTML = `
      <span>#${rank}</span>
      <span class="room-rank-name"></span>
      <span>${player.score}</span>
      <span>${winRate}</span>
      <span>${player.streak >= 2 ? `🔥${player.streak}` : player.streak || ""}</span>
    `;
    row.querySelector(".room-rank-name").textContent = player.name;
    return row;
  }

  function updateRoomBadge({ roomCode, playerCount, maxPlayers, isHost, online }) {
    if (!online || !roomCode) {
      ui.roomCodeBadge.textContent = "本机房间";
      return;
    }
    const role = isHost ? "房主" : "成员";
    ui.roomCodeBadge.textContent = `房间 ${roomCode} · ${playerCount}/${maxPlayers} · ${role}`;
  }

  return {
    showNameEntry,
    showBetting,
    updateBettingCountdown,
    updateSelectedPick,
    showWatching,
    showSettlement,
    updateSettlementCountdown,
    hideAll,
    toggleRankPanel,
    renderLeaderboard,
  };
}

function showElement(element, display = "block") {
  element.hidden = false;
  element.classList.remove("hidden");
  element.style.display = display;
}

function hideElement(element) {
  element.classList.add("hidden");
  element.hidden = true;
  element.style.removeProperty("display");
}
