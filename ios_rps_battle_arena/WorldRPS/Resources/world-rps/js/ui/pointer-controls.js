export function bindPointerControls({
  canvas,
  state,
  ui,
  audio,
}) {
  function pointerPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function movePointer(event, active) {
    const point = pointerPoint(event);
    const pointer = state.pointer;
    const oldX = pointer.x;
    const oldY = pointer.y;
    pointer.vx = point.x - oldX;
    pointer.vy = point.y - oldY;
    pointer.px = oldX;
    pointer.py = oldY;
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.active = active;
    pointer.lastMove = performance.now();
  }

  canvas.addEventListener("pointerdown", async (event) => {
    if (!state.running || state.roundOver || !state.options.godHand) return;
    await audio.init();
    canvas.setPointerCapture(event.pointerId);
    const point = pointerPoint(event);
    state.pointer.x = point.x;
    state.pointer.y = point.y;
    state.pointer.px = point.x;
    state.pointer.py = point.y;
    state.pointer.vx = 0;
    state.pointer.vy = 0;
    state.pointer.active = true;
    state.pointer.lastMove = performance.now();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.running || state.roundOver || !state.options.godHand) return;
    movePointer(event, true);
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!state.running || state.roundOver || !state.options.godHand) return;
    movePointer(event, false);
    state.pointer.active = false;
  });

  canvas.addEventListener("pointercancel", () => {
    state.pointer.active = false;
  });

  document.querySelectorAll("[data-field-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pointer.mode = button.dataset.fieldMode;
      ui.pushTool.classList.toggle("active", state.pointer.mode === "push");
      ui.pullTool.classList.toggle("active", state.pointer.mode === "pull");
    });
  });
}
