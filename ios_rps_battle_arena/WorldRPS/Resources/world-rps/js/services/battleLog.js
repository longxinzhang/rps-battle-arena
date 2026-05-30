let stateRef = null;
let countEntitiesRef = null;
let battleLog = [];
let eliminatedTypes = new Set();

export function configureBattleLog({ state, countEntities }) {
  stateRef = state;
  countEntitiesRef = countEntities;
}

export function resetBattleLog() {
  battleLog = [];
  eliminatedTypes = new Set();
}

export function logEvent(type, data = {}) {
  const event = {
    type,
    timestamp: data.timestamp ?? elapsedSeconds(),
    ...data,
  };
  if (!hasCounts(event)) {
    Object.assign(event, currentCounts());
  }
  battleLog.push(event);
  return event;
}

export function getLog() {
  return battleLog.map((event) => ({
    ...event,
    detail: event.detail && typeof event.detail === "object" ? { ...event.detail } : event.detail,
  }));
}

export function logFactionEliminations(counts = countEntitiesRef?.() || [0, 0, 0]) {
  const remainingTypes = counts
    .map((count, type) => ({ count, type }))
    .filter((item) => item.count > 0)
    .map((item) => item.type);
  for (let type = 0; type < 3; type += 1) {
    if (counts[type] !== 0 || eliminatedTypes.has(type)) continue;
    eliminatedTypes.add(type);
    logEvent("faction_eliminated", {
      eliminatedType: type,
      remainingTypes,
      ...countsObject(counts),
    });
  }
}

export function currentCounts() {
  return countsObject(countEntitiesRef?.() || [0, 0, 0]);
}

function elapsedSeconds() {
  if (!stateRef?.roundStart) return 0;
  return Number(((performance.now() - stateRef.roundStart) / 1000).toFixed(1));
}

function countsObject(counts) {
  return {
    rockCount: counts[0] || 0,
    scissorsCount: counts[1] || 0,
    paperCount: counts[2] || 0,
  };
}

function hasCounts(event) {
  return event.rockCount !== undefined
    && event.scissorsCount !== undefined
    && event.paperCount !== undefined;
}
