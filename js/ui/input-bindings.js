export function bindInputControls({
  state,
  ui,
  audio,
  startTournament,
  beginTournament,
  showStartScreen,
  setPrediction,
  applyTheme,
  applyCustomLabel,
  applyPreset,
  countInputs,
  stepCountInput,
  syncCountInput,
  customThemeLabel,
  updateSetupSummaries,
  syncOptionsFromInputs,
  updateOddsFromInputs,
  setVolume,
  setNotifications,
  gameplayInputs,
  updateOptionVisibility,
  addEvent,
  resize,
}) {
  document.querySelectorAll(".setup-toggle").forEach((button) => {
    const group = button.closest(".setup-group");
    button.addEventListener("click", () => {
      const expanded = !group.classList.contains("expanded");
      group.classList.toggle("expanded", expanded);
      button.setAttribute("aria-expanded", String(expanded));
    });
  });

  ui.soundToggle.addEventListener("click", async () => {
    audio.enabled = !audio.enabled;
    ui.soundToggle.textContent = audio.enabled ? "🔊" : "🔇";
    if (audio.enabled) {
      await audio.init();
      if (state.running && !state.roundOver && !state.paused) {
        audio.startBgm();
      }
    } else {
      audio.pauseBgm();
    }
  });

  ui.settingsToggle.addEventListener("click", () => {
    ui.settingsPanel.classList.toggle("hidden");
  });

  ui.settingsClose.addEventListener("click", () => {
    ui.settingsPanel.classList.add("hidden");
  });

  ui.godHandToggle.addEventListener("click", () => {
    const enabled = !state.options.godHand;
    state.options.godHand = enabled;
    ui.inputs.godHand.checked = enabled;
    updateOptionVisibility();
    addEvent(enabled ? "上帝之手已开启" : "上帝之手已关闭", enabled ? "#20a4f3" : "#637067");
  });

  ui.pauseToggle.addEventListener("click", () => {
    if (!state.running || state.roundOver) return;
    state.paused = !state.paused;
    ui.pauseToggle.textContent = state.paused ? "继续" : "暂停";
    ui.homeBtn.classList.toggle("hidden", !state.paused);
    if (state.paused) {
      audio.pauseBgm();
    } else {
      audio.startBgm();
    }
  });

  ui.startBtn.addEventListener("click", startTournament);
  ui.introSkipBtn.addEventListener("click", beginTournament);
  ui.homeBtn.addEventListener("click", showStartScreen);
  ui.restartBtn.addEventListener("click", showStartScreen);

  document.querySelectorAll("[data-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      setPrediction(parseInt(button.dataset.pick, 10));
    });
  });

  document.querySelectorAll("[data-intro-pick]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-intro-pick]").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      setPrediction(parseInt(button.dataset.introPick, 10));
    });
  });

  document.querySelectorAll("#match-length button").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("#match-length button").forEach((item) => {
        item.classList.toggle("active", item === button);
      });
      state.bestOf = parseInt(button.dataset.bestOf, 10);
      syncOptionsFromInputs();
    });
  });

  ui.themeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyTheme(button.dataset.theme);
    });
  });

  ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyPreset(button.dataset.preset);
    });
  });

  ui.countStepButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const input = document.getElementById(button.dataset.countTarget);
      stepCountInput(input, parseInt(button.dataset.countStep, 10) || 0);
    });
  });

  countInputs().forEach((input) => {
    input.addEventListener("input", () => {
      syncCountInput(input);
    });
  });

  ui.inputs.syncCounts.addEventListener("change", () => {
    if (ui.inputs.syncCounts.checked) {
      syncCountInput(ui.inputs.rock);
    } else {
      updateSetupSummaries();
    }
  });

  ui.inputs.names.forEach((input, index) => {
    input.addEventListener("input", () => {
      applyCustomLabel(index, input.value);
    });
    input.addEventListener("blur", () => {
      input.value = customThemeLabel(state.theme, index);
    });
  });

  [
    ui.inputs.duration,
    ui.inputs.stake,
    ui.inputs.penalty,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      syncOptionsFromInputs();
      updateOddsFromInputs();
    });
  });

  [
    [ui.inputs.bgmVolume, "bgm"],
    [ui.inputs.liveBgmVolume, "bgm"],
    [ui.inputs.sfxVolume, "sfx"],
    [ui.inputs.liveSfxVolume, "sfx"],
  ].forEach(([input, kind]) => {
    input.addEventListener("input", () => {
      setVolume(kind, input.value);
    });
  });

  [ui.inputs.notifications, ui.inputs.liveNotifications].forEach((input) => {
    input.addEventListener("change", () => {
      setNotifications(input.checked);
    });
  });

  gameplayInputs().forEach((input) => {
    input.addEventListener("change", () => {
      syncOptionsFromInputs();
      updateOddsFromInputs();
    });
  });

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => window.setTimeout(resize, 80));
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", resize);
    window.visualViewport.addEventListener("scroll", resize);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.running) {
      state.paused = true;
      ui.pauseToggle.textContent = "继续";
      ui.homeBtn.classList.remove("hidden");
      audio.pauseBgm();
    }
  });
}
