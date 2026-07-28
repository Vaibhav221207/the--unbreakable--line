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
