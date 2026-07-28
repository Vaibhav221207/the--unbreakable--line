const BoundaryEngine = (() => {
  function createState() {
    return { screen: 0, selected: [] };
  }

  function togglePriority(state, id) {
    const idx = state.selected.indexOf(id);
    if (idx >= 0) {
      state.selected.splice(idx, 1);
      return { ok: true };
    }
    if (state.selected.length >= 2) {
      return { ok: false, reason: "max" };
    }
    state.selected.push(id);
    return { ok: true };
  }

  function getReflection(era, selected) {
    if (selected.length !== 2) return null;
    const key = [...selected].sort().join("+");
    return era.reflections[key] || null;
  }

  function advanceScreen(state) {
    state.screen++;
    return state.screen;
  }

  return { createState, togglePriority, getReflection, advanceScreen };
})();
window.BoundaryEngine = BoundaryEngine;
