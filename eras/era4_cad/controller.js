Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');

  function launchBlueprintPuzzle() {
    Game.state = window.BlueprintEngine.createState(Game.currentEra);
    window.Game.render(window.UIRenderer.renderBlueprintPuzzle(Game.currentEra, Game.state));
    window.UIRenderer.showHint("⬅️ Set the three parameters, then click Run Simulation");
  }

  function onBlueprintParam(scenarioId, paramId, valueId) {
    window.BlueprintEngine.setParam(Game.state, scenarioId, paramId, valueId);
    // Update toggle visuals
    document.querySelectorAll(`.bp-toggle[data-param="${paramId}"]`).forEach(btn => {
      btn.classList.toggle("active", btn.dataset.value === valueId);
    });
    // Clear previous result when toggling
    const resultEl = $("bp-result");
    if (resultEl) resultEl.innerHTML = "";
    document.querySelectorAll(".bp-toggle-error").forEach(btn => btn.classList.remove("bp-toggle-error"));
    // Enable/disable run button based on whether all params are selected
    updateRunBtn();
  }

  function updateRunBtn() {
    if (Game.simRunning) return;
    const runBtn = $("bp-run-btn");
    const scenario = window.BlueprintEngine.getScenario(Game.state, Game.currentEra);
    if (!runBtn || !scenario) return;
    const sels = window.BlueprintEngine.getSelections(Game.state, scenario.id);
    const allSelected = Game.currentEra.params.every(p => sels[p.id]);
    runBtn.disabled = !allSelected;
  }

  function onBlueprintSimulate() {
    const scenario = window.BlueprintEngine.getScenario(Game.state, Game.currentEra);
    if (!scenario) return;

    const simArea = document.querySelector(".bp-sim-area");
    const runBtn = $("bp-run-btn");
    if (runBtn) runBtn.disabled = true;
    Game.simRunning = true;
    // Disable toggles during simulation
    document.querySelectorAll(".bp-toggle").forEach(t => t.style.pointerEvents = "none");

    const hazardIcon = scenario.id === "earthquake" ? "🌋" : "🌊";
    const result = window.BlueprintEngine.runSimulation(Game.currentEra, Game.state, scenario.id);

    const statusEl = $("bp-status-line") || (() => {
      const el = document.createElement("div");
      el.id = "bp-status-line";
      el.style.cssText = "text-align:center;font-size:.7rem;color:#80d0f0;margin:6px 0;font-family:'Courier New',monospace";
      const resultEl = $("bp-result");
      if (resultEl && resultEl.parentNode) resultEl.parentNode.insertBefore(el, resultEl);
      return el;
    })();

    if (scenario.id === "earthquake") {
      // ---- EARTHQUAKE: shake the building ---- //
      simArea.classList.add("bp-earthquake");
      statusEl.textContent = "⟐ SEISMIC TEST 🌋 — subjecting structure to simulated tremors…";

      const bld = $("bp-building");
      const floors = bld ? bld.querySelectorAll(".bp-floor") : [];
      let shakeCount = 0;
      const shakeInterval = setInterval(() => {
        if (shakeCount > 45) {
          clearInterval(shakeInterval);
          if (bld) bld.style.transform = "";
          floors.forEach(f => f.style.background = "");
          statusEl.textContent = "⟐ Analyzing seismic response data…";
          setTimeout(finishSimulation, 500);
          return;
        }
        const intensity = Math.max(1, 5 - Math.floor(shakeCount / 9));
        const offset = (shakeCount % 2 === 0 ? 1 : -1) * intensity;
        if (bld) bld.style.transform = `translateX(${offset}px)`;
        if (shakeCount % 4 === 0) {
          floors.forEach(f => f.style.background = `rgba(80,180,240,${0.03 + Math.random() * 0.2})`);
        }
        shakeCount++;
      }, 45);
    } else {
      // ---- FLOOD: water rises from bottom ---- //
      statusEl.textContent = "⟐ HYDRO TEST 🌊 — water level rising…";

      const structure = document.querySelector(".bp-structure");
      if (!structure) { finishSimulation(); return; }

      // Create water overlay
      const water = document.createElement("div");
      water.id = "bp-flood-water";
      water.style.cssText = "position:absolute;bottom:0;left:-60px;width:200px;height:0;background:linear-gradient(180deg,rgba(60,200,255,0.3),rgba(20,100,200,0.7));z-index:3;transition:none;";
      structure.appendChild(water);

      // Wave crest on top
      const wave = document.createElement("div");
      wave.style.cssText = "position:absolute;top:-6px;left:0;width:200px;height:12px;background:radial-gradient(ellipse at 20% 50%,rgba(80,220,255,0.4) 0%,transparent 60%),radial-gradient(ellipse at 70% 50%,rgba(80,220,255,0.3) 0%,transparent 50%);opacity:0;";
      water.appendChild(wave);

      // Building fades + sinks
      const bld = $("bp-building");
      const floors = bld ? bld.querySelectorAll(".bp-floor") : [];

      let step = 0;
      const totalSteps = 24;
      const floodInterval = setInterval(() => {
        step++;
        const progress = step / totalSteps;
        const eased = 1 - Math.pow(1 - progress, 2); // ease-out quad

        // Water rises: 0 -> 85px
        water.style.height = Math.round(eased * 85) + "px";
        wave.style.opacity = Math.min(1, eased * 2);

        // Wave slosh
        const waveX = Math.sin(step * 0.7) * 4;
        wave.style.transform = `translateX(${waveX}px) scaleY(${1 + Math.sin(step * 0.5) * 0.3})`;

        // Building sinks + fades
        if (bld) {
          bld.style.transform = `translateY(${Math.round(eased * 45)}px)`;
          bld.style.opacity = Math.max(0.2, 1 - eased * 0.8);
        }

        // Floors tint blue
        floors.forEach(f => {
          f.style.background = `rgba(60,180,240,${0.03 + eased * 0.3})`;
          f.style.borderColor = `rgba(60,180,240,${0.05 + eased * 0.25})`;
        });

        if (step >= totalSteps) {
          clearInterval(floodInterval);
          statusEl.textContent = "⟐ Evaluating flood damage assessment…";
          setTimeout(finishSimulation, 500);
        }
      }, 45);
    }

    function finishSimulation() {
      if (simArea) simArea.classList.remove("bp-earthquake");
      const fw = document.getElementById("bp-flood-water");
      if (fw && fw.parentNode) fw.parentNode.removeChild(fw);

      // Reset building position from flood animation
      const bld = $("bp-building");
      if (bld) {
        bld.style.transform = "";
        bld.style.opacity = "";
      }
      if (bld) {
        bld.querySelectorAll(".bp-floor").forEach(f => {
          f.style.background = "";
          f.style.borderColor = "";
        });
      }

      if (runBtn) runBtn.disabled = false;
      Game.simRunning = false;
      statusEl.textContent = "";

      if (result.ok) {
        const isLast = Game.state.completed.size >= Game.currentEra.scenarios.length;
        window.UIRenderer.showBlueprintSuccess(Game.currentEra, Game.state, scenario, isLast);
        if (isLast) {
          setTimeout(() => window.Game.appendToBody(window.UIRenderer.renderCelebration(Game.currentEra)), 400);
        }
      } else {
        window.UIRenderer.showBlueprintFailure(Game.currentEra, Game.state, scenario, result.errors);
      }
    }
  }

  function onBlueprintNext() {
    window.Game.render(window.UIRenderer.renderBlueprintPuzzle(Game.currentEra, Game.state));
    window.UIRenderer.showHint("⬅️ New hazard zone — adjust parameters and simulate again");
  }

  function onBlueprintRetry() {
    const resultEl = $("bp-result");
    const runBtn = $("bp-run-btn");
    if (resultEl) resultEl.innerHTML = "";
    if (runBtn) runBtn.style.display = "";
    // Remove retry overlay from sim area
    document.querySelectorAll(".bp-retry-overlay").forEach(el => el.remove());
    document.querySelectorAll(".bp-toggle-error").forEach(btn => btn.classList.remove("bp-toggle-error"));
    // Re-enable toggles
    document.querySelectorAll(".bp-toggle").forEach(t => t.style.pointerEvents = "");
    updateRunBtn();
  }

  return {
    launchBlueprintPuzzle, onBlueprintParam, updateRunBtn, onBlueprintSimulate, onBlueprintNext, onBlueprintRetry
  };
})());
