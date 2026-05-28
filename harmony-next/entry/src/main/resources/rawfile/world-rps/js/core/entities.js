export function createEntityQueries(state) {
  function countEntities() {
    const counts = [0, 0, 0];
    for (const entity of state.entities) {
      if (!entity.dead) counts[entity.type] += 1;
    }
    return counts;
  }

  function factionSnapshot() {
    const counts = [0, 0, 0];
    const positions = [null, null, null];
    for (const entity of state.entities) {
      if (entity.dead) continue;
      counts[entity.type] += 1;
      positions[entity.type] = { x: entity.x, y: entity.y };
    }
    return { counts, positions };
  }

  return {
    countEntities,
    factionSnapshot,
  };
}
