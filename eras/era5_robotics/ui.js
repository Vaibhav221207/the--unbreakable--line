Object.assign(window.UIRenderer, (() => {
  const $ = id => document.getElementById(id);

  function renderPrintPuzzle(era, state) {
    const sc = window.PrintEngine.getScenario(state, era);
    if (!sc) return "<div>No scenario</div>";
    const ch = window.PrintEngine.getChamber(state, sc.id);

    const ingHtml = era.ingredients.map(ing =>
      `<div class="pr-ingredient" draggable="true"
        ondragstart="Game.onPrintDragStart(event,'${ing.id}')"
        ondragend="Game.onPrintDragEnd()"
        onclick="Game.onPrintIngredientTap('${ing.id}')"
        data-id="${ing.id}">
        <span class="pr-ing-icon">${ing.icon}</span>
        <span class="pr-ing-label">${ing.label}</span>
      </div>`
    ).join("");

    const chamberContents = ch.ingredients.length === 0
      ? `<div class="pr-chamber-placeholder">Drop ingredients here</div>`
      : ch.ingredients.map(id => {
          const ing = era.ingredients.find(i => i.id === id);
          return ing ? `<span class="pr-chamber-item">${ing.icon}</span>` : "";
        }).join("");

    const materialHtml = ch.material
      ? `<div class="pr-material-sample">${ch.material.icon}<span>${ch.material.label}</span></div>`
      : "";

    const materialColor = ch.material ? ({
      lightweight_composite: "#60d0b0",
      flexible_polymer: "#c070e0",
      standard_concrete: "#90a0a0"
    }[ch.material.id] || "#70e0c0") : "#70e0c0";

    const patternHtml = era.patterns.map(p =>
      `<div class="pr-swatch${ch.pattern === p.id ? " active" : ""}"
        onclick="Game.onPrintPattern('${sc.id}','${p.id}')" data-icon="${p.icon}">
        <span class="pr-swatch-icon">${p.icon}</span>
        <span class="pr-swatch-label">${p.label}</span>
      </div>`
    ).join("");

    return `<div class="screen active">
      ${window.UIRenderer.floatingHTML(era)}
      <div class="era-badge" style="background:linear-gradient(135deg,#0a2a2a,#062020);border-color:rgba(100,220,200,0.25);color:#70e0c0">
        <span>${era.icon}</span> Era ${era.id} — ${era.label}</div>
      <h2>${sc.icon} ${sc.title}</h2>
      <p class="subtitle" style="color:#60b0a0">${sc.desc}</p>

      <div class="pr-step-bar">
        <span class="pr-step-dot active" data-step="1">1. Mix</span>
        <span class="pr-step-line"></span>
        <span class="pr-step-dot" data-step="2">2. Pattern</span>
        <span class="pr-step-line"></span>
        <span class="pr-step-dot" data-step="3">3. Print</span>
      </div>

      <!-- Step 1 - Mixing Chamber -->
      <div class="pr-step-content" id="pr-step-mix">
        <div class="pr-chamber-wrap">
          <div class="pr-shelf">${ingHtml}</div>
          <div class="pr-chamber" id="pr-chamber"
            ondragover="event.preventDefault()"
            ondrop="Game.onPrintDrop(event,'${sc.id}')"
            onclick="Game.onPrintChamberClick('${sc.id}')">
            <div class="pr-chamber-bg"></div>
            <div class="pr-chamber-inner" id="pr-chamber-inner">
              ${chamberContents}
              ${materialHtml}
            </div>
            <div class="pr-chamber-glow" id="pr-chamber-glow"></div>
          </div>
        </div>
        <div class="pr-chamber-hint" id="pr-chamber-hint"></div>
        <button class="btn pr-next-btn" id="pr-to-pattern"
          style="display:${ch.material ? "inline-flex" : "none"}"
          onclick="Game.onPrintToPattern()">Set Pattern →</button>
      </div>

      <!-- Step 2 - Pattern Selection -->
      <div class="pr-step-content" id="pr-step-pattern" style="display:none">
        <p style="color:#60b0a0;font-size:.75rem;margin-bottom:10px;text-align:center">
          Selected material: ${ch.material ? ch.material.icon + " " + ch.material.label : "—"}
        </p>
        <div class="pr-swatches">${patternHtml}</div>
        <button class="btn pr-next-btn" id="pr-to-print"
          style="display:${ch.pattern ? "inline-flex" : "none"}"
          onclick="Game.onPrintToPrint()">Print →</button>
      </div>

      <!-- Step 3 - Print Area -->
      <div class="pr-step-content" id="pr-step-print" style="display:none">
        <p style="color:#60b0a0;font-size:.65rem;margin-bottom:8px;text-align:center;font-family:'Consolas','Courier New',monospace">
          ${ch.material ? ch.material.icon + " " + ch.material.label : "—"} · ${ch.pattern ? era.patterns.find(p => p.id === ch.pattern).icon + " " + era.patterns.find(p => p.id === ch.pattern).label : "—"}
        </p>
        <div class="pr-print-bed" data-matcolor="${materialColor}">
          <div class="pr-print-head" id="pr-print-head">
            <div class="pr-print-filament" id="pr-print-filament"></div>
            <div class="pr-print-tip" id="pr-print-tip"></div>
          </div>
          <div class="pr-print-layers" id="pr-print-layers">
            <div class="pr-layer" style="opacity:0" data-l="0"></div>
            <div class="pr-layer" style="opacity:0" data-l="1"></div>
            <div class="pr-layer" style="opacity:0" data-l="2"></div>
            <div class="pr-layer" style="opacity:0" data-l="3"></div>
            <div class="pr-layer" style="opacity:0" data-l="4"></div>
            <div class="pr-layer" style="opacity:0" data-l="5"></div>
            <div class="pr-layer" style="opacity:0" data-l="6"></div>
          </div>
          <div class="pr-print-bed-plate" id="pr-print-bed-plate"></div>
        </div>
        <div class="pr-print-status" id="pr-print-status">Ready to print</div>
        <button class="btn pr-print-btn" onclick="Game.onPrintBuild('${sc.id}')" id="pr-print-btn">▶ Start Print</button>
        <div class="pr-result" id="pr-result"></div>
      </div>
    </div>`;
  }

  function showPrintSuccess(era, state, scenario) {
    AudioSystem.playSound('success');
    const resultEl = $("pr-result");
    const printBtn = $("pr-print-btn");
    if (resultEl) {
      resultEl.innerHTML = `<div class="pr-success">
        <div class="pr-success-icon">✅</div>
        <div class="pr-success-text">${scenario.successText}</div>
        <button class="btn pr-next-btn" onclick="Game.onPrintNext()">
          ${state.completed.size >= era.scenarios.length ? "🏁 All Prints Complete!" : "Next Design →"}
        </button>
      </div>`;
    }
    if (printBtn) printBtn.style.display = "none";
  }

  function showPrintFailure(era, state, scenario, errorParams) {
    AudioSystem.playSound('fail');
    const resultEl = $("pr-result");
    const printBtn = $("pr-print-btn");
    const hints = scenario.failureHints;
    const errorList = errorParams.map(ep => {
      const label = ep === "ingredients" ? "Material" : "Infill Pattern";
      return `<div class="pr-error"><span class="pr-error-label">${label}:</span> ${hints[ep] || "Not suitable."}</div>`;
    }).join("");

    if (printBtn) printBtn.style.display = "none";
    if (resultEl) {
      resultEl.innerHTML = `<div class="pr-failure">
        <div class="pr-failure-icon">💥</div>
        <div class="pr-failure-title">Print Failed</div>
        <div class="pr-errors">${errorList}</div>
        <button class="btn pr-retry-btn" onclick="Game.onPrintRetry()">↻ Retry</button>
      </div>`;
    }
  }

  function renderPrintAutomation(era) {
    if (era.puzzleType !== "print") return "";
    const iterHtml = era.ingredients.map(ing =>
      `<span class="pr-auto-shelf-item" data-id="${ing.id}">${ing.icon}</span>`
    ).join("");

    return `<div class="auto-page show" id="auto-page">
      <div class="auto-scene-top">
        <div class="auto-timer" style="color:#70e0c0">
          <span class="auto-timer-num" id="auto-timer">0.0</span><span class="auto-timer-unit">SECONDS</span>
          <div class="auto-timer-label">elapsed</div>
        </div>
        <div class="auto-scene-characters">
            <div class="auto-worker">
              <div class="auto-worker-hat"></div>
              <div class="auto-worker-head">
                <div class="auto-worker-glasses">
                  <div class="auto-worker-lens left"></div>
                  <div class="auto-worker-lens right"></div>
                  <div class="auto-worker-bridge"></div>
                </div>
                <div class="auto-worker-eye left"></div>
                <div class="auto-worker-eye right"></div>
                <div class="auto-worker-smile"></div>
              </div>
              <div class="auto-worker-body">
                <div class="auto-worker-collar"></div>
                <div class="auto-worker-pocket"></div>
              </div>
              <div class="auto-worker-arm left"></div>
              <div class="auto-worker-arm right">
                <div class="auto-worker-blueprint"></div>
              </div>
              <div class="auto-worker-legs">
                <div class="auto-worker-leg left"></div>
                <div class="auto-worker-leg right"></div>
              </div>
            </div>
            <div class="auto-arrow"><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div></div>
            <div class="auto-robot">
              <div class="auto-robot-antenna"></div>
              <div class="auto-robot-head">
                <div class="auto-robot-visor"></div>
                <div class="auto-robot-indicator"></div>
              </div>
              <div class="auto-robot-body">
                <div class="auto-robot-vent"></div>
                <div class="auto-robot-bolt top"></div>
                <div class="auto-robot-bolt bottom"></div>
              </div>
              <div class="auto-robot-arm left">
                <div class="auto-robot-joint"></div>
              </div>
              <div class="auto-robot-arm right">
                <div class="auto-robot-joint"></div>
              </div>
              <div class="auto-robot-base">
                <div class="auto-robot-wheel left"></div>
                <div class="auto-robot-wheel right"></div>
              </div>
              <div class="auto-robot-shadow"></div>
            </div>
          </div>
        <div class="era-badge" style="background:linear-gradient(135deg,#0a2a2a,#062020);border-color:rgba(100,220,200,0.25);color:#70e0c0">
          <span>🤖</span> The Age of Robotics & 3D Printing</div>
        <div class="speed-tag" style="background:linear-gradient(135deg,#0a2a2a,#062020);border-color:rgba(100,220,200,0.2);color:#70e0c0">
          ⏱ ${era.automation.speed}ms per layer — 4 iterations</div>
      </div>
      <p class="narrative auto-narr">${era.automation.intro}</p>

      <div class="pr-auto-factory">
        <div class="pr-auto-shelf" id="pr-auto-shelf">${iterHtml}</div>
        <div class="pr-auto-chamber" id="pr-auto-chamber">⚗️</div>
        <div class="pr-auto-convey">
          <span class="pr-auto-arr">→</span><span class="pr-auto-arr">→</span><span class="pr-auto-arr">→</span>
        </div>
        <div class="pr-auto-mini-printer" id="pr-auto-mini-printer">
          <div class="pr-auto-mini-bed" id="pr-auto-mini-bed">
            <div class="pr-auto-mini-layer" id="pr-auto-ml-0" style="height:0"></div>
            <div class="pr-auto-mini-layer" id="pr-auto-ml-1" style="height:0"></div>
            <div class="pr-auto-mini-layer" id="pr-auto-ml-2" style="height:0"></div>
            <div class="pr-auto-mini-layer" id="pr-auto-ml-3" style="height:0"></div>
          </div>
          <div class="pr-auto-mini-nozzle" id="pr-auto-nozzle">⏬</div>
        </div>
      </div>

      <div class="pr-auto-status" id="pr-auto-status">Initializing autonomous fabrication…</div>
      <div class="auto-banner" id="auto-banner" style="display:none">
        <div class="auto-banner-inner">
          <div class="auto-banner-icon">🤖</div>
          <div class="auto-banner-title">Autonomous Fabrication Complete</div>
          <div class="auto-banner-msg">${era.automation.message}</div>
          <button class="btn btn-ghost" onclick="Game.finishEra()">See what comes next →</button>
        </div>
      </div>
    </div>`;
  }

  function runPrintAutomation(era) {
    const timerEl = $("auto-timer");
    const statusEl = $("pr-auto-status");
    const chamber = $("pr-auto-chamber");
    const bed = $("pr-auto-mini-bed");
    const layers = [
      $("pr-auto-ml-0"), $("pr-auto-ml-1"), $("pr-auto-ml-2"), $("pr-auto-ml-3")
    ];
    const nozzle = $("pr-auto-nozzle");
    const banner = $("auto-banner");
    const startTime = performance.now();
    let step = 0;
    const totalSteps = 4;

    const combos = [
      { mat: "lightweight_composite", icon: "🔷", label: "Lightweight Composite", pattern: "honeycomb", ok: true, color: "#60d0b0" },
      { mat: "flexible_polymer", icon: "🌀", label: "Flexible Polymer", pattern: "solid", ok: false, color: "#c070e0" },
      { mat: "standard_concrete", icon: "🧱", label: "Standard Concrete", pattern: "organic", ok: false, color: "#90a0a0" },
      { mat: "flexible_polymer", icon: "🌀", label: "Flexible Polymer", pattern: "organic", ok: true, color: "#c070e0" }
    ].sort(() => Math.random() - 0.5);

    if (timerEl) timerEl.textContent = "0.0";
    if (statusEl) statusEl.textContent = "Iteration 1/4 — mixing…";
    if (banner) banner.style.display = "none";

    function updateTimer() {
      if (!timerEl) return;
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      timerEl.textContent = elapsed;
      if (step < totalSteps + 1) requestAnimationFrame(updateTimer);
    }
    updateTimer();

    function animateStep(idx) {
      if (idx >= totalSteps) {
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        if (statusEl) {
          statusEl.textContent = `✅ 4 iterations complete in ${elapsed}s — optimal: Lightweight Composite + Honeycomb, Flexible Polymer + Organic Lattice`;
          statusEl.style.color = "#4ade80";
        }
        setTimeout(() => {
          if (banner) banner.style.display = "flex";
        }, 1000);
        return;
      }

      const combo = combos[idx];

      // Step 1: highlight ingredients in chamber
      if (chamber) chamber.textContent = "🧪⚗️";
      if (statusEl) statusEl.textContent = `Iteration ${idx + 1}/4 — synthesizing ${combo.icon} ${combo.label}…`;

      // Step 2: after a beat, start printing layers
      setTimeout(() => {
        if (chamber) chamber.textContent = "✅";
        if (statusEl) statusEl.textContent = `Iteration ${idx + 1}/4 — printing ${combo.pattern}…`;

        // Build layers one by one
        let l = 0;
        const layerInterval = setInterval(() => {
          if (l >= layers.length) {
            clearInterval(layerInterval);
            // Show pass/fail
            if (statusEl) {
              const result = combo.ok ? "✅ PASS" : "❌ FAIL";
              statusEl.textContent = `Iteration ${idx + 1}/4 — ${combo.label} + ${combo.pattern} ${result}`;
              statusEl.style.color = combo.ok ? "#4ade80" : "#e08060";
            }
            // Reset for next iteration
            setTimeout(() => {
              if (nozzle) nozzle.style.transform = "translateY(0)";
              if (bed) bed.style.background = "";
              layers.forEach(ly => { if (ly) ly.style.height = "0"; });
              step++;
              animateStep(step);
            }, 1000);
            return;
          }
          // Grow layer
          if (layers[l]) {
            layers[l].style.height = "12px";
            layers[l].style.background = combo.color;
          }
          if (nozzle) nozzle.style.transform = `translateY(${l * 16 + 2}px)`;
          l++;
        }, 500);
      }, 1200);
    }

    animateStep(0);
  }

  return {
    renderPrintPuzzle, showPrintSuccess, showPrintFailure, renderPrintAutomation, runPrintAutomation
  };
})());
