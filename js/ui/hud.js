export function createHudController({
  state,
  ui,
  countEntities,
  getIntroSummaryRenderer,
}) {
  function updateHud(counts = countEntities()) {
    for (let i = 0; i < 3; i += 1) {
      ui.score[i].textContent = String(counts[i]);
    }
    ui.roundIndex.textContent = String(state.roundIndex);
    ui.roundTotal.textContent = String(state.options.tournament ? state.bestOf : 1);
    if (state.options.tournament) {
      ui.matchScore.textContent = state.wins.join(" · ");
    } else if (state.options.zones) {
      ui.matchScore.textContent = `据点 ${state.zones.scores.map((score) => Math.floor(score)).join(" · ")}`;
    } else {
      ui.matchScore.textContent = "单局";
    }
    updateBank();
    if (state.options.deathmatch) {
      ui.timer.textContent = "死斗";
    } else if (state.running && !state.roundOver) {
      const remaining = Math.max(0, state.roundLimit - (performance.now() - state.roundStart));
      ui.timer.textContent = (remaining / 1000).toFixed(1);
    } else {
      ui.timer.textContent = (state.roundLimit / 1000).toFixed(1);
    }
  }

  function updateBank() {
    if (!state.options.betting) {
      ui.bank.textContent = "未开";
      return;
    }
    ui.bank.textContent = String(state.bank);
    ui.inputs.stake.max = String(Math.max(0, state.bank));
    if ((parseInt(ui.inputs.stake.value, 10) || 0) > state.bank) {
      ui.inputs.stake.value = Math.max(0, state.bank);
    }
    ui.nextStake.max = String(Math.max(0, state.bank));
    if ((parseInt(ui.nextStake.value, 10) || 0) > state.bank) {
      ui.nextStake.value = Math.max(0, state.bank);
    }
  }

  function setPrediction(type) {
    state.prediction = type;
    syncPredictionButtons();
    if (!ui.betScreen.classList.contains("hidden")) {
      getIntroSummaryRenderer()?.();
    }
  }

  function syncPredictionButtons() {
    document.querySelectorAll("[data-pick]").forEach((item) => {
      item.classList.toggle("active", parseInt(item.dataset.pick, 10) === state.prediction);
    });
    document.querySelectorAll("[data-intro-pick]").forEach((item) => {
      item.classList.toggle("active", parseInt(item.dataset.introPick, 10) === state.prediction);
    });
  }

  return {
    updateHud,
    updateBank,
    setPrediction,
    syncPredictionButtons,
  };
}
