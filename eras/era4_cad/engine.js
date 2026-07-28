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
