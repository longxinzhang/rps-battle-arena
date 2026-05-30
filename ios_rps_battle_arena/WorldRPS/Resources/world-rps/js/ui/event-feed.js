export function createEventFeed({ state, ui }) {
  function addEvent(text, color) {
    if (!state.settings.notifications && state.running && !state.roundOver) return;
    const item = document.createElement("div");
    item.className = "event-item";
    item.innerHTML = `<span class="event-dot"></span><span></span>`;
    item.querySelector(".event-dot").style.background = color;
    item.querySelector("span:last-child").textContent = text;
    ui.eventFeed.prepend(item);
    ui.eventFeed.classList.add("has-events");
    while (ui.eventFeed.children.length > 2) {
      ui.eventFeed.lastElementChild.remove();
    }
    window.setTimeout(() => {
      item.classList.add("fading");
    }, 1700);
    window.setTimeout(() => {
      item.remove();
      if (!ui.eventFeed.children.length) {
        ui.eventFeed.classList.remove("has-events");
      }
    }, 2100);
  }

  return { addEvent };
}
