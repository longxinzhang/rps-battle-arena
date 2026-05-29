const TYPE_META = [
  { emoji: "🪨", label: "石头", key: "rockCount", color: "#6B7280" },
  { emoji: "✂️", label: "剪刀", key: "scissorsCount", color: "#EF4444" },
  { emoji: "✋🏻", label: "布", key: "paperCount", color: "#3B82F6" },
];

export function generateReport(log) {
  const events = [...log].sort((a, b) => a.timestamp - b.timestamp);
  if (!events.length) {
    return {
      text: ["本局战报还没有生成。请先完成一局，再从结算界面打开战报。"],
      chartData: buildChartData([]),
      mvp: emptyMvp(),
    };
  }
  const start = events.find((event) => event.type === "game_start") || {};
  const end = events.find((event) => event.type === "game_end") || events[events.length - 1] || {};
  return {
    text: generateText(events, start, end),
    chartData: buildChartData(events),
    mvp: buildMvp(events, start, end),
  };
}

function emptyMvp() {
  return {
    conversionKing: null,
    survivor: {
      total: 0,
      type: null,
      typeCount: 0,
    },
    comeback: null,
  };
}

function generateText(events, start, end) {
  const sentences = [];
  const mechanics = start.mechanics?.length ? start.mechanics.join("、") : "基础规则";
  sentences.push(`本局 ${start.mode || "单局"}，🪨×${start.rockCount || 0} vs ✂️×${start.scissorsCount || 0} vs ✋🏻×${start.paperCount || 0}，${mechanics}。`);
  for (const event of turningPoints(events).slice(0, 5)) {
    sentences.push(eventSentence(event));
  }
  const winner = TYPE_META[end.winnerType] || null;
  if (winner) {
    const finalCount = countForType(end, end.winnerType);
    const opponentCount = TYPE_META
      .map((_, type) => type)
      .filter((type) => type !== end.winnerType)
      .reduce((sum, type) => sum + countForType(end, type), 0);
    const duration = end.duration ?? end.timestamp ?? 0;
    const isDeathmatch = end.mode === "死斗模式" || start.mode === "死斗模式";
    if (isDeathmatch || opponentCount === 0) {
      sentences.push(`最终 ${winner.emoji} 完成清场，耗时 ${duration} 秒。`);
    } else if (String(end.reason || "").startsWith("zones")) {
      sentences.push(`最终 ${winner.emoji} 凭据点判定获胜，场上还剩 ${finalCount} 个，耗时 ${duration} 秒。`);
    } else {
      sentences.push(`最终 ${winner.emoji} 以 ${finalCount} 人领先获胜，耗时 ${duration} 秒。`);
    }
  } else {
    sentences.push(`最终无人清场，耗时 ${end.duration ?? end.timestamp ?? 0} 秒。`);
  }
  return sentences.filter(Boolean);
}

function turningPoints(events) {
  const selected = [];
  for (const event of events) {
    if (event.type === "event_trigger" || event.type === "faction_eliminated") {
      selected.push(event);
    }
  }
  selected.push(...leadChanges(events));
  return selected.sort((a, b) => {
    const diff = a.timestamp - b.timestamp;
    if (diff !== 0) return diff;
    return priority(a) - priority(b);
  });
}

function priority(event) {
  if (event.type === "event_trigger") return 0;
  if (event.type === "faction_eliminated") return 1;
  return 2;
}

function leadChanges(events) {
  const changes = [];
  let lastLeader = null;
  for (const event of events.filter(hasCounts)) {
    const counts = [event.rockCount, event.scissorsCount, event.paperCount];
    const max = Math.max(...counts);
    const leaders = counts
      .map((count, type) => ({ count, type }))
      .filter((item) => item.count === max);
    if (leaders.length !== 1) continue;
    const leader = leaders[0].type;
    if (lastLeader !== null && leader !== lastLeader) {
      changes.push({ ...event, type: "lead_change", leaderType: leader, previousLeaderType: lastLeader });
    }
    lastLeader = leader;
  }
  return changes;
}

function eventSentence(event) {
  const time = `${event.timestamp.toFixed ? event.timestamp.toFixed(1) : event.timestamp} 秒`;
  if (event.type === "faction_eliminated") {
    const eliminated = TYPE_META[event.eliminatedType];
    return `${time}，${eliminated?.emoji || ""} 阵营归零，战场只剩 ${event.remainingTypes.map((type) => TYPE_META[type].emoji).join(" ")}。`;
  }
  if (event.type === "lead_change") {
    const leader = TYPE_META[event.leaderType];
    return `${time}，${leader?.emoji || ""} 完成人数反超，局势换边。`;
  }
  if (event.type !== "event_trigger") return "";
  const name = event.eventName;
  if (name === "我要打十个") {
    return `${time}，${TYPE_META[event.detail.heroType].emoji} 触发「我要打十个」，${event.detail.heroCount} 对 ${event.detail.enemyCount}。`;
  }
  if (name === "我要打十个_成功") return `${time}，${TYPE_META[event.detail.heroType].emoji} 以弱胜强完成反杀。`;
  if (name === "我要打十个_失败") return `${time}，${TYPE_META[event.detail.heroType].emoji} 暴走结束，克制关系恢复。`;
  if (name === "灭霸响指") return `${time}，灭霸响指落下，三方人数同时腰斩。`;
  if (name === "叛徒") return `${time}，#${event.detail.entityId} 从 ${TYPE_META[event.detail.fromType].emoji} 叛变为 ${TYPE_META[event.detail.toType].emoji}。`;
  if (name === "黑洞_生成") return `${time}，黑洞入场，开始拉扯附近单位。`;
  if (name === "黑洞_吞噬") return `${time}，黑洞吞掉 ${TYPE_META[event.detail.entityType].emoji} #${event.detail.entityId}。`;
  if (name === "绝地求生_分裂") return `${time}，${TYPE_META[event.detail.entityType].emoji} 触发绝地分裂。`;
  if (name === "绝地求生_复活") return `${time}，${TYPE_META[event.detail.factionType].emoji} 原地复活。`;
  if (name === "道具_拾取") return `${time}，#${event.detail.entityId} 抢到 ${event.detail.itemType} 道具。`;
  if (name === "缩圈") return `${time}，边界收缩到 ${event.detail.newBoundary}。`;
  if (name === "据点_占领") return `${time}，${TYPE_META[event.detail.factionType].emoji} 占领据点 ${event.detail.pointId}。`;
  return `${time}，${name} 触发。`;
}

function buildChartData(events) {
  const points = events
    .filter(hasCounts)
    .map((event) => ({
      t: event.timestamp,
      counts: [event.rockCount, event.scissorsCount, event.paperCount],
      event,
    }));
  const markers = events
    .filter((event) => (event.type === "event_trigger" || event.type === "faction_eliminated") && hasCounts(event))
    .map((event) => ({
      t: event.timestamp,
      label: markerLabel(event),
      type: event.type,
      counts: [event.rockCount, event.scissorsCount, event.paperCount],
    }));
  return {
    lines: TYPE_META.map((item, type) => ({ ...item, type })),
    points,
    markers,
  };
}

function buildMvp(events, start, end) {
  const impact = new Map();
  for (const event of events) {
    const actorId = event.winnerId ?? event.killerId;
    if (actorId === undefined) continue;
    const current = impact.get(actorId) || {
      id: actorId,
      type: event.winnerType ?? event.killerType,
      count: 0,
    };
    current.count += 1;
    current.type = event.winnerType ?? event.killerType ?? current.type;
    impact.set(actorId, current);
  }
  const conversionKing = [...impact.values()].sort((a, b) => b.count - a.count)[0] || null;
  const converted = new Set(events.filter((event) => event.type === "convert").map((event) => event.loserId));
  const initialEntities = start.initialEntities || [];
  const aliveIds = new Set((end.aliveEntities || []).map((entity) => entity.id));
  const survivors = initialEntities.filter((entity) => (
    !converted.has(entity.id)
    && (!end.aliveEntities || aliveIds.has(entity.id))
  ));
  const survivorCounts = [0, 0, 0];
  for (const entity of survivors) survivorCounts[entity.type] += 1;
  const maxSurvivorType = survivorCounts.indexOf(Math.max(...survivorCounts));
  const winnerType = end.winnerType;
  let comeback = null;
  if (winnerType !== null && winnerType !== undefined) {
    const winnerCounts = events.filter(hasCounts).map((event) => countForType(event, winnerType));
    const min = Math.min(...winnerCounts);
    const finalCount = countForType(end, winnerType);
    const startedAhead = countForType(start, winnerType) >= Math.max(start.rockCount || 0, start.scissorsCount || 0, start.paperCount || 0);
    if (!startedAhead && finalCount > min) {
      comeback = { type: winnerType, min, finalCount };
    }
  }
  return {
    conversionKing,
    survivor: {
      total: survivors.length,
      type: survivorCounts[maxSurvivorType] > 0 ? maxSurvivorType : null,
      typeCount: survivorCounts[maxSurvivorType] || 0,
    },
    comeback,
  };
}

function hasCounts(event) {
  return event.rockCount !== undefined
    && event.scissorsCount !== undefined
    && event.paperCount !== undefined;
}

function countForType(event, type) {
  return event?.[TYPE_META[type]?.key] || 0;
}

function markerLabel(event) {
  if (event.type === "faction_eliminated") {
    return `💀 ${TYPE_META[event.eliminatedType]?.emoji || ""}`;
  }
  if (event.eventName === "我要打十个") return "⚡ 打十个";
  if (event.eventName === "灭霸响指") return "🫰 响指";
  if (event.eventName === "黑洞_生成") return "● 黑洞";
  if (event.eventName === "叛徒") return "紫 叛徒";
  if (event.eventName === "缩圈") return "缩圈";
  return event.eventName || "事件";
}
