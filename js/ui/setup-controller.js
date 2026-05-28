import { createPresetController } from "./preset-controller.js";
import { createSetupSummaryController } from "./setup-summary.js";

export function createSetupController({
  state,
  ui,
  TYPE_INFO,
  THEMES,
  GAMEPLAY_OPTION_KEYS,
  PRESETS,
  clamp,
  preyType,
  predatorType,
  audio,
  updateHud,
  draw,
  syncPredictionButtons,
  updateBank,
  syncHudMetrics,
}) {

  function countInputs() {
    return [ui.inputs.rock, ui.inputs.scissors, ui.inputs.paper];
  }

  function sanitizeCount(value) {
    return clamp(parseInt(value, 10) || 10, 3, 60);
  }

  function defaultThemeLabel(themeKey, index) {
    return THEMES[themeKey]?.types[index]?.label || THEMES.rps.types[index].label;
  }

  function customThemeLabel(themeKey, index) {
    if (themeKey === "rps") return defaultThemeLabel(themeKey, index);
    const label = state.customLabels[themeKey]?.[index]?.trim();
    return label || defaultThemeLabel(themeKey, index);
  }

  function updateTypeDom() {
    document.querySelectorAll("[data-type-emoji]").forEach((element) => {
      element.textContent = TYPE_INFO[parseInt(element.dataset.typeEmoji, 10)].emoji;
    });
    document.querySelectorAll("[data-type-label]").forEach((element) => {
      element.textContent = TYPE_INFO[parseInt(element.dataset.typeLabel, 10)].label;
    });
  }

  function syncCustomNameControls() {
    const canCustomize = state.theme !== "rps";
    document.querySelectorAll(".custom-name-row").forEach((row) => {
      row.classList.toggle("hidden", !canCustomize);
    });
    ui.inputs.names.forEach((input, index) => {
      input.disabled = !canCustomize;
      input.value = customThemeLabel(state.theme, index);
    });
  }

  function applyCustomLabel(index, value) {
    if (state.theme === "rps") return;
    const label = value.trim() || defaultThemeLabel(state.theme, index);
    state.customLabels[state.theme][index] = label;
    TYPE_INFO[index].label = label;
    updateTypeDom();
    syncPredictionButtons();
    updateSetupSummaries();
    draw();
  }

  function applyTheme(themeKey) {
    const key = THEMES[themeKey] ? themeKey : "rps";
    const theme = THEMES[key];
    state.theme = key;
    theme.types.forEach((item, index) => {
      Object.assign(TYPE_INFO[index], item, { label: customThemeLabel(key, index) });
    });

    const root = document.documentElement;
    root.style.setProperty("--rock", TYPE_INFO[0].color);
    root.style.setProperty("--scissors", TYPE_INFO[1].color);
    root.style.setProperty("--paper", TYPE_INFO[2].color);
    ui.brandSubtitle.textContent = theme.subtitle;
    ui.themeButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.theme === key);
    });
    updateTypeDom();
    syncCustomNameControls();
    syncPredictionButtons();
    updateHud();
    updateSetupSummaries();
    draw();
  }


  function currentRoundCounts() {
    return state.baseCounts.map((count, type) => Math.max(3, count - state.penalties[type]));
  }

  function readSetup() {
    let r = sanitizeCount(ui.inputs.rock.value);
    let s = sanitizeCount(ui.inputs.scissors.value);
    let p = sanitizeCount(ui.inputs.paper.value);
    if (ui.inputs.syncCounts.checked) {
      s = r;
      p = r;
    }
    const duration = clamp(parseInt(ui.inputs.duration.value, 10) || 60, 10, 300);
    const stakeMax = Math.max(0, state.bank);
    const stake = clamp(parseInt(ui.inputs.stake.value, 10) || 0, 0, stakeMax);
    ui.inputs.rock.value = r;
    ui.inputs.scissors.value = s;
    ui.inputs.paper.value = p;
    ui.inputs.duration.value = duration;
    ui.inputs.stake.value = stake;
    state.baseCounts = [r, s, p];
    state.roundLimit = duration * 1000;
    state.stake = stake;
    state.winnerPenalty = clamp(parseInt(ui.inputs.penalty.value, 10) || 0, 0, 20);
    ui.inputs.penalty.value = state.winnerPenalty;
    state.options.betting = ui.inputs.betting.checked;
    state.options.tournament = ui.inputs.tournament.checked;
    state.options.deathmatch = ui.inputs.deathmatch.checked;
    state.options.zones = ui.inputs.zones.checked;
    state.options.godHand = ui.inputs.godHand.checked;
    state.bestOf = state.options.tournament
      ? parseInt(document.querySelector("#match-length button.active").dataset.bestOf, 10)
      : 1;
    state.options.obstacles = ui.inputs.obstacles.checked;
    state.options.shrink = ui.inputs.shrink.checked;
    state.options.bounty = ui.inputs.bounty.checked;
    state.options.traitor = ui.inputs.traitor.checked;
    state.options.blackHole = ui.inputs.blackHole.checked;
    state.options.powerups = ui.inputs.powerups.checked;
    state.options.tenFight = ui.inputs.tenFight.checked;
    state.options.lastStand = ui.inputs.lastStand.checked;
    state.options.thanos = ui.inputs.thanos.checked;
    state.settings.notifications = ui.inputs.notifications.checked;
    syncNotificationControls();
    updateOptionVisibility();
  }

  function calculateOdds(counts) {
    const total = counts.reduce((sum, count) => sum + count, 0);
    return counts.map((count, type) => {
      const prey = counts[preyType(type)];
      const predator = counts[predatorType(type)];
      const strength = Math.max(1.2, count + prey * 0.3 - predator * 0.18);
      return clamp((total / strength) * 0.72, 1.18, 4.8);
    });
  }

  function updateOddsFromInputs() {
    const counts = [
      sanitizeCount(ui.inputs.rock.value),
      sanitizeCount(ui.inputs.scissors.value),
      sanitizeCount(ui.inputs.paper.value),
    ];
    state.odds = calculateOdds(counts);
    updateOddsLabels(ui.odds, state.odds);
  }

  function updateOddsLabels(target, odds) {
    for (let i = 0; i < 3; i += 1) {
      target[i].textContent = `x${odds[i].toFixed(2)}`;
    }
  }

  function syncCountInput(source) {
    const value = sanitizeCount(source.value);
    if (ui.inputs.syncCounts.checked) {
      countInputs().forEach((input) => {
        input.value = String(value);
      });
    } else {
      source.value = String(value);
    }
    updateOddsFromInputs();
    updateSetupSummaries();
  }

  function stepCountInput(input, step) {
    if (!input) return;
    const min = parseInt(input.min, 10) || 3;
    const max = parseInt(input.max, 10) || 60;
    const current = clamp(parseInt(input.value, 10) || 10, min, max);
    input.value = String(clamp(current + step, min, max));
    syncCountInput(input);
  }

  function gameplayInputs() {
    return GAMEPLAY_OPTION_KEYS
      .map((key) => ui.inputs[key])
      .filter(Boolean);
  }

  const setupSummaryController = createSetupSummaryController({
    state,
    ui,
    TYPE_INFO,
    clamp,
    sanitizeCount,
  });
  const {
    updateSetupSummaries,
    enabledOptionLabels,
    renderIntroSummary,
  } = setupSummaryController;

  const presetController = createPresetController({
    ui,
    PRESETS,
    gameplayInputs,
    countInputs,
    syncOptionsFromInputs: () => syncOptionsFromInputs(),
    updateOddsFromInputs: () => updateOddsFromInputs(),
  });
  const { applyPreset } = presetController;

  function updateOptionVisibility() {
    ui.bettingControls.classList.toggle("disabled", !ui.inputs.betting.checked);
    ui.tournamentControls.classList.toggle("disabled", !ui.inputs.tournament.checked);
    ui.bettingControls.querySelectorAll("button, input").forEach((control) => {
      control.disabled = !ui.inputs.betting.checked;
    });
    ui.tournamentControls.querySelectorAll("button, input").forEach((control) => {
      control.disabled = !ui.inputs.tournament.checked;
    });
    ui.inputs.duration.disabled = ui.inputs.deathmatch.checked;
    ui.nextBetPanel.classList.toggle("hidden", !state.options.betting);
    ui.canvas.classList.toggle("god-hand-on", state.options.godHand);
    ui.godHandToggle.classList.toggle("active", state.options.godHand);
    document.querySelectorAll(".field-tool").forEach((button) => {
      button.classList.toggle("hidden", !state.options.godHand);
    });
    ui.roundTotal.textContent = String(ui.inputs.tournament.checked ? state.bestOf : 1);
    if (ui.inputs.tournament.checked) {
      ui.matchScore.textContent = state.wins.join(" · ");
    } else if (ui.inputs.zones.checked) {
      ui.matchScore.textContent = `据点 ${state.zones.scores.map((score) => Math.floor(score)).join(" · ")}`;
    } else {
      ui.matchScore.textContent = "单局";
    }
    ui.timer.textContent = ui.inputs.deathmatch.checked
      ? "死斗"
      : `${(state.roundLimit / 1000).toFixed(1)}`;
    updateBank();
    updateSetupSummaries();
    requestAnimationFrame(syncHudMetrics);
  }

  function syncOptionsFromInputs() {
    state.options.betting = ui.inputs.betting.checked;
    state.options.tournament = ui.inputs.tournament.checked;
    state.options.deathmatch = ui.inputs.deathmatch.checked;
    state.options.zones = ui.inputs.zones.checked;
    state.options.godHand = ui.inputs.godHand.checked;
    state.options.obstacles = ui.inputs.obstacles.checked;
    state.options.shrink = ui.inputs.shrink.checked;
    state.options.bounty = ui.inputs.bounty.checked;
    state.options.traitor = ui.inputs.traitor.checked;
    state.options.blackHole = ui.inputs.blackHole.checked;
    state.options.powerups = ui.inputs.powerups.checked;
    state.options.tenFight = ui.inputs.tenFight.checked;
    state.options.lastStand = ui.inputs.lastStand.checked;
    state.options.thanos = ui.inputs.thanos.checked;
    state.roundLimit = clamp(parseInt(ui.inputs.duration.value, 10) || 60, 10, 300) * 1000;
    state.bestOf = state.options.tournament
      ? parseInt(document.querySelector("#match-length button.active").dataset.bestOf, 10)
      : 1;
    updateOptionVisibility();
  }

  function setVolume(kind, value) {
    const percent = clamp(parseInt(value, 10) || 0, 0, 100);
    const volume = percent / 100;
    if (kind === "bgm") {
      state.settings.bgmVolume = volume;
      audio.setBgmVolume(volume);
    } else {
      state.settings.sfxVolume = volume;
      audio.setSfxVolume(volume);
    }
    syncVolumeControls(kind, percent);
  }

  function syncVolumeControls(kind, percent) {
    const controls = kind === "bgm"
      ? [ui.inputs.bgmVolume, ui.inputs.liveBgmVolume]
      : [ui.inputs.sfxVolume, ui.inputs.liveSfxVolume];
    for (const control of controls) {
      control.value = String(percent);
    }
    document.querySelectorAll(`[data-volume-value="${kind}"]`).forEach((label) => {
      label.textContent = `${percent}%`;
    });
    updateSetupSummaries();
  }

  function setNotifications(enabled) {
    state.settings.notifications = Boolean(enabled);
    syncNotificationControls();
    if (!state.settings.notifications) {
      ui.eventFeed.replaceChildren();
      ui.eventFeed.classList.remove("has-events");
    }
    updateSetupSummaries();
  }

  function syncNotificationControls() {
    ui.inputs.notifications.checked = state.settings.notifications;
    ui.inputs.liveNotifications.checked = state.settings.notifications;
  }

  return {
    countInputs,
    sanitizeCount,
    customThemeLabel,
    updateTypeDom,
    syncCustomNameControls,
    applyCustomLabel,
    applyTheme,
    currentRoundCounts,
    readSetup,
    calculateOdds,
    updateOddsFromInputs,
    updateOddsLabels,
    syncCountInput,
    stepCountInput,
    gameplayInputs,
    applyPreset,
    updateSetupSummaries,
    updateOptionVisibility,
    syncOptionsFromInputs,
    setVolume,
    setNotifications,
    syncNotificationControls,
    enabledOptionLabels,
    renderIntroSummary,
  };
}
