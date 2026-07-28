// ────────────────────────────────────────────────────────
//  PrintEngine — Material Synthesizer + 3D Printer (Era 5)
// ────────────────────────────────────────────────────────
const PrintEngine = (() => {
  function createState(era) {
    return {
      currentIdx: 0,
      chamber: {},   // { scenarioId: { ingredients: [], material: null, pattern: null } }
      completed: new Set(),
      complete: false
    };
  }

  function getScenario(state, era) {
    return era.scenarios[state.currentIdx] || null;
  }

  function getChamber(state, scenarioId) {
    if (!state.chamber[scenarioId]) {
      state.chamber[scenarioId] = { ingredients: [], material: null, pattern: null };
    }
    return state.chamber[scenarioId];
  }

  /** Add ingredient to chamber. Returns { ok, material } or { ok: false, reason }. */
  function addIngredient(era, state, scenarioId, ingredientId) {
    if (state.completed.has(scenarioId)) return { ok: false, reason: "locked" };
    const c = getChamber(state, scenarioId);
    if (c.ingredients.length >= 2) return { ok: false, reason: "full", current: c.ingredients };
    c.ingredients.push(ingredientId);
    // Check if pair matches a known mix
    if (c.ingredients.length === 2) {
      const scenario = era.scenarios.find(s => s.id === scenarioId);
      for (const key of Object.keys(era.correctMixes)) {
        const mix = era.correctMixes[key];
        const hasA = c.ingredients.includes(mix.a);
        const hasB = c.ingredients.includes(mix.b);
        if (hasA && hasB) {
          // Valid mix found — but does it match the current scenario?
          if (!scenario || key !== scenario.correct.ingredients) {
            c.material = null;
            return { ok: true, invalid: true, complete: false };
          }
          c.material = { id: key, ...mix };
          return { ok: true, material: c.material, complete: true };
        }
      }
      // Wrong pair
      c.material = null;
      return { ok: true, invalid: true, complete: false };
    }
    return { ok: true, complete: false };
  }

  /** Clear chamber (retry mixing). */
  function clearChamber(state, scenarioId) {
    if (!state.chamber[scenarioId]) return;
    state.chamber[scenarioId] = { ingredients: [], material: null, pattern: null };
  }

  /** Set the infill pattern. */
  function setPattern(state, scenarioId, patternId) {
    if (state.completed.has(scenarioId)) return;
    const c = getChamber(state, scenarioId);
    c.pattern = patternId;
  }

  /** Run the print — checks material AND pattern. */
  function runPrint(era, state, scenarioId) {
    const scenario = era.scenarios.find(s => s.id === scenarioId);
    if (!scenario) return { ok: false, errors: [] };
    const c = getChamber(state, scenarioId);
    const errors = [];

    // Check material
    const correctMatId = scenario.correct.ingredients;
    if (!c.material || c.material.id !== correctMatId) {
      errors.push("ingredients");
    }
    // Check pattern
    if (c.pattern !== scenario.correct.pattern) {
      errors.push("pattern");
    }

    if (errors.length === 0) {
      state.completed.add(scenarioId);
      if (state.completed.size >= era.scenarios.length) {
        state.complete = true;
      } else {
        state.currentIdx++;
      }
    }
    return { ok: errors.length === 0, errors };
  }

  function isComplete(state) {
    return state.complete;
  }

  return { createState, getScenario, getChamber, addIngredient, clearChamber, setPattern, runPrint, isComplete };
})();

window.PrintEngine = PrintEngine;
