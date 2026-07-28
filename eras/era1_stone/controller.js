Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);

  function attemptPlacement(pieceId, slotId) {
    if (!Game.state || Game.state.locked) return;
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

  function setupTouch() {
    window.PickNPlace.setup({
      pickerContainer: '.picker-grid',
      pickerItemSelector: '.pick-btn',
      dropZoneSelector: '.arch-stage',
      getItemId: el => el.id.replace('pick-', ''),
      getSlotId: el => el.dataset.pnpSlot || el.dataset.slot,
      getIcon: el => {
        const id = el.id.replace('pick-', '');
        const piece = Game.currentEra.pieces.find(p => p.id === id);
        return piece ? piece.icon : '🪨';
      },
      onSelect(id) {
        if (!Game.state || Game.state.locked) return;
        const piece = window.PuzzleEngine.getPiece(Game.currentEra, id);
        if (!piece || Game.state.placed.has(id)) return;
        if (Game.state.selected === id) {
          Game.state.selected = null;
          window.UIRenderer.clearHint();
        } else {
          Game.state.selected = id;
          window.UIRenderer.showHint(`Selected ${piece.label}. Now tap a slot.`);
        }
        window.UIRenderer.syncPicker(Game.currentEra, Game.state);
      },
      onPlace(id, slotId) {
        attemptPlacement(id, slotId);
      }
    });
  }
      },
      onTap(id) {
        if (Game.state && Game.state.selected === id) {
          Game.state.selected = null;
          window.UIRenderer.clearHint();
          window.UIRenderer.syncPicker(Game.currentEra, Game.state);
        }
      }
    });
  }

  return {
    onPieceClick, onSlotClick, attemptPlacement, setupTouch
  };
})());
