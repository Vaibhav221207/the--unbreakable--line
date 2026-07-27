/**
 * Game — Flow controller, input handling, screen orchestration.
 * Coordinates data, puzzle engine, and UI.
 */
const Game = (() => {
  // ---- State ---- //
  let eraIndex = 0;
  let state = null;           // puzzle engine state
  let currentEra = null;      // shorthand for ERA_DATA[eraIndex]
  let touchSelected = null;   // touch-mode piece selection
  let automationTimers = [];  // cleanup

  const $ = id => document.getElementById(id);
  const app = document.getElementById("app");

  // ---- Screen Rendering ---- //
  function render(html) { app.innerHTML = html; }
  function append(html) { app.insertAdjacentHTML("beforeend", html); }
  function appendToBody(html) { document.body.insertAdjacentHTML("beforeend", html); }

  // ---- Module Shorthand ---- //
  const PE = PuzzleEngine;
  const ME = MatchingEngine;
  const BE = BalanceEngine;
  const UI = UIRenderer;

  // ---- Navigation Functions (exposed on window for inline onclick) ---- //

  function showNarrative() {
    render(UI.renderNarrative(currentEra));
  }

  function launchPuzzle() {
    if (currentEra.puzzleType === "matching") {
      launchConveyorPuzzle();
      return;
    }
    if (currentEra.puzzleType === "balance") {
      launchBalancePuzzle();
      return;
    }
    state = PE.createState(currentEra);
    render(UI.renderPuzzle(currentEra));
    UI.syncPicker(currentEra, state);
    UI.syncProgress(state);
    setupTouch();
  }

  function showAutomation() {
    const cel = $("celebration");
    if (cel) cel.remove();
    appendToBody(UI.renderAutomation(currentEra));
    if (currentEra.puzzleType === "matching") {
      UI.runMatchingAutomation(currentEra);
    } else if (currentEra.puzzleType === "balance") {
      UI.runBalanceAutomation(currentEra);
    } else {
      UI.runAutomationTimeline(currentEra);
    }
  }

  function finishEra() {
    const ap = $("auto-page");
    if (ap) ap.remove();
    const hasNext = eraIndex + 1 < ERA_DATA.length;
    render(UI.renderEndOfDemo(currentEra, hasNext));
  }

  // ---- Era 1: Sequencing Puzzle (click piece → click slot) ---- //

  function onPieceClick(pieceId) {
    if (!state || state.locked) return;
    const piece = PE.getPiece(currentEra, pieceId);
    if (!piece || state.placed.has(pieceId)) return;

    state.selected = (state.selected === pieceId) ? null : pieceId;
    if (state.selected) {
      UI.showHint(`Selected ${piece.label}. Now tap a slot.`);
    } else {
      UI.clearHint();
    }
    UI.syncPicker(currentEra, state);
  }

  function onSlotClick(slotId) {
    if (!state || state.locked) return;
    if (!state.selected) {
      UI.shakeSlot(slotId);
      UI.showHint(currentEra.hints.noPick);
      return;
    }
    attemptPlacement(state.selected, slotId);
  }

  function attemptPlacement(pieceId, slotId) {
    const validation = PE.validate(currentEra, state, pieceId, slotId);
    if (!validation.ok) {
      UI.shakeSlot(slotId);
      UI.showHint(currentEra.hints[validation.reason] || "Can't place that.");
      state.selected = null;
      UI.syncPicker(currentEra, state);
      return;
    }
    const piece = PE.getPiece(currentEra, pieceId);
    PE.commit(state, pieceId);
    UI.fillSlot(slotId, piece.icon, piece.id);
    UI.syncPicker(currentEra, state);
    UI.syncProgress(state);
    UI.clearHint();
    if (PE.isComplete(state)) {
      setTimeout(() => appendToBody(UI.renderCelebration(currentEra)), 400);
    }
  }

  // ---- Era 2+: Conveyor Belt Puzzle (drag from belt to bin) ---- //

  function launchConveyorPuzzle() {
    state = ME.createState(currentEra);
    render(UI.renderConveyorPuzzle(currentEra));
    UI.showHint("⬅️ Watch the belt — grab the right material, drop it on its bin!");
    UI.startConveyorBelt(currentEra, state, {
      onDrop: handleBeltDrop
    });
  }

  function handleBeltDrop(materialId, scenarioId) {
    const validation = ME.validate(currentEra, state, materialId, scenarioId);
    if (!validation.ok) {
      if (validation.reason === "wrongMatch") {
        UI.shakeBin(scenarioId);
        UI.showHint(validation.hint + " Try again!");
      } else if (validation.reason === "alreadyDone") {
        UI.shakeBin(scenarioId);
        UI.showHint("That bin is already filled!");
      } else {
        UI.shakeBin(scenarioId);
        UI.showHint("That doesn't work here.");
      }
      return;
    }
    const mat = currentEra.materials.find(m => m.id === materialId);
    ME.commit(state, materialId, scenarioId);
    UI.fillBin(scenarioId, mat ? mat.label : materialId);
    UI.showHint(`✅ ${mat ? mat.label : materialId} placed in ${scenarioId}!`);

    if (ME.isComplete(state)) {
      UI.stopConveyorBelt();
      setTimeout(() => appendToBody(UI.renderCelebration(currentEra)), 600);
    }
  }

  // ---- Era 3: Balance Puzzle (lever/slider controls) ---- //

  function launchBalancePuzzle() {
    state = BE.createState(currentEra);
    render(UI.renderBalancePuzzle(currentEra));
    UI.showHint("⬅️ Adjust the levers to balance the crane");
    UI.startBalanceGame(currentEra, state, {
      onComplete: handleBalanceComplete
    });
  }

  function handleBalanceComplete() {
    UI.stopBalanceGame();
    UI.showHint("✅ All lifts balanced!");
    setTimeout(() => appendToBody(UI.renderCelebration(currentEra)), 500);
  }

  // ---- Touch Support (Era 1) ---- //

  function setupTouch() {
    document.querySelector(".picker-grid")?.addEventListener("touchstart", e => {
      const btn = e.target.closest(".pick-btn");
      if (btn && !btn.classList.contains("placed")) {
        const pid = btn.id.replace("pick-", "");
        document.querySelectorAll(".pick-btn.touch-sel").forEach(b => b.classList.remove("touch-sel"));
        btn.classList.add("touch-sel");
        touchSelected = pid;
        UI.showHint("Tap a slot to place the stone.");
      }
    }, { passive: true });

    document.querySelector(".arch-stage")?.addEventListener("touchstart", e => {
      const slot = e.target.closest(".stone-slot");
      if (slot && touchSelected && !slot.classList.contains("filled")) {
        e.preventDefault();
        attemptPlacement(touchSelected, slot.id);
        touchSelected = null;
        document.querySelectorAll(".pick-btn.touch-sel").forEach(b => b.classList.remove("touch-sel"));
      }
    }, { passive: false });
  }

  // ---- Init, Next Era & Restart ---- //

  function showDevBar() {
    const existing = document.getElementById("dev-bar");
    if (existing) existing.remove();
    const bar = document.createElement("div");
    bar.id = "dev-bar";
    bar.innerHTML = ERA_DATA.map(e =>
      `<button class="dev-btn" data-era="${e.id}">${e.icon} ${e.id}</button>`
    ).join("") + `<button class="dev-btn dev-close" id="dev-close">✕</button>`;
    Object.assign(bar.style, {
      position: "fixed", bottom: "6px", left: "50%", transform: "translateX(-50%)",
      zIndex: "9999", display: "flex", gap: "4px", padding: "4px 8px",
      background: "rgba(0,0,0,0.7)", borderRadius: "6px",
      border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(4px)"
    });
    document.body.appendChild(bar);
    bar.querySelectorAll(".dev-btn:not(.dev-close)").forEach(btn => {
      btn.onclick = () => jumpToEra(parseInt(btn.dataset.era));
    });
    document.getElementById("dev-close").onclick = () => bar.remove();
  }

  function jumpToEra(idx) {
    const index = ERA_DATA.findIndex(e => e.id === idx);
    if (index < 0) return;
    eraIndex = index;
    currentEra = ERA_DATA[eraIndex];
    state = null;
    touchSelected = null;
    updateTheme();
    render(UI.renderIntro(currentEra));
  }

  function init() {
    eraIndex = 0;
    currentEra = ERA_DATA[eraIndex];
    state = null;
    updateTheme();
    render(UI.renderIntro(currentEra));
    showDevBar();
  }

  // ---- Theme switching ---- //
  function updateTheme() {
    document.body.classList.remove("era-stone", "era-industrial", "era-machine");
    if (currentEra && currentEra.id === 2) {
      document.body.classList.add("era-industrial");
    } else if (currentEra && currentEra.id === 3) {
      document.body.classList.add("era-machine");
    }
  }

  function nextEra() {
    if (eraIndex + 1 >= ERA_DATA.length) { restart(); return; }
    eraIndex++;
    currentEra = ERA_DATA[eraIndex];
    state = null;
    touchSelected = null;
    updateTheme();
    render(UI.renderIntro(currentEra));
  }

  function restart() {
    eraIndex = 0;
    currentEra = ERA_DATA[eraIndex];
    state = null;
    touchSelected = null;
    updateTheme();
    init();
  }

  // ---- Expose for inline onclick ---- //

  window.showNarrative = showNarrative;
  window.launchPuzzle = launchPuzzle;
  window.showAutomation = showAutomation;
  window.finishEra = finishEra;
  window.restart = restart;
  window.nextEra = nextEra;

  return {
    init, restart, nextEra,
    showNarrative, launchPuzzle, showAutomation, finishEra,
    onPieceClick, onSlotClick
  };
})();

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  console.log("[Game] Loading…");
  try { Game.init(); console.log("[Game] Ready"); }
  catch (e) {
    console.error("[Game] Init error:", e);
    document.getElementById("app").innerHTML =
      `<div style="color:#c8543c;padding:40px;text-align:center"><h2>⚠️ Error</h2><p>${e.message}</p></div>`;
  }
});