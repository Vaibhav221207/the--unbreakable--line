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
