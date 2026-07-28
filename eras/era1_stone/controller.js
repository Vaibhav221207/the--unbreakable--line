Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');

  function onPieceClick(pieceId) {
    if (!Game.state || Game.state.locked) return;
    const piece = window.PuzzleEngine.getPiece(Game.currentEra, pieceId);
    if (!piece || Game.state.placed.has(pieceId)) return;

    Game.state.selected = (Game.state.selected === pieceId) ? null : pieceId;
    if (Game.state.selected) {
      window.UIRenderer.showHint(`Selected ${piece.label}. Now tap a slot.`);
    } else {
      window.UIRenderer.clearHint();
    }
    window.UIRenderer.syncPicker(Game.currentEra, Game.state);
  }

  function onSlotClick(slotId) {
    if (!Game.state || Game.state.locked) return;
    if (!Game.state.selected) {
      window.UIRenderer.shakeSlot(slotId);
      window.UIRenderer.showHint(Game.currentEra.hints.noPick);
      return;
    }
    attemptPlacement(Game.state.selected, slotId);
  }

  function attemptPlacement(pieceId, slotId) {
    const validation = window.PuzzleEngine.validate(Game.currentEra, Game.state, pieceId, slotId);
    if (!validation.ok) {
      window.UIRenderer.shakeSlot(slotId);
      window.UIRenderer.showHint(Game.currentEra.hints[validation.reason] || "Can't place that.");
      Game.state.selected = null;
      window.UIRenderer.syncPicker(Game.currentEra, Game.state);
      return;
    }
    const piece = window.PuzzleEngine.getPiece(Game.currentEra, pieceId);
    window.PuzzleEngine.commit(Game.state, pieceId);
    window.UIRenderer.fillSlot(slotId, piece.icon, piece.id);
    window.UIRenderer.syncPicker(Game.currentEra, Game.state);
    window.UIRenderer.syncProgress(Game.state);
    window.UIRenderer.clearHint();
    if (window.PuzzleEngine.isComplete(Game.state)) {
      setTimeout(() => window.Game.appendToBody(window.UIRenderer.renderCelebration(Game.currentEra)), 400);
    }
  }

  function setupTouch() {
    document.querySelector(".picker-grid")?.addEventListener("touchstart", e => {
      const btn = e.target.closest(".pick-btn");
      if (btn && !btn.classList.contains("placed")) {
        const pid = btn.id.replace("pick-", "");
        document.querySelectorAll(".pick-btn.touch-sel").forEach(b => b.classList.remove("touch-sel"));
        btn.classList.add("touch-sel");
        Game.touchSelected = pid;
        window.UIRenderer.showHint("Tap a slot to place the stone.");
      }
    }, { passive: true });

    document.querySelector(".arch-stage")?.addEventListener("touchstart", e => {
      const slot = e.target.closest(".stone-slot");
      if (slot && Game.touchSelected && !slot.classList.contains("filled")) {
        e.preventDefault();
        attemptPlacement(Game.touchSelected, slot.id);
        Game.touchSelected = null;
        document.querySelectorAll(".pick-btn.touch-sel").forEach(b => b.classList.remove("touch-sel"));
      }
    }, { passive: false });
  }

  return {
    onPieceClick, onSlotClick, attemptPlacement, setupTouch
  };
})());
