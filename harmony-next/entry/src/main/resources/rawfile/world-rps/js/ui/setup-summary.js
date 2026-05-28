export function createSetupSummaryController({
  state,
  ui,
  TYPE_INFO,
  clamp,
  sanitizeCount,
}) {
  function setupSummary(key, text) {
    const target = ui.setupSummaries.find((item) => item.dataset.setupSummary === key);
    if (target) target.textContent = text;
  }

  function selectedOptions(items, fallback = "默认") {
    const active = items
      .filter(([input]) => input.checked)
      .map(([, label]) => label);
    if (!active.length) return fallback;
    if (active.length <= 2) return active.join("、");
    return `${active.slice(0, 2).join("、")} +${active.length - 2}`;
  }

  function updateSetupSummaries() {
    const themeLabel = ui.themeButtons.find((button) => button.classList.contains("active"))?.textContent.trim() || "RPS";
    const counts = [
      sanitizeCount(ui.inputs.rock.value),
      sanitizeCount(ui.inputs.scissors.value),
      sanitizeCount(ui.inputs.paper.value),
    ];
    const duration = ui.inputs.deathmatch.checked
      ? "死斗"
      : `${clamp(parseInt(ui.inputs.duration.value, 10) || 60, 10, 300)}秒`;
    setupSummary("lineup", `${themeLabel} · ${counts.join("/")} · ${duration}`);
    setupSummary(
      "settings",
      `BGM ${Math.round(state.settings.bgmVolume * 100)}% · 音效 ${Math.round(state.settings.sfxVolume * 100)}% · 通知${state.settings.notifications ? "开" : "关"}`,
    );
    setupSummary("mechanics", selectedOptions([
      [ui.inputs.godHand, "上帝之手"],
      [ui.inputs.obstacles, "障碍"],
      [ui.inputs.shrink, "缩圈"],
      [ui.inputs.bounty, "悬赏"],
    ]));
    setupSummary("events", selectedOptions([
      [ui.inputs.traitor, "叛徒"],
      [ui.inputs.blackHole, "黑洞"],
      [ui.inputs.powerups, "道具"],
      [ui.inputs.tenFight, "打十个"],
      [ui.inputs.lastStand, "绝地"],
      [ui.inputs.thanos, "响指"],
    ]));
    setupSummary("format", selectedOptions([
      [ui.inputs.tournament, "多局"],
      [ui.inputs.deathmatch, "死斗"],
      [ui.inputs.zones, "据点"],
    ], "单局"));
    setupSummary("betting", ui.inputs.betting.checked
      ? `已开 · ${clamp(parseInt(ui.inputs.stake.value, 10) || 0, 0, 1000)}`
      : "未开");
  }

  function enabledOptionLabels() {
    return [
      [state.options.godHand, "上帝之手"],
      [state.options.obstacles, "地形障碍"],
      [state.options.shrink, "缩圈"],
      [state.options.bounty, "悬赏头名"],
      [state.options.traitor, "我们中出了个叛徒"],
      [state.options.blackHole, "黑洞"],
      [state.options.powerups, "能量道具"],
      [state.options.tenFight, "我要打十个"],
      [state.options.lastStand, "绝地求生"],
      [state.options.thanos, "灭霸响指"],
      [state.options.zones, "据点争夺"],
      [state.options.tournament, `多局 ${state.bestOf}局`],
      [state.options.betting, `竞猜 ${state.stake}`],
    ]
      .filter(([enabled]) => enabled)
      .map(([, label]) => label);
  }

  function renderIntroSummary() {
    const countText = state.baseCounts
      .map((count, type) => `${TYPE_INFO[type].emoji}${count}`)
      .join(" ");
    const durationText = state.options.deathmatch
      ? "死斗模式"
      : `${Math.round(state.roundLimit / 1000)}秒`;
    const items = [
      `阵容 ${countText}`,
      durationText,
      `支持 ${TYPE_INFO[state.prediction].emoji}${TYPE_INFO[state.prediction].label}`,
      ...enabledOptionLabels(),
    ];
    ui.introSummary.replaceChildren(...items.map((text) => {
      const chip = document.createElement("span");
      chip.textContent = text;
      return chip;
    }));
  }

  return {
    updateSetupSummaries,
    enabledOptionLabels,
    renderIntroSummary,
  };
}
