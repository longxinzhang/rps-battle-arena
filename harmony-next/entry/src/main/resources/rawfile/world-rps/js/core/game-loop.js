export function createGameLoop({
  state,
  update,
  draw,
  updateAndCheckRound,
  updateHud,
}) {
  function loop(ts) {
    if (!state.running) return;
    if (!state.lastTs) state.lastTs = ts;
    const deltaMs = Math.min(34, Math.max(1, ts - state.lastTs));
    state.lastTs = ts;
    if (!state.paused) {
      update(ts, deltaMs / 16.6667);
      draw();
      const counts = updateAndCheckRound(ts);
      updateHud(counts);
    }
    state.animId = requestAnimationFrame(loop);
  }

  return { loop };
}
