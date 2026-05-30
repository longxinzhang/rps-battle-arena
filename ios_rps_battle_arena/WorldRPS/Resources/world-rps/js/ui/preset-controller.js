export function createPresetController({
  ui,
  PRESETS,
  gameplayInputs,
  countInputs,
  syncOptionsFromInputs,
  updateOddsFromInputs,
}) {
  function presetCount() {
    return window.matchMedia("(max-width: 560px)").matches ? 7 : 30;
  }

  function setCounts(value) {
    ui.inputs.syncCounts.checked = true;
    countInputs().forEach((input) => {
      input.value = String(value);
    });
  }

  function setCheckbox(input, checked) {
    if (!input) return;
    input.checked = Boolean(checked);
  }

  function clearGameplayOptions() {
    gameplayInputs().forEach((input) => {
      setCheckbox(input, false);
    });
  }

  function applyPresetOptions(preset) {
    clearGameplayOptions();
    Object.entries(preset.options).forEach(([option, enabled]) => {
      setCheckbox(ui.inputs[option], enabled);
    });
  }

  function setSetupGroupExpanded(groupKey, expanded) {
    const group = document.querySelector(`[data-setup-group="${groupKey}"]`);
    if (!group) return;
    const toggle = group.querySelector(".setup-toggle");
    group.classList.toggle("expanded", expanded);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(expanded));
    }
  }

  function syncPresetGroups(preset) {
    const expandedGroups = new Set(preset.groups || []);
    document.querySelectorAll("[data-setup-group]").forEach((group) => {
      const groupKey = group.dataset.setupGroup;
      setSetupGroupExpanded(groupKey, expandedGroups.has(groupKey));
    });
  }

  function syncPresetButtonState(key) {
    ui.presetButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === key);
    });
  }

  function applyPreset(key) {
    const preset = PRESETS[key];
    if (!preset) return;
    setCounts(presetCount());
    applyPresetOptions(preset);
    syncPresetGroups(preset);
    syncPresetButtonState(key);
    syncOptionsFromInputs();
    updateOddsFromInputs();
  }

  return { applyPreset };
}
