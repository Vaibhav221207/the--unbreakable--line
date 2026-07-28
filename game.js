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
  const BPE = BlueprintEngine;
  const PR = PrintEngine;
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
    if (currentEra.puzzleType === "blueprint") {
      launchBlueprintPuzzle();
      return;
    }
    if (currentEra.puzzleType === "print") {
      launchPrintPuzzle();
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
    } else if (currentEra.puzzleType === "blueprint") {
      UI.runBlueprintAutomation(currentEra);
    } else if (currentEra.puzzleType === "print") {
      UI.runPrintAutomation(currentEra);
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

  // ---- Era 4: Blueprint Simulator (toggle + simulation) ---- //

  function launchBlueprintPuzzle() {
    state = BPE.createState(currentEra);
    render(UI.renderBlueprintPuzzle(currentEra, state));
    UI.showHint("⬅️ Set the three parameters, then click Run Simulation");
  }

  function onBlueprintParam(scenarioId, paramId, valueId) {
    BPE.setParam(state, scenarioId, paramId, valueId);
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

  let simRunning = false;

  function updateRunBtn() {
    if (simRunning) return;
    const runBtn = $("bp-run-btn");
    const scenario = BPE.getScenario(state, currentEra);
    if (!runBtn || !scenario) return;
    const sels = BPE.getSelections(state, scenario.id);
    const allSelected = currentEra.params.every(p => sels[p.id]);
    runBtn.disabled = !allSelected;
  }

  function onBlueprintSimulate() {
    const scenario = BPE.getScenario(state, currentEra);
    if (!scenario) return;

    const simArea = document.querySelector(".bp-sim-area");
    const runBtn = $("bp-run-btn");
    if (runBtn) runBtn.disabled = true;
    simRunning = true;
    // Disable toggles during simulation
    document.querySelectorAll(".bp-toggle").forEach(t => t.style.pointerEvents = "none");

    const hazardIcon = scenario.id === "earthquake" ? "🌋" : "🌊";
    const result = BPE.runSimulation(currentEra, state, scenario.id);

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
      simRunning = false;
      // Re-enable toggles
      document.querySelectorAll(".bp-toggle").forEach(t => t.style.pointerEvents = "");
      statusEl.textContent = "";

      if (result.ok) {
        const isLast = state.completed.size >= currentEra.scenarios.length;
        UI.showBlueprintSuccess(currentEra, state, scenario, isLast);
        if (isLast) {
          setTimeout(() => appendToBody(UI.renderCelebration(currentEra)), 400);
        }
      } else {
        UI.showBlueprintFailure(currentEra, state, scenario, result.errors);
      }
    }
  }

  function onBlueprintNext() {
    render(UI.renderBlueprintPuzzle(currentEra, state));
    UI.showHint("⬅️ New hazard zone — adjust parameters and simulate again");
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

  // ================================================================
  //  PRINT PUZZLE — Material Synthesizer + 3D Printer (Era 5)
  // ================================================================

  let draggedIngredient = null;
  let tapSelectedIngredient = null;
  let pressureState = null;

  function cancelPressure() {
    if (pressureState) {
      pressureState.active = false;
      document.removeEventListener("pointerup", onPressureRelease);
      const gauge = $("pr-pressure-gauge");
      if (gauge) gauge.style.display = "none";
      pressureState = null;
    }
  }

  function onPressureRelease(e) {
    if (!pressureState || !pressureState.active) return;
    pressureState.active = false;
    document.removeEventListener("pointerup", onPressureRelease);

    const elapsed = Date.now() - pressureState.startTime;
    const pct = Math.min(100, (elapsed / pressureState.fillDuration) * 100);

    const gauge = $("pr-pressure-gauge");
    if (gauge) gauge.style.display = "none";

    if (pct >= 35 && pct <= 65) {
      const result = PR.addIngredient(currentEra, state, pressureState.scenarioId, pressureState.ingredientId);
      draggedIngredient = null;
      handleIngredientResult(pressureState.scenarioId, result);
    } else {
      draggedIngredient = null;
      const hint = $("pr-chamber-hint");
      if (hint) {
        hint.textContent = pct < 35
          ? "⚠️ Not enough pressure — bond too weak. Try holding longer."
          : "⚠️ Too much pressure — bond fractured. Try releasing sooner.";
      }
    }
    pressureState = null;
  }

  function showPressureGauge(scenarioId, ingredientId) {
    const gauge = $("pr-pressure-gauge");
    const fill = $("pr-pressure-fill");
    const readout = $("pr-pressure-readout");
    if (!gauge) return;

    pressureState = {
      ingredientId, scenarioId,
      startTime: Date.now(),
      fillDuration: 1800,
      active: true
    };

    gauge.style.display = "block";
    if (fill) fill.style.width = "0%";
    if (readout) readout.textContent = "0%";

    function updateFill() {
      if (!pressureState || !pressureState.active) return;
      const elapsed = Date.now() - pressureState.startTime;
      const pct = Math.min(100, (elapsed / pressureState.fillDuration) * 100);
      if (fill) fill.style.width = pct + "%";
      if (readout) readout.textContent = Math.round(pct) + "%";
      if (fill) {
        fill.style.background = (pct >= 35 && pct <= 65)
          ? "linear-gradient(90deg, #60d0b0, #80f0d0)"
          : "linear-gradient(90deg, rgba(100,220,200,0.2), rgba(100,220,200,0.8))";
      }
      if (pct < 100) requestAnimationFrame(updateFill);
    }
    requestAnimationFrame(updateFill);

    document.addEventListener("pointerup", onPressureRelease);
  }

  function handleIngredientResult(scenarioId, result) {
    if (!result.ok && result.reason === "full") {
      const hint = $("pr-chamber-hint");
      if (hint) hint.textContent = "Chamber is full — click it to clear and try again";
      return;
    }
    render(UI.renderPrintPuzzle(currentEra, state));
    const hint = $("pr-chamber-hint");
    if (result.ok && result.complete) {
      if (hint) hint.textContent = "";
      setTimeout(() => {
        const chamber = $("pr-chamber");
        if (chamber) chamber.classList.add("pr-chamber-success");
        const glow = $("pr-chamber-glow");
        if (glow) glow.style.opacity = "1";
        setTimeout(() => {
          if (glow) glow.style.opacity = "0";
          if (chamber) chamber.classList.remove("pr-chamber-success");
        }, 1200);
      }, 50);
    } else if (result.ok && result.invalid) {
      if (hint) hint.textContent = "⚠️ Those ingredients don't combine into a usable material. Try again.";
      const chamber = $("pr-chamber");
      if (chamber) chamber.classList.add("pr-chamber-spark");
      setTimeout(() => {
        PR.clearChamber(state, scenarioId);
        if (chamber) chamber.classList.remove("pr-chamber-spark");
        render(UI.renderPrintPuzzle(currentEra, state));
      }, 1200);
    }
  }

  function launchPrintPuzzle() {
    state = PR.createState(currentEra);
    render(UI.renderPrintPuzzle(currentEra, state));
  }

  function onPrintDragStart(event, ingredientId) {
    draggedIngredient = ingredientId;
    event.dataTransfer.effectAllowed = "copy";
    tapSelectedIngredient = null;
    document.querySelectorAll(".pr-ingredient").forEach(el => el.classList.remove("selected"));
    cancelPressure();
  }

  function onPrintDragEnd() {
    draggedIngredient = null;
  }

  function onPrintDrop(event, scenarioId) {
    event.preventDefault();
    if (!draggedIngredient) return;

    tapSelectedIngredient = null;
    document.querySelectorAll(".pr-ingredient").forEach(el => el.classList.remove("selected"));

    const c = PR.getChamber(state, scenarioId);
    if (c.ingredients.length >= 2) {
      const hint = $("pr-chamber-hint");
      if (hint) hint.textContent = "Chamber is full — click it to clear and try again";
      draggedIngredient = null;
      return;
    }
    showPressureGauge(scenarioId, draggedIngredient);
  }

  function onPrintIngredientTap(ingredientId) {
    draggedIngredient = null;
    cancelPressure();
    tapSelectedIngredient = (tapSelectedIngredient === ingredientId) ? null : ingredientId;
    document.querySelectorAll(".pr-ingredient").forEach(el => {
      el.classList.toggle("selected", el.dataset.id === tapSelectedIngredient);
    });
  }

  function onPrintChamberClick(scenarioId) {
    if (tapSelectedIngredient) {
      const ingId = tapSelectedIngredient;
      tapSelectedIngredient = null;
      document.querySelectorAll(".pr-ingredient").forEach(el => el.classList.remove("selected"));
      const result = PR.addIngredient(currentEra, state, scenarioId, ingId);
      handleIngredientResult(scenarioId, result);
      return;
    }
    const c = PR.getChamber(state, scenarioId);
    if (c.ingredients.length > 0 || c.material) {
      PR.clearChamber(state, scenarioId);
      render(UI.renderPrintPuzzle(currentEra, state));
      const hint = $("pr-chamber-hint");
      if (hint) hint.textContent = "";
    }
  }

  function onPrintToPattern() {
    const mix = $("pr-step-mix");
    const pat = $("pr-step-pattern");
    if (mix) mix.style.display = "none";
    if (pat) pat.style.display = "block";
    document.querySelectorAll(".pr-step-dot").forEach(d => {
      if (d.dataset.step === "1") d.classList.remove("active");
      if (d.dataset.step === "2") d.classList.add("active");
    });
  }

  function onPrintPattern(scenarioId, patternId) {
    PR.setPattern(state, scenarioId, patternId);
    render(UI.renderPrintPuzzle(currentEra, state));
    // Re-hide step 1, show step 2
    const mix = $("pr-step-mix");
    const pat = $("pr-step-pattern");
    if (mix) mix.style.display = "none";
    if (pat) pat.style.display = "block";
    document.querySelectorAll(".pr-step-dot").forEach(d => {
      if (d.dataset.step === "1") d.classList.remove("active");
      if (d.dataset.step === "2") d.classList.add("active");
    });
  }

  function onPrintToPrint() {
    const pat = $("pr-step-pattern");
    const pr = $("pr-step-print");
    if (pat) pat.style.display = "none";
    if (pr) pr.style.display = "block";
    document.querySelectorAll(".pr-step-dot").forEach(d => {
      if (d.dataset.step === "2") d.classList.remove("active");
      if (d.dataset.step === "3") d.classList.add("active");
    });
    // Ensure print button is visible
    const printBtn = $("pr-print-btn");
    if (printBtn) { printBtn.style.display = ""; printBtn.disabled = false; }
  }

  function onPrintBuild(scenarioId) {
    const printBtn = $("pr-print-btn");
    const statusEl = $("pr-print-status");
    const layers = document.querySelectorAll(".pr-layer");
    const head = $("pr-print-head");
    const filament = $("pr-print-filament");
    const tip = $("pr-print-tip");
    const bedPlate = $("pr-print-bed-plate");
    const headStartX = -40;

    const scenario = PR.getScenario(state, currentEra);
    if (!scenario) return;
    const ch = PR.getChamber(state, scenarioId);
    const matColor = ch.material ? ({
      lightweight_composite: "#60d0b0",
      flexible_polymer: "#c070e0",
      standard_concrete: "#90a0a0"
    }[ch.material.id] || "#70e0c0") : "#70e0c0";
    const patternId = ch.pattern;
    const patternIcon = patternId ? ({
      solid: "⬛", honeycomb: "⬡", organic: "🌀"
    }[patternId] || "") : "";

    if (printBtn) printBtn.style.display = "none";
    if (statusEl) statusEl.textContent = "Homing print head…";
    if (head) head.style.transition = "none";
    if (head) head.style.transform = `translateX(${headStartX}px)`;
    if (filament) filament.style.background = matColor;
    if (tip) tip.style.background = matColor;

    // Prepare layers: pattern-specific colors and effects
    layers.forEach(l => {
      l.style.setProperty("--mat-color", matColor);
      l.style.opacity = "0";
      l.style.transform = "";
      l.classList.remove("pr-layer-honeycomb", "pr-layer-organic");
      if (patternId === "honeycomb") l.classList.add("pr-layer-honeycomb");
      else if (patternId === "organic") l.classList.add("pr-layer-organic");
    });

    let layer = 0;
    const totalLayers = layers.length;
    let phase = "approach";

    const layerInterval = setInterval(() => {
      if (phase === "approach") {
        if (head) {
          head.style.transition = "transform .3s ease";
          head.style.transform = "translateX(10%)";
        }
        const patLabel = patternId === "honeycomb" ? "⬡ Honeycomb" : patternId === "organic" ? "🌀 Organic" : "⬛ Solid";
        if (statusEl) statusEl.textContent = `Layer ${layer + 1}/${totalLayers} — ${patLabel} pattern`;
        phase = "sweep";
        return;
      }

      if (phase === "sweep") {
        if (head) {
          head.style.transition = "transform .5s ease";
          head.style.transform = "translateX(90%)";
        }
        // Reveal the layer with a slight delay
        setTimeout(() => {
          if (layers[layer]) {
            layers[layer].style.opacity = "1";
            layers[layer].style.transform = "scaleY(1)";
            // Apply pattern-specific color
            const alpha = patternId === "honeycomb" ? "55" : patternId === "organic" ? "44" : "66";
            layers[layer].style.background = `linear-gradient(90deg, ${matColor}22, ${matColor}${alpha}, ${matColor}22)`;
          }
        }, 200);
        if (statusEl) statusEl.textContent = `Layer ${layer + 1}/${totalLayers} — depositing ${patternIcon}`;
        phase = "lift";
        return;
      }

      if (phase === "lift") {
        if (head) {
          head.style.transition = "transform .25s ease";
          head.style.transform = `translateX(${headStartX}px)`;
        }
        if (statusEl) statusEl.textContent = `Layer ${layer + 1}/${totalLayers} — done ✓`;
        layer++;
        if (layer >= totalLayers) {
          clearInterval(layerInterval);
          if (head) head.style.display = "none";
          if (bedPlate) {
            bedPlate.style.background = patternId === "honeycomb"
              ? `repeating-linear-gradient(60deg, ${matColor}11, ${matColor}11 6px, transparent 6px, transparent 8px)`
              : patternId === "organic"
                ? `linear-gradient(90deg, transparent, ${matColor}33, transparent)`
                : `linear-gradient(90deg, transparent, ${matColor}22, transparent)`;
          }
          setTimeout(() => {
            const result = PR.runPrint(currentEra, state, scenarioId);
            if (result.ok) {
              if (statusEl) statusEl.textContent = `✅ Print complete — ${patternIcon} ${ch.material ? ch.material.label : ""}`;
              UI.showPrintSuccess(currentEra, state, scenario);
            } else {
              if (statusEl) statusEl.textContent = "💥 Print failed";
              UI.showPrintFailure(currentEra, state, scenario, result.errors);
            }
          }, 500);
          return;
        }
        phase = "approach";
        return;
      }
    }, 650);
  }

  function onPrintNext() {
    if (PR.isComplete(state)) {
      appendToBody(UI.renderCelebration(currentEra));
      return;
    }
    render(UI.renderPrintPuzzle(currentEra, state));
    UI.showHint("⬅️ New design — mix your ingredients and set the pattern");
  }

  function onPrintRetry() {
    const resultEl = $("pr-result");
    const printBtn = $("pr-print-btn");
    if (resultEl) resultEl.innerHTML = "";
    if (printBtn) {
      printBtn.style.display = "";
      printBtn.disabled = false;
    }
    // Reset layers
    document.querySelectorAll(".pr-layer").forEach(l => {
      l.style.opacity = "0";
      l.style.transform = "";
      l.style.background = "";
    });
    const head = $("pr-print-head");
    if (head) {
      head.style.display = "";
      head.style.transform = "translateX(-40px)";
    }
    const bedPlate = $("pr-print-bed-plate");
    if (bedPlate) bedPlate.style.background = "";
    const statusEl = $("pr-print-status");
    if (statusEl) statusEl.textContent = "";

    // Go back to pattern selection step
    const pr = $("pr-step-print");
    const pat = $("pr-step-pattern");
    if (pr) pr.style.display = "none";
    if (pat) pat.style.display = "block";
    document.querySelectorAll(".pr-step-dot").forEach(d => {
      if (d.dataset.step === "3") d.classList.remove("active");
      if (d.dataset.step === "2") d.classList.add("active");
    });
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
    document.body.classList.remove("era-stone", "era-industrial", "era-machine", "era-cad", "era-robotics");
    if (currentEra && currentEra.id === 2) {
      document.body.classList.add("era-industrial");
    } else if (currentEra && currentEra.id === 3) {
      document.body.classList.add("era-machine");
    } else if (currentEra && currentEra.id === 4) {
      document.body.classList.add("era-cad");
    } else if (currentEra && currentEra.id === 5) {
      document.body.classList.add("era-robotics");
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
  window.onBlueprintParam = onBlueprintParam;
  window.onBlueprintSimulate = onBlueprintSimulate;
  window.onBlueprintNext = onBlueprintNext;
  window.onBlueprintRetry = onBlueprintRetry;
  window.onPrintDragStart = onPrintDragStart;
  window.onPrintDragEnd = onPrintDragEnd;
  window.onPrintDrop = onPrintDrop;
  window.onPrintChamberClick = onPrintChamberClick;
  window.onPrintIngredientTap = onPrintIngredientTap;
  window.onPrintToPattern = onPrintToPattern;
  window.onPrintPattern = onPrintPattern;
  window.onPrintToPrint = onPrintToPrint;
  window.onPrintBuild = onPrintBuild;
  window.onPrintNext = onPrintNext;
  window.onPrintRetry = onPrintRetry;

  return {
    init, restart, nextEra,
    showNarrative, launchPuzzle, showAutomation, finishEra,
    onPieceClick, onSlotClick,
    onBlueprintParam, onBlueprintSimulate, onBlueprintNext, onBlueprintRetry,
    onPrintDragStart, onPrintDragEnd, onPrintDrop, onPrintChamberClick,
    onPrintIngredientTap,
    onPrintToPattern, onPrintPattern, onPrintToPrint,
    onPrintBuild, onPrintNext, onPrintRetry
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