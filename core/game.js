window.Game = {
  eraIndex: 0,
  state: null,
  currentEra: null,
  touchSelected: null,
  automationTimers: [],
  simRunning: false,
  draggedIngredient: null,
  tapSelectedIngredient: null
};

Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');

  function render(html) { app.innerHTML = html; }

  function append(html) { app.insertAdjacentHTML("beforeend", html); }

  function appendToBody(html) { document.body.insertAdjacentHTML("beforeend", html); }

  function showNarrative() {
    render(window.UIRenderer.renderNarrative(Game.currentEra));
  }

  function launchPuzzle() {
    if (Game.currentEra.puzzleType === "matching") {
      Game.launchConveyorPuzzle();
      return;
    }
    if (Game.currentEra.puzzleType === "balance") {
      Game.launchBalancePuzzle();
      return;
    }
    if (Game.currentEra.puzzleType === "blueprint") {
      Game.launchBlueprintPuzzle();
      return;
    }
    if (Game.currentEra.puzzleType === "print") {
      Game.launchPrintPuzzle();
      return;
    }
    if (Game.currentEra.puzzleType === "boundary") {
      Game.launchBoundaryPuzzle();
      return;
    }
    Game.state = window.PuzzleEngine.createState(Game.currentEra);
    render(window.UIRenderer.renderPuzzle(Game.currentEra));
    window.UIRenderer.syncPicker(Game.currentEra, Game.state);
    window.UIRenderer.syncProgress(Game.state);
    Game.setupTouch();
  }

  function showAutomation() {
    const cel = $("celebration");
    if (cel) cel.remove();
    appendToBody(window.UIRenderer.renderAutomation(Game.currentEra));
    if (Game.currentEra.puzzleType === "matching") {
      window.UIRenderer.runMatchingAutomation(Game.currentEra);
    } else if (Game.currentEra.puzzleType === "balance") {
      window.UIRenderer.runBalanceAutomation(Game.currentEra);
    } else if (Game.currentEra.puzzleType === "blueprint") {
      window.UIRenderer.runBlueprintAutomation(Game.currentEra);
    } else if (Game.currentEra.puzzleType === "print") {
      window.UIRenderer.runPrintAutomation(Game.currentEra);
    } else if (Game.currentEra.puzzleType === "boundary") {
      // Boundary era integrates automation into its flow
    } else {
      window.UIRenderer.runAutomationTimeline(Game.currentEra);
    }
  }

  function finishEra() {
    const ap = $("auto-page");
    if (ap) ap.remove();
    const hasNext = Game.eraIndex + 1 < ERA_DATA.length;
    render(window.UIRenderer.renderEndOfDemo(Game.currentEra, hasNext));
  }

  function init() {
    Game.eraIndex = 0;
    Game.currentEra = ERA_DATA[Game.eraIndex];
    Game.state = null;
    updateTheme();
    render(window.UIRenderer.renderIntro(Game.currentEra));
    showDevBar();
  }

  function updateTheme() {
    document.body.classList.remove("era-stone", "era-industrial", "era-machine", "era-cad", "era-robotics", "era-boundary");
    if (Game.currentEra && Game.currentEra.id === 2) {
      document.body.classList.add("era-industrial");
    } else if (Game.currentEra && Game.currentEra.id === 3) {
      document.body.classList.add("era-machine");
    } else if (Game.currentEra && Game.currentEra.id === 4) {
      document.body.classList.add("era-cad");
    } else if (Game.currentEra && Game.currentEra.id === 5) {
      document.body.classList.add("era-robotics");
    } else if (Game.currentEra && Game.currentEra.id === 6) {
      document.body.classList.add("era-boundary");
    }
  }

  function nextEra() {
    if (Game.eraIndex + 1 >= ERA_DATA.length) { restart(); return; }
    Game.eraIndex++;
    Game.currentEra = ERA_DATA[Game.eraIndex];
    Game.state = null;
    Game.touchSelected = null;
    updateTheme();
    render(window.UIRenderer.renderIntro(Game.currentEra));
  }

  function restart() {
    Game.eraIndex = 0;
    Game.currentEra = ERA_DATA[Game.eraIndex];
    Game.state = null;
    Game.touchSelected = null;
    updateTheme();
    init();
  }

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
    Game.eraIndex = index;
    Game.currentEra = ERA_DATA[Game.eraIndex];
    Game.state = null;
    Game.touchSelected = null;
    updateTheme();
    render(window.UIRenderer.renderIntro(Game.currentEra));
  }

  return {
    render, append, appendToBody, showNarrative, launchPuzzle, showAutomation, finishEra, init, updateTheme, nextEra, restart, showDevBar, jumpToEra
  };
})());
