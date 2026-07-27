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