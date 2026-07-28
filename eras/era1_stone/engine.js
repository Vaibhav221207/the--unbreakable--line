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
