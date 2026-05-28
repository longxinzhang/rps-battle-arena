export function createGameUpdater({
  state,
  updateTenFight,
  updateParticles,
  updateArenaShrink,
  updateBountyLeadership,
  maybeSpawnPowerUp,
  updatePendingTraitors,
  updateTraitorEvent,
  maybeSpawnBlackHole,
  updateThanosSnap,
  updateBlackHoles,
  updatePowerUps,
  updateEntities,
  resolveEntityCollisions,
  updateControlZones,
  updateLastStand,
  maybeTriggerTenFight,
}) {
  function update(now, dt) {
    updateTenFight(now);
    if (state.roundOver) {
      updateParticles(dt);
      return;
    }
    if (state.tenFight.pending) {
      updateParticles(dt);
      return;
    }

    updateArenaShrink(now, dt);
    updateBountyLeadership(now);
    maybeSpawnPowerUp(now);
    updatePendingTraitors(now);
    updateTraitorEvent(now);
    maybeSpawnBlackHole(now);
    updateThanosSnap(now);
    updateBlackHoles(now, dt);
    updatePowerUps(now, dt);
    updateEntities(now, dt);
    resolveEntityCollisions(now);
    state.entities = state.entities.filter((entity) => !entity.dead);
    updateControlZones(now, dt);
    updateLastStand(now);
    updateTenFight(now);
    if (state.roundOver) {
      updateParticles(dt);
      return;
    }
    maybeTriggerTenFight(now);
    updateParticles(dt);
  }

  return { update };
}
