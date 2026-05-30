import {
  BASE_SPEED,
  TEN_FIGHT_CHECK_INTERVAL,
  TEN_FIGHT_DURATION,
  TEN_FIGHT_FREEZE,
  TEN_FIGHT_RATIO,
  TEN_FIGHT_TRIGGER_CHANCE,
} from "../config/constants.js";
import { logEvent } from "../services/battleLog.js?v=0.2.7";

export function createTenFightFeature({
  state,
  ui,
  typeInfo,
  audio,
  clamp,
  rand,
  beats,
  countEntities,
  hasPendingRevives,
  aliveFactionMembers,
  emitBurst,
  addEvent,
  finishRound,
}) {
  function resetTenFightEvent(now) {
    hideTenFightUi();
    Object.assign(state.tenFight, {
      used: false,
      pending: false,
      active: false,
      minority: null,
      majority: null,
      checkAt: now + TEN_FIGHT_CHECK_INTERVAL,
      freezeUntil: 0,
      startAt: 0,
      endAt: 0,
      lastKillAt: 0,
    });
  }

  function hideTenFightUi() {
    window.clearTimeout(state.tenFight.overlayTimer);
    state.tenFight.overlayTimer = 0;
    ui.tenFightScreen.classList.add("hidden");
    hideTenFightBar();
  }

  function hideTenFightBar() {
    ui.tenFightBar.classList.add("hidden");
    ui.tenFightBarFill.style.transform = "scaleX(0)";
  }

  function showTenFightOverlay(title, subtext, hideAfter = 0) {
    window.clearTimeout(state.tenFight.overlayTimer);
    state.tenFight.overlayTimer = 0;
    ui.tenFightTitle.textContent = title;
    ui.tenFightSubtext.textContent = subtext;
    ui.tenFightScreen.classList.remove("hidden");
    if (hideAfter > 0) {
      state.tenFight.overlayTimer = window.setTimeout(() => {
        ui.tenFightScreen.classList.add("hidden");
        state.tenFight.overlayTimer = 0;
      }, hideAfter);
    }
  }

  function maybeTriggerTenFight(now) {
    const tenFight = state.tenFight;
    if (!state.options.tenFight || tenFight.used || tenFight.pending || tenFight.active || state.roundOver) return;
    if (hasPendingRevives() || now < tenFight.checkAt) return;
    tenFight.checkAt = now + TEN_FIGHT_CHECK_INTERVAL;

    const candidate = tenFightCandidate();
    if (!candidate || Math.random() >= TEN_FIGHT_TRIGGER_CHANCE) return;
    triggerTenFight(candidate, now);
  }

  function tenFightCandidate() {
    const counts = countEntities();
    const alive = counts
      .map((count, type) => ({ count, type }))
      .filter((item) => item.count > 0)
      .sort((a, b) => a.count - b.count);
    if (alive.length !== 2) return null;

    const [minority, majority] = alive;
    if (minority.count <= 0 || majority.count < minority.count * TEN_FIGHT_RATIO) return null;
    if (!beats(majority.type, minority.type)) return null;

    return {
      minority: minority.type,
      majority: majority.type,
      minorityCount: minority.count,
      majorityCount: majority.count,
    };
  }

  function triggerTenFight(candidate, now) {
    const tenFight = state.tenFight;
    const info = typeInfo[candidate.minority];
    Object.assign(tenFight, {
      used: true,
      pending: true,
      active: false,
      minority: candidate.minority,
      majority: candidate.majority,
      freezeUntil: now + TEN_FIGHT_FREEZE,
      startAt: 0,
      endAt: 0,
      lastKillAt: 0,
    });
    hideTenFightBar();
    showTenFightOverlay(
      `${info.emoji} 触发了「我要打十个」！`,
      `${candidate.minorityCount} 对 ${candidate.majorityCount}，克制关系即将反转`,
    );
    addEvent(`${info.emoji} 我要打十个触发`, "#f0b429");
    logEvent("event_trigger", {
      eventName: "我要打十个",
      detail: {
        heroType: candidate.minority,
        enemyType: candidate.majority,
        heroCount: candidate.minorityCount,
        enemyCount: candidate.majorityCount,
      },
    });
    audio.warningDengDeng();
  }

  function updateTenFight(now) {
    const tenFight = state.tenFight;
    if (tenFight.pending) {
      if (now >= tenFight.freezeUntil) {
        tenFight.pending = false;
        tenFight.active = true;
        tenFight.startAt = now;
        tenFight.endAt = now + TEN_FIGHT_DURATION;
        ui.tenFightScreen.classList.add("hidden");
        updateTenFightBar(TEN_FIGHT_DURATION);
      addEvent(`${typeInfo[tenFight.minority].emoji} 暴走反杀开始`, "#f0b429");
      audio.event();
      }
      return;
    }

    if (!tenFight.active) return;

    const counts = countEntities();
    if (counts[tenFight.minority] <= 0) {
      endTenFight(false);
      return;
    }
    if (counts[tenFight.majority] <= 0) {
      completeTenFightVictory();
      return;
    }

    const remaining = tenFight.endAt - now;
    updateTenFightBar(remaining);
    if (remaining <= 0) {
      endTenFight(false);
    }
  }

  function updateTenFightBar(remaining) {
    const safeRemaining = clamp(remaining, 0, TEN_FIGHT_DURATION);
    const progress = safeRemaining / TEN_FIGHT_DURATION;
    ui.tenFightBar.classList.remove("hidden");
    ui.tenFightBarFill.style.transform = `scaleX(${progress})`;
    ui.tenFightTime.textContent = `暴走 ${(safeRemaining / 1000).toFixed(1)}s`;
  }

  function endTenFight(announce) {
    state.tenFight.pending = false;
    state.tenFight.active = false;
    hideTenFightBar();
    if (announce === false) {
      addEvent("打十个结束，克制关系恢复", "#637067");
      logEvent("event_trigger", {
        eventName: "我要打十个_失败",
        detail: { heroType: state.tenFight.minority },
      });
      audio.event();
    }
  }

  function completeTenFightVictory() {
    const winnerType = state.tenFight.minority;
    state.tenFight.pending = false;
    state.tenFight.active = false;
    hideTenFightBar();
    showTenFightOverlay(
      "以弱胜强！",
      `${typeInfo[winnerType].emoji} ${typeInfo[winnerType].label}完成反杀`,
      1400,
    );
    const members = aliveFactionMembers(winnerType);
    const center = members.length
      ? members.reduce((point, entity) => ({
        x: point.x + entity.x / members.length,
        y: point.y + entity.y / members.length,
      }), { x: 0, y: 0 })
      : { x: state.W / 2, y: state.H / 2 };
    emitBurst(center.x, center.y, "#f0b429", 42, 5.2);
    addEvent("以弱胜强，反杀完成", "#f0b429");
    logEvent("event_trigger", {
      eventName: "我要打十个_成功",
      detail: { heroType: winnerType },
    });
    finishRound(winnerType, "ten-fight");
  }

  function isTenFightHero(entity) {
    return state.tenFight.active && !entity.dead && entity.type === state.tenFight.minority;
  }

  function tenFightPreyType(entity) {
    if (!state.tenFight.active) return (entity.type + 1) % 3;
    if (entity.type === state.tenFight.minority) return state.tenFight.majority;
    if (entity.type === state.tenFight.majority && ((entity.type + 1) % 3) === state.tenFight.minority) return null;
    return (entity.type + 1) % 3;
  }

  function tenFightPredatorType(entity) {
    if (!state.tenFight.active) return (entity.type + 2) % 3;
    if (entity.type === state.tenFight.minority) return null;
    if (entity.type === state.tenFight.majority) return state.tenFight.minority;
    return (entity.type + 2) % 3;
  }

  function handleTenFightCollision(a, b, nx, ny, now) {
    const tenFight = state.tenFight;
    if (!tenFight.active) return false;

    let hero = null;
    let target = null;
    if (a.type === tenFight.minority && b.type === tenFight.majority) {
      hero = a;
      target = b;
    } else if (b.type === tenFight.minority && a.type === tenFight.majority) {
      hero = b;
      target = a;
    } else {
      return false;
    }

    target.dead = true;
    logEvent("kill", {
      killerId: hero.id,
      victimId: target.id,
      killerType: hero.type,
      victimType: target.type,
    });
    hero.scale = Math.max(hero.scale, 1.28);
    hero.flash = 1;
    const dx = target.x - hero.x;
    const dy = target.y - hero.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    hero.vx -= (dx / dist) * BASE_SPEED * 0.28;
    hero.vy -= (dy / dist) * BASE_SPEED * 0.28;
    emitBurst(target.x, target.y, typeInfo[hero.type].color, 10, 3.2);
    emitBurst(target.x, target.y, "#f0b429", 7, 4);
    if (now - tenFight.lastKillAt > 650) {
      tenFight.lastKillAt = now;
      addEvent(`${typeInfo[hero.type].emoji} 暴走击杀`, "#f0b429");
    }
    audio.attack();
    return true;
  }

  return {
    resetTenFightEvent,
    hideTenFightUi,
    hideTenFightBar,
    maybeTriggerTenFight,
    updateTenFight,
    isTenFightHero,
    tenFightPreyType,
    tenFightPredatorType,
    handleTenFightCollision,
  };
}
