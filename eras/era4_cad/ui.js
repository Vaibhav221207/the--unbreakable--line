Object.assign(window.UIRenderer, (() => {
  const $ = id => document.getElementById(id);

  function renderBlueprintPuzzle(era, state) {
    const sc = window.BlueprintEngine.getScenario(state, era);
    if (!sc) return "<div>No scenario</div>";

    function paramRow(param) {
      const sels = window.BlueprintEngine.getSelections(state, sc.id);
      const current = sels[param.id] || "";
      return `<div class="bp-param">
        <label class="bp-param-label">${param.label}</label>
        <div class="bp-toggle-group">${param.options.map(o =>
          `<button class="bp-toggle${current === o.id ? " active" : ""}"
            data-param="${param.id}" data-value="${o.id}"
            onclick="Game.onBlueprintParam('${sc.id}','${param.id}','${o.id}')">${o.label}</button>`
        ).join("")}</div>
      </div>`;
    }

    return `<div class="screen active">
      ${window.UIRenderer.floatingHTML(era)}
      <div class="era-badge" style="background:linear-gradient(135deg,#1a2a4a,#0a1a3a);border-color:rgba(80,180,240,0.3);color:#80d0f0">
        <span>${era.icon}</span> Era ${era.id} — ${era.label}</div>
      <h2>${sc.icon} ${sc.title}</h2>
      <p class="subtitle" style="color:#70a0c0">${sc.desc}</p>
      <div id="bp-sim-area" class="bp-sim-area">
        <div class="bp-structure" id="bp-structure">
          <div class="bp-ground"></div>
          <div class="bp-building" id="bp-building">
            <div class="bp-floor"></div>
            <div class="bp-floor"></div>
            <div class="bp-floor"></div>
          </div>
        </div>
      </div>
      <div class="bp-params">${era.params.map(paramRow).join("")}</div>
      <button class="btn bp-run-btn" onclick="Game.onBlueprintSimulate()" id="bp-run-btn" disabled>▶ Run Simulation</button>
      <div class="hint-bar" id="hint-bar"></div>
      <div class="bp-result" id="bp-result"></div>
    </div>`;
  }

  function showBlueprintSuccess(era, state, scenario, isLast) {
    const resultEl = $("bp-result");
    const runBtn = $("bp-run-btn");
    const bld = $("bp-building");
    if (resultEl) {
      resultEl.innerHTML = `<div class="bp-success">
        <div class="bp-success-icon">✅</div>
        <div class="bp-success-text">${scenario.successText}</div>
        <button class="btn bp-next-btn" onclick="Game.onBlueprintNext()">
          ${isLast ? "🏁 All Tests Passed!" : "Next Hazard →"}
        </button>
      </div>`;
    }
    if (bld) {
      bld.classList.add("bp-shake");
      setTimeout(() => bld.classList.remove("bp-shake"), 1200);
    }
    if (runBtn) runBtn.style.display = "none";
  }

  function showBlueprintFailure(era, state, scenario, errorParams) {
    const resultEl = $("bp-result");
    const simArea = $("bp-sim-area");
    const runBtn = $("bp-run-btn");
    const bld = $("bp-building");
    const hints = scenario.failureHints;
    const errorList = errorParams.map(ep => {
      const param = era.params.find(p => p.id === ep);
      return `<div class="bp-error"><span class="bp-error-label">${param ? param.label : ep}:</span> ${hints[ep] || "Not suitable."}</div>`;
    }).join("");

    // Hide run button during retry state
    if (runBtn) runBtn.style.display = "none";

    // Show error details below
    if (resultEl) {
      resultEl.innerHTML = `<div class="bp-failure">
        <div class="bp-failure-icon">💥</div>
        <div class="bp-failure-title">Structure Failed</div>
        <div class="bp-errors">${errorList}</div>
      </div>`;
    }

    // Show retry overlay on the simulation area
    if (simArea) {
      const overlay = document.createElement("div");
      overlay.className = "bp-retry-overlay";
      overlay.innerHTML = `<button class="btn bp-retry-btn" onclick="Game.onBlueprintRetry()">↻ Retry</button>`;
      simArea.style.position = "relative";
      simArea.appendChild(overlay);
    }

    // Scroll result into view so error details are visible
    if (resultEl) resultEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Animate failure based on first error
    if (bld) {
      bld.classList.remove("bp-shake", "bp-sway", "bp-crack");
      if (errorParams[0] === "foundation") bld.classList.add("bp-crack");
      else if (errorParams[0] === "bracing") bld.classList.add("bp-sway");
      else bld.classList.add("bp-crack");
      setTimeout(() => bld.classList.remove("bp-crack", "bp-sway"), 2000);
    }
    // Highlight incorrect toggles
    document.querySelectorAll(".bp-toggle").forEach(btn => {
      const p = btn.dataset.param;
      if (errorParams.includes(p)) btn.classList.add("bp-toggle-error");
      else btn.classList.remove("bp-toggle-error");
    });
  }

  function runBlueprintAutomation(era) {
    const comboList = [];
    for (const f of era.params[0].options) {
      for (const b of era.params[1].options) {
        for (const m of era.params[2].options) {
          comboList.push({ foundation: f.id, bracing: b.id, material: m.id });
        }
      }
    }
    // Shuffle for variety
    for (let i = comboList.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [comboList[i], comboList[j]] = [comboList[j], comboList[i]];
    }

    const correctCombos = [
      { foundation:"deep", bracing:"cross", material:"flexible" },
      { foundation:"deep", bracing:"diagonal", material:"rigid" }
    ];

    const timerEl = $("auto-timer");
    const termBody = $("bp-term-body");
    const termCursor = $("bp-term-cursor");
    const banner = $("auto-banner");
    let step = 0;
    const startTime = performance.now();

    if (timerEl) timerEl.textContent = "0.0";
    if (termBody) termBody.innerHTML = "";
    if (banner) banner.style.display = "none";

    function updateTimer() {
      if (!timerEl) return;
      const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
      timerEl.textContent = elapsed;
      if (step < comboList.length || !banner || banner.style.display === "none") requestAnimationFrame(updateTimer);
    }
    updateTimer();

    function addLine(text, cls) {
      if (!termBody) return;
      const line = document.createElement("div");
      line.className = "bp-term-line " + (cls || "");
      line.textContent = text;
      termBody.appendChild(line);
      termBody.scrollTop = termBody.scrollHeight;
    }

    const interval = setInterval(() => {
      if (step >= comboList.length) {
        clearInterval(interval);
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        addLine(`─── SWEEP COMPLETE: ${elapsed}s ───`, "bp-term-dim");
        addLine("2 optimal configurations found.", "bp-term-success");
        if (termCursor) termCursor.style.display = "none";
        setTimeout(() => {
          if (banner) banner.style.display = "flex";
        }, 1000);
        return;
      }

      const c = comboList[step];
      const isCorrect = correctCombos.some(cl =>
        cl.foundation === c.foundation && cl.bracing === c.bracing && cl.material === c.material
      );
      const label = `${c.foundation} + ${c.bracing} + ${c.material}`;
      addLine(`> ${label.padEnd(22)} ${isCorrect ? "✓ PASS" : "✗ FAIL"}`, isCorrect ? "bp-term-pass" : "bp-term-fail");
      step++;
    }, era.automation.speed || 8);
  }

  return {
    renderBlueprintPuzzle, showBlueprintSuccess, showBlueprintFailure, runBlueprintAutomation
  };
})());
