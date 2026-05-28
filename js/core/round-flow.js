import { TRAITOR_FIRST_DELAY } from "../config/constants.js";

export function createRoundFlow({
  state,
  ui,
  typeInfo,
  audio,
  rand,
  clamp,
  loop,
  draw,
  readSetup,
  currentRoundCounts,
  calculateOdds,
  updateOddsLabels,
  updateOddsFromInputs,
  updateHud,
  updateBank,
  countEntities,
  spawnEntities,
  updateArenaMax,
  generateObstacles,
  generateControlZones,
  resetControlZones,
  resetBountyState,
  resetLastStandState,
  resetThanosEvent,
  getTenFightControls,
  syncPredictionButtons,
  renderIntroSummary,
}) {
  async function startTournament() {
    audio.init().catch(() => {});
    audio.startBgm();
    readSetup();
    state.roundIndex = 1;
    state.wins = [0, 0, 0];
    state.penalties = [0, 0, 0];
    state.suddenDeath = false;
    state.bank = state.options.betting ? state.bank : 1000;
    showBetIntro();
  }

  function beginTournament() {
    clearCountdownTimers();
    ui.startScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    startRound();
  }

  function showBetIntro() {
    clearCountdownTimers();
    ui.startScreen.classList.add("hidden");
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.remove("hidden");
    syncPredictionButtons();
    renderIntroSummary();
    startBetCountdown();
  }

  function startBetCountdown() {
    clearCountdownTimers();
    const schedule = [
      [0, "3"],
      [1000, "2"],
      [2000, "1"],
      [3000, "开始！"],
    ];
    for (const [delay, text] of schedule) {
      state.countdownTimers.push(window.setTimeout(() => {
        ui.betCountdown.textContent = text;
      }, delay));
    }
    state.countdownTimers.push(window.setTimeout(beginTournament, 4000));
  }

  function clearCountdownTimers() {
    clearTimeout(state.countdownTimer);
    for (const timer of state.countdownTimers) {
      clearTimeout(timer);
    }
    state.countdownTimers = [];
  }

  function startRound() {
    const tenFight = getTenFightControls();
    const now = performance.now();
    state.running = true;
    state.paused = false;
    state.roundOver = false;
    state.suddenDeath = false;
    state.lastTs = 0;
    state.roundStart = now;
    state.nextPowerAt = now + rand(2600, 4300);
    state.nextTraitorAt = now + TRAITOR_FIRST_DELAY;
    state.nextBlackHoleAt = now + rand(13500, 18500);
    state.traitorEarlyUsed = false;
    resetThanosEvent(now);
    tenFight.resetTenFightEvent?.(now);
    resetControlZones();
    resetBountyState();
    state.powerUps = [];
    state.blackHoles = [];
    state.pendingTraitors = [];
    state.particles = [];
    state.arena.padding = 0;
    state.arena.targetPadding = 0;
    state.arena.lastShrink = now;
    state.arena.finalAt = 0;
    state.arena.finalStarted = false;
    ui.pauseToggle.textContent = "暂停";
    ui.homeBtn.classList.add("hidden");
    ui.settingsPanel.classList.add("hidden");
    audio.startBgm();
    updateArenaMax();
    generateObstacles();
    generateControlZones();
    const counts = currentRoundCounts();
    state.odds = calculateOdds(counts);
    updateOddsLabels(ui.odds, state.odds);
    updateOddsLabels(ui.nextOdds, state.odds);
    spawnEntities(counts);
    resetLastStandState();
    updateHud();
    cancelAnimationFrame(state.animId);
    state.animId = requestAnimationFrame(loop);
  }

  function showStartScreen() {
    const tenFight = getTenFightControls();
    state.running = false;
    state.roundOver = true;
    cancelAnimationFrame(state.animId);
    clearCountdownTimers();
    ui.resultScreen.classList.add("hidden");
    ui.betScreen.classList.add("hidden");
    ui.thanosScreen.classList.add("hidden");
    tenFight.hideTenFightUi?.();
    ui.settingsPanel.classList.add("hidden");
    ui.startScreen.classList.remove("hidden");
    ui.pauseToggle.textContent = "暂停";
    ui.homeBtn.classList.add("hidden");
    audio.stopBgm();
    updateOddsFromInputs();
    draw();
  }

  function finishRound(winnerType, reason) {
    const tenFight = getTenFightControls();
    if (state.roundOver) return;
    state.roundOver = true;
    state.running = false;
    cancelAnimationFrame(state.animId);
    audio.pauseBgm();
    if (reason === "ten-fight") {
      tenFight.hideTenFightBar?.();
    } else {
      tenFight.hideTenFightUi?.();
    }

    const counts = countEntities();
    let settlement = "本局没有结算";
    if (winnerType !== null && winnerType !== undefined) {
      if (state.options.tournament) {
        state.wins[winnerType] += 1;
        state.penalties[winnerType] += state.winnerPenalty;
      }
      settlement = settleBet(winnerType);
    }

    updateHud(counts);
    const maxWins = Math.ceil(state.bestOf / 2);
    const matchWinner = state.options.tournament
      ? state.wins.findIndex((wins) => wins >= maxWins)
      : -1;
    const isMatchDone = state.options.tournament && matchWinner !== -1;
    if (winnerType !== null && winnerType !== undefined) {
      if (!state.options.tournament || isMatchDone) {
        audio.finalWin(winnerType);
      } else {
        audio.win(winnerType);
      }
    }

    ui.winnerEmoji.textContent = winnerType === null ? "·" : typeInfo[winnerType].emoji;
    ui.winnerText.textContent = winnerType === null
      ? "本局平局"
      : `${typeInfo[winnerType].label}胜利`;

    const reasonText = roundReasonText(reason);
    const matchText = state.options.tournament
      ? isMatchDone
        ? `赛点结束：${typeInfo[matchWinner].label}拿下整场`
        : `胜场 ${formatWins()}，${reasonText}`
      : reasonText;

    ui.winnerSubtext.textContent = `${matchText}。${settlement}`;
    ui.nextRoundBtn.textContent = isMatchDone
      ? "新赛制"
      : state.options.tournament
        ? "下一局"
        : "再来一局";
    if (isMatchDone) {
      ui.nextBetPanel.classList.add("hidden");
    } else if (state.options.betting) {
      prepareNextBetPanel();
    } else {
      ui.nextBetPanel.classList.add("hidden");
    }
    ui.nextRoundBtn.onclick = isMatchDone ? showStartScreen : () => {
      applyNextBet();
      if (state.options.tournament) {
        state.roundIndex += 1;
      }
      ui.resultScreen.classList.add("hidden");
      showBetIntro();
    };
    ui.resultScreen.classList.remove("hidden");
  }

  function roundReasonText(reason) {
    if (reason === "timer") return "时间到，数量领先";
    if (reason === "zones") return "据点分数达标";
    if (reason === "zones-timer") return "时间到，据点领先";
    if (reason === "sudden") return "加时裁定";
    if (reason === "void") return "全部消失";
    if (reason === "shrink") return "终局缩圈裁定";
    if (reason === "ten-fight") return "以弱胜强！";
    return "全场统一";
  }

  function prepareNextBetPanel() {
    const nextOdds = calculateOdds(currentRoundCounts());
    state.odds = nextOdds;
    updateOddsLabels(ui.nextOdds, nextOdds);
    updateOddsLabels(ui.odds, nextOdds);
    ui.nextStake.value = String(clamp(
      parseInt(ui.inputs.stake.value, 10) || 0,
      0,
      Math.max(0, state.bank),
    ));
    ui.nextStake.max = String(Math.max(0, state.bank));
    syncPredictionButtons();
    ui.nextBetPanel.classList.remove("hidden");
  }

  function applyNextBet() {
    if (!state.options.betting) return;
    const stake = clamp(parseInt(ui.nextStake.value, 10) || 0, 0, Math.max(0, state.bank));
    state.stake = stake;
    ui.inputs.stake.value = stake;
    ui.nextStake.value = stake;
  }

  function settleBet(winnerType) {
    if (!state.options.betting) {
      updateBank();
      return "竞猜未开启";
    }
    const stake = clamp(parseInt(ui.inputs.stake.value, 10) || 0, 0, Math.max(0, state.bank));
    state.stake = stake;
    if (!stake) {
      updateBank();
      return "未下注";
    }
    if (state.prediction === winnerType) {
      const profit = Math.round(stake * (state.odds[winnerType] - 1));
      state.bank += profit;
      updateBank();
      return `猜中 +${profit}`;
    }
    state.bank = Math.max(0, state.bank - stake);
    updateBank();
    return `猜错 -${stake}`;
  }

  function formatWins() {
    return state.wins.map((wins, type) => `${typeInfo[type].emoji}${wins}`).join(" ");
  }

  return {
    startTournament,
    beginTournament,
    showBetIntro,
    startRound,
    showStartScreen,
    finishRound,
    clearCountdownTimers,
    prepareNextBetPanel,
    applyNextBet,
    settleBet,
  };
}
