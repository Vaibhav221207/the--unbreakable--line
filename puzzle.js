/**
 * PuzzleEngine — Pure puzzle logic.
 * No DOM dependencies. Testable in isolation.
 */

const PuzzleEngine = (() => {

  /** Create a fresh puzzle state for the given era. */
  function createState(era) {
    return {
      placed: new Set(),     // placed piece IDs
      selected: null,        // currently selected piece ID
      step: 0,               // correct placements so far
      total: era.pieces.length,
      wrong: 0,              // wrong attempts
      locked: false          // during transitions/automation
    };
  }

  /** Validate placing pieceId into slotId. Returns { ok, reason }. */
  function validate(era, state, pieceId, slotId) {
    if (state.locked) return { ok: false, reason: "locked" };
    if (!pieceId || !slotId) return { ok: false, reason: "noPick" };
    if (state.placed.has(pieceId)) return { ok: false, reason: "already" };

    const piece = era.pieces.find(p => p.id === pieceId);
    if (!piece) return { ok: false, reason: "noPick" };

    // Wrong slot for this piece?
    if (piece.slot !== slotId) return { ok: false, reason: "wrongSlot" };

    // Correct slot but wrong turn?
    if (pieceId !== era.order[state.step]) return { ok: false, reason: "wrongOrder" };

    return { ok: true };
  }

  /** Commit placement. Returns true if successful. */
  function commit(state, pieceId) {
    if (state.placed.has(pieceId)) return false;
    state.placed.add(pieceId);
    state.step++;
    state.selected = null;
    return true;
  }

  function isComplete(state) {
    return state.step >= state.total;
  }

  function getPiece(era, pieceId) {
    return era.pieces.find(p => p.id === pieceId) || null;
  }

  return { createState, validate, commit, isComplete, getPiece };
})();

window.PuzzleEngine = PuzzleEngine;

/**
 * MatchingEngine — Pure matching puzzle logic for Era 2.
 * Scenarios matched with materials in ANY order.
 */
const MatchingEngine = (() => {
  function createState(era) {
    return {
      matched: {},        // { scenarioId: materialId }
      selected: null,     // currently selected material ID
      complete: false
    };
  }

  function validate(era, state, materialId, scenarioId) {
    if (!materialId || !scenarioId) return { ok: false, reason: "noPick" };
    if (state.matched[scenarioId]) return { ok: false, reason: "alreadyDone" };
    const correct = era.correctMatches[scenarioId] === materialId;
    if (correct) return { ok: true };
    return { ok: false, reason: "wrongMatch", hint: era.wrongHints[materialId] };
  }

  function commit(state, materialId, scenarioId) {
    state.matched[scenarioId] = materialId;
    state.selected = null;
    state.complete = Object.keys(state.matched).length >= 3;
    return true;
  }

  function isComplete(state) {
    return state.complete;
  }

  function getMaterial(era, materialId) {
    return (era.materials || []).find(m => m.id === materialId) || null;
  }

  return { createState, validate, commit, isComplete, getMaterial };
})();

window.MatchingEngine = MatchingEngine;

/**
 * BalanceEngine — Balanced cantilever bridge puzzle logic for Era 3.
 * Two sliders control left/right arm extensions from a central pier.
 */
const BalanceEngine = (() => {
  function createState(era) {
    return {
      completed: new Set(),
      currentIdx: 0,
      complete: false,
      values: {} // { scenarioId: { left: val, right: val } }
    };
  }

  /** Calculate net torque: positive = tipping right, negative = tipping left. */
  function calcNetTorque(scenario, values) {
    const leftExt = values.left ?? 0;
    const rightExt = values.right ?? 0;
    const leftTorque = scenario.leftArm.load * leftExt;
    const rightTorque = scenario.rightArm.load * rightExt;
    return rightTorque - leftTorque;
  }

  /** Check whether current arm extensions achieve balance (within tolerance). */
  function isBalanced(scenario, values) {
    const leftExt = values.left ?? 0;
    const rightExt = values.right ?? 0;
    // Require at least one arm to have meaningful extension (prevents zero-torque false positive)
    if (leftExt < 2 && rightExt < 2) return false;
    const net = calcNetTorque(scenario, values);
    return Math.abs(net) <= scenario.tolerance + 1;
  }

  /** Get imbalance ratio (-1 to 1) for gauge display. */
  function getImbalance(scenario, values) {
    const net = calcNetTorque(scenario, values);
    const maxLeft = scenario.leftArm.load * scenario.leftArm.max;
    const maxRight = scenario.rightArm.load * scenario.rightArm.max;
    const maxTorque = Math.max(maxLeft, maxRight, 1);
    return Math.max(-1, Math.min(1, net / maxTorque));
  }

  function isComplete(state) {
    return state.complete;
  }

  return { createState, calcNetTorque, isBalanced, getImbalance, isComplete };
})();

window.BalanceEngine = BalanceEngine;

/**
 * BlueprintEngine — CAD-style simulation puzzle for Era 4.
 * Player selects parameters, runs simulation, gets targeted failure feedback.
 */
const BlueprintEngine = (() => {
  function createState(era) {
    return {
      currentIdx: 0,
      selections: {},   // { scenarioId: { foundation: "deep", bracing: "cross", ... } }
      completed: new Set(),
      complete: false
    };
  }

  function getSelections(state, scenarioId) {
    return state.selections[scenarioId] || {};
  }

  function getScenario(state, era) {
    return era.scenarios[state.currentIdx] || null;
  }

  function setParam(state, scenarioId, paramId, valueId) {
    if (state.completed.has(scenarioId)) return;
    if (!state.selections[scenarioId]) state.selections[scenarioId] = {};
    state.selections[scenarioId][paramId] = valueId;
  }

  /** Run simulation — checks ALL three params against the scenario's correct combo. */
  function runSimulation(era, state, scenarioId) {
    const scenario = era.scenarios.find(s => s.id === scenarioId);
    if (!scenario) return { ok: false, errors: [] };
    const sels = state.selections[scenarioId] || {};
    const errors = [];
    for (const param of era.params) {
      if (sels[param.id] !== scenario.correct[param.id]) {
        errors.push(param.id);
      }
    }
    if (errors.length === 0) {
      state.completed.add(scenarioId);
      // Auto-advance or mark complete
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

  return { createState, getScenario, getSelections, setParam, runSimulation, isComplete };
})();

window.BlueprintEngine = BlueprintEngine;

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
      for (const key of Object.keys(era.correctMixes)) {
        const mix = era.correctMixes[key];
        const hasA = c.ingredients.includes(mix.a);
        const hasB = c.ingredients.includes(mix.b);
        if (hasA && hasB) {
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