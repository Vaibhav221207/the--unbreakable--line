Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');

  function cancelPressure() {
    if (Game.pressureState) {
      Game.pressureState.active = false;
      document.removeEventListener("pointerup", onPressureRelease);
      const gauge = $("pr-pressure-gauge");
      if (gauge) gauge.style.display = "none";
      Game.pressureState = null;
    }
  }

  function onPressureRelease(e) {
    if (!Game.pressureState || !Game.pressureState.active) return;
    Game.pressureState.active = false;
    document.removeEventListener("pointerup", onPressureRelease);

    const elapsed = Date.now() - Game.pressureState.startTime;
    const pct = Math.min(100, (elapsed / Game.pressureState.fillDuration) * 100);

    const gauge = $("pr-pressure-gauge");
    if (gauge) gauge.style.display = "none";

    if (pct >= 35 && pct <= 65) {
      const result = window.PrintEngine.addIngredient(Game.currentEra, Game.state, Game.pressureState.scenarioId, Game.pressureState.ingredientId);
      Game.draggedIngredient = null;
      handleIngredientResult(Game.pressureState.scenarioId, result);
    } else {
      Game.draggedIngredient = null;
      const hint = $("pr-chamber-hint");
      if (hint) {
        hint.textContent = pct < 35
          ? "⚠️ Not enough pressure — bond too weak. Try holding longer."
          : "⚠️ Too much pressure — bond fractured. Try releasing sooner.";
      }
    }
    Game.pressureState = null;
  }

  function showPressureGauge(scenarioId, ingredientId) {
    const gauge = $("pr-pressure-gauge");
    const fill = $("pr-pressure-fill");
    const readout = $("pr-pressure-readout");
    if (!gauge) return;

    Game.pressureState = {
      ingredientId, scenarioId,
      startTime: Date.now(),
      fillDuration: 1800,
      active: true
    };

    gauge.style.display = "block";
    if (fill) fill.style.width = "0%";
    if (readout) readout.textContent = "0%";

    function updateFill() {
      if (!Game.pressureState || !Game.pressureState.active) return;
      const elapsed = Date.now() - Game.pressureState.startTime;
      const pct = Math.min(100, (elapsed / Game.pressureState.fillDuration) * 100);
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
    window.Game.render(window.UIRenderer.renderPrintPuzzle(Game.currentEra, Game.state));
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
        window.PrintEngine.clearChamber(Game.state, scenarioId);
        if (chamber) chamber.classList.remove("pr-chamber-spark");
        window.Game.render(window.UIRenderer.renderPrintPuzzle(Game.currentEra, Game.state));
      }, 1200);
    }
  }

  function launchPrintPuzzle() {
    Game.state = window.PrintEngine.createState(Game.currentEra);
    window.Game.render(window.UIRenderer.renderPrintPuzzle(Game.currentEra, Game.state));
  }

  function onPrintDragStart(event, ingredientId) {
    Game.draggedIngredient = ingredientId;
    event.dataTransfer.effectAllowed = "copy";
    Game.tapSelectedIngredient = null;
    document.querySelectorAll(".pr-ingredient").forEach(el => el.classList.remove("selected"));
    cancelPressure();
  }

  function onPrintDragEnd() {
    Game.draggedIngredient = null;
  }

  function onPrintDrop(event, scenarioId) {
    event.preventDefault();
    if (!Game.draggedIngredient) return;

    Game.tapSelectedIngredient = null;
    document.querySelectorAll(".pr-ingredient").forEach(el => el.classList.remove("selected"));

    const c = window.PrintEngine.getChamber(Game.state, scenarioId);
    if (c.ingredients.length >= 2) {
      const hint = $("pr-chamber-hint");
      if (hint) hint.textContent = "Chamber is full — click it to clear and try again";
      Game.draggedIngredient = null;
      return;
    }
    showPressureGauge(scenarioId, Game.draggedIngredient);
  }

  function onPrintIngredientTap(ingredientId) {
    Game.draggedIngredient = null;
    cancelPressure();
    Game.tapSelectedIngredient = (Game.tapSelectedIngredient === ingredientId) ? null : ingredientId;
    document.querySelectorAll(".pr-ingredient").forEach(el => {
      el.classList.toggle("selected", el.dataset.id === Game.tapSelectedIngredient);
    });
  }

  function onPrintChamberClick(scenarioId) {
    if (Game.tapSelectedIngredient) {
      showPressureGauge(scenarioId, Game.tapSelectedIngredient);
      Game.tapSelectedIngredient = null;
      document.querySelectorAll(".pr-ingredient").forEach(el => el.classList.remove("selected"));
      return;
    }
    const c = window.PrintEngine.getChamber(Game.state, scenarioId);
    if (c.ingredients.length > 0 || c.material) {
      window.PrintEngine.clearChamber(Game.state, scenarioId);
      window.Game.render(window.UIRenderer.renderPrintPuzzle(Game.currentEra, Game.state));
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
    window.PrintEngine.setPattern(Game.state, scenarioId, patternId);
    window.Game.render(window.UIRenderer.renderPrintPuzzle(Game.currentEra, Game.state));
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

    const scenario = window.PrintEngine.getScenario(Game.state, Game.currentEra);
    if (!scenario) return;
    const ch = window.PrintEngine.getChamber(Game.state, scenarioId);
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
            const result = window.PrintEngine.runPrint(Game.currentEra, Game.state, scenarioId);
            if (result.ok) {
              if (statusEl) statusEl.textContent = `✅ Print complete — ${patternIcon} ${ch.material ? ch.material.label : ""}`;
              window.UIRenderer.showPrintSuccess(Game.currentEra, Game.state, scenario);
            } else {
              if (statusEl) statusEl.textContent = "💥 Print failed";
              window.UIRenderer.showPrintFailure(Game.currentEra, Game.state, scenario, result.errors);
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
    if (window.PrintEngine.isComplete(Game.state)) {
      window.Game.appendToBody(window.UIRenderer.renderCelebration(Game.currentEra));
      return;
    }
    window.Game.render(window.UIRenderer.renderPrintPuzzle(Game.currentEra, Game.state));
    window.UIRenderer.showHint("⬅️ New design — mix your ingredients and set the pattern");
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

  return {
    cancelPressure, onPressureRelease, showPressureGauge, handleIngredientResult, launchPrintPuzzle, onPrintDragStart, onPrintDragEnd, onPrintDrop, onPrintIngredientTap, onPrintChamberClick, onPrintToPattern, onPrintPattern, onPrintToPrint, onPrintBuild, onPrintNext, onPrintRetry
  };
})());
