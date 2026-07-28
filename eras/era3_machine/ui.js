Object.assign(window.UIRenderer, (() => {
  const $ = id => document.getElementById(id);

  let _balanceCallbacks = null;
  let _balanceActive = false;
  let _balanceHoldTimer = null;
  const BALANCE_HOLD_MS = 500;
  let _fixedSide = null;


  function renderBalancePuzzle(era) {
    const sc = era.scenarios[0];
    const leverHtml = [
      { id: "left", label: "Left Arm", arm: sc.leftArm },
      { id: "right", label: "Right Arm", arm: sc.rightArm }
    ].map(side =>
      `<div class="lever-row" id="lever-row-${side.id}">
        <label class="lever-label">${side.label} (${side.arm.load}t/m)</label>
        <div class="lever-track">
          <input type="range" class="lever-slider" id="lever-${side.id}"
            data-side="${side.id}" min="0" max="${side.arm.max}" value="0" step="1">
          <div class="lever-thumb-label" id="lever-val-${side.id}">0m</div>
        </div>
      </div>`
    ).join("");

    return `<div class="screen active" id="balance-screen">
      ${window.UIRenderer.floatingHTML(era)}
      <div class="era-badge"><span>🏗️</span> Era ${era.id} — ${era.label}</div>
      <h2>Build the Cantilever</h2>
      <div class="bridge-visual" id="bridge-visual">
        <div class="bridge-deck" id="bridge-deck">
          <div class="arm-left" id="arm-left"><div class="arm-fill" id="arm-fill-left"></div></div>
          <div class="pier"></div>
          <div class="arm-right" id="arm-right"><div class="arm-fill" id="arm-fill-right"></div></div>
        </div>
        <div class="bridge-gap"></div>
        <div class="bridge-gap-right"></div>
      </div>
      <div class="bridge-specs" id="bridge-specs">
        <span>L: ${sc.leftArm.load}t/m</span>
        <span>Pier</span>
        <span>R: ${sc.rightArm.load}t/m</span>
      </div>
      <div class="torque-bars" id="torque-bars">
        <div class="torque-side">
          <div class="torque-fill-wrap left">
            <div class="torque-fill" id="torque-fill-left"></div>
          </div>
          <span class="torque-val" id="torque-val-left">0</span>
        </div>
        <div class="torque-label">MOMENT</div>
        <div class="torque-side">
          <div class="torque-fill-wrap right">
            <div class="torque-fill" id="torque-fill-right"></div>
          </div>
          <span class="torque-val" id="torque-val-right">0</span>
        </div>
      </div>
      <div class="balance-gauge" id="balance-gauge">
        <div class="gauge-label">BALANCE</div>
        <div class="gauge-track">
          <div class="gauge-bubble" id="gauge-bubble" style="left:50%"></div>
        </div>
      </div>
      <div class="scene-info" id="scene-info">Level 1/${era.scenarios.length}: ${sc.title} — ${sc.desc}</div>
      <div class="lever-panel" id="lever-panel">${leverHtml}</div>
      <div class="hint-bar" id="hint-bar">⬅️ Extend each arm with the sliders until the bridge is balanced</div>
    </div>`;
  }

  function startBalanceGame(era, state, callbacks) {
    _balanceCallbacks = callbacks;
    _balanceActive = true;
    bindBridgeSliders(era, state);
    updateBridgeScene(era, state);
  }

  function stopBalanceGame() {
    _balanceActive = false;
    _balanceCallbacks = null;
    if (_balanceHoldTimer) { clearTimeout(_balanceHoldTimer); _balanceHoldTimer = null; }
    _fixedSide = null;
  }

  function bindBridgeSliders(era, state) {
    const panel = document.getElementById("lever-panel");
    if (!panel) return;

    panel.querySelectorAll(".lever-slider").forEach(slider => {
      // Skip the fixed/disabled slider (it gets its value from _fixedSide)
      if (slider.disabled) return;
      slider.addEventListener("input", () => {
        if (!_balanceActive) return;
        const side = slider.dataset.side;
        const val = parseFloat(slider.value);
        const scIdx = state.currentIdx;
        const sc = era.scenarios[scIdx];
        if (!sc) return;
        if (!state.values[sc.id]) state.values[sc.id] = {};
        state.values[sc.id][side] = val;
        // Keep the fixed side's value in state for balance calculation
        if (_fixedSide) state.values[sc.id][_fixedSide.side] = _fixedSide.value;
        // Update label
        const lbl = document.getElementById("lever-val-" + side);
        if (lbl) lbl.textContent = val + "m";
        // Update bridge visual
        updateBridgeArms(sc, state.values[sc.id]);
        updateGauge(sc, state.values[sc.id]);
        // Hold-to-confirm
        if (_balanceHoldTimer) {
          clearTimeout(_balanceHoldTimer);
          _balanceHoldTimer = null;
        }
        if (BalanceEngine.isBalanced(sc, state.values[sc.id])) {
          _balanceHoldTimer = setTimeout(() => {
            _balanceHoldTimer = null;
            if (_balanceActive) onBridgeBalanced(era, state, sc);
          }, BALANCE_HOLD_MS);
        }
      });
    });
  }

  function updateBridgeArms(scenario, values) {
    const leftFill = document.getElementById("arm-fill-left");
    const rightFill = document.getElementById("arm-fill-right");
    const leftArm = document.getElementById("arm-left");
    const rightArm = document.getElementById("arm-right");
    if (!leftFill || !rightFill || !leftArm || !rightArm) return;

    const leftVal = values?.left ?? 0;
    const rightVal = values?.right ?? 0;
    const leftPct = (leftVal / scenario.leftArm.max) * 100;
    const rightPct = (rightVal / scenario.rightArm.max) * 100;

    leftFill.style.width = Math.min(leftPct, 100) + "%";
    rightFill.style.width = Math.min(rightPct, 100) + "%";

    // Update torque bars
    const leftTorque = scenario.leftArm.load * leftVal;
    const rightTorque = scenario.rightArm.load * rightVal;
    const maxTorque = Math.max(scenario.leftArm.load * scenario.leftArm.max, scenario.rightArm.load * scenario.rightArm.max, 1);
    const leftPctT = (leftTorque / maxTorque) * 100;
    const rightPctT = (rightTorque / maxTorque) * 100;

    const tFillL = document.getElementById("torque-fill-left");
    const tFillR = document.getElementById("torque-fill-right");
    const tValL = document.getElementById("torque-val-left");
    const tValR = document.getElementById("torque-val-right");
    if (tFillL) tFillL.style.height = Math.min(leftPctT, 100) + "%";
    if (tFillR) tFillR.style.height = Math.min(rightPctT, 100) + "%";
    if (tValL) tValL.textContent = leftTorque;
    if (tValR) tValR.textContent = rightTorque;

    // Color torque bars: green if balanced, red on heavy side
    const balanced = BalanceEngine.isBalanced(scenario, values || {});
    if (tFillL) tFillL.classList.toggle("balanced", balanced);
    if (tFillR) tFillR.classList.toggle("balanced", balanced);
    const imb2 = BalanceEngine.getImbalance(scenario, values || {});
    if (tFillL) tFillL.classList.toggle("heavier", imb2 < -0.02);
    if (tFillR) tFillR.classList.toggle("heavier", imb2 > 0.02);

    // Tilt the bridge based on imbalance
    const tilt = imb2 * 3;
    const deck = document.getElementById("bridge-deck");
    if (deck) deck.style.transform = `rotate(${tilt}deg)`;
  }

  function updateGauge(scenario, values) {
    const bubble = document.getElementById("gauge-bubble");
    if (!bubble) return;
    const imb = BalanceEngine.getImbalance(scenario, values || {});
    const pct = imb * 40;
    bubble.style.left = (50 + pct) + "%";
    bubble.classList.toggle("balanced", Math.abs(imb) < 0.05);
  }

  function onBridgeBalanced(era, state, scenario) {
    if (state.completed.has(scenario.id)) return;
    state.completed.add(scenario.id);
    const info = document.getElementById("scene-info");
    if (info) info.textContent += " ✅ Bridge balanced!";

    if (state.completed.size >= era.scenarios.length) {
      state.complete = true;
      const hint = document.getElementById("hint-bar");
      if (hint) hint.textContent = "✅ All spans balanced! The bridge is complete!";
      const deck = document.getElementById("bridge-deck");
      if (deck) deck.style.transform = "rotate(0deg)";
      setTimeout(() => {
        if (_balanceCallbacks && _balanceCallbacks.onComplete) {
          _balanceCallbacks.onComplete();
        }
      }, 800);
    } else {
      setTimeout(() => {
        if (!_balanceActive) return;
        state.currentIdx++;
        const nextSc = era.scenarios[state.currentIdx];
        if (!nextSc) return;
        if (!state.values[nextSc.id]) state.values[nextSc.id] = { left: 0, right: 0 };
        updateBridgeScene(era, state);
        // Reset sliders
        const panel = document.getElementById("lever-panel");
        if (panel) {
          panel.querySelectorAll(".lever-slider").forEach(slider => {
            slider.value = "0";
            const lbl = document.getElementById("lever-val-" + slider.dataset.side);
            if (lbl) lbl.textContent = "0m";
          });
        }
        const hint = document.getElementById("hint-bar");
        if (hint) hint.textContent = "⬅️ New span — extend the arms to balance";
      }, 1200);
    }
  }

  function pickFixedSide(scenario) {
    const sides = ["left", "right"];
    const side = sides[Math.floor(Math.random() * 2)];
    const adjSide = side === "left" ? "right" : "left";
    const fixedArm = side === "left" ? scenario.leftArm : scenario.rightArm;
    const adjArm = adjSide === "left" ? scenario.leftArm : scenario.rightArm;

    const maxFixed = fixedArm.max;
    const maxByAdj = (adjArm.max * adjArm.load) / fixedArm.load;
    const effectiveMax = Math.min(maxFixed, maxByAdj);
    const minFixed = Math.min(4, effectiveMax * 0.25);

    if (effectiveMax <= minFixed + 1) {
      return { side, value: Math.round(maxFixed * 0.4) };
    }
    const value = Math.round(minFixed + Math.random() * (effectiveMax - minFixed));
    return { side, value };
  }

  function updateBridgeScene(era, state) {
    if (_balanceHoldTimer) { clearTimeout(_balanceHoldTimer); _balanceHoldTimer = null; }
    const sc = era.scenarios[state.currentIdx];
    if (!sc) return;

    // Pick a random fixed side
    _fixedSide = pickFixedSide(sc);
    const adjSide = _fixedSide.side === "left" ? "right" : "left";
    const adjArm = adjSide === "left" ? sc.leftArm : sc.rightArm;
    const fixedArm = _fixedSide.side === "left" ? sc.leftArm : sc.rightArm;

    // Store fixed value in state
    if (!state.values[sc.id]) state.values[sc.id] = {};
    state.values[sc.id][_fixedSide.side] = _fixedSide.value;
    state.values[sc.id][adjSide] = 0;

    const info = document.getElementById("scene-info");
    if (info) info.textContent = `Level ${state.currentIdx + 1}/${era.scenarios.length}: ${sc.title} — adjust the ${adjSide} arm`;

    // Update spec labels with fixed indicator
    const specs = document.getElementById("bridge-specs");
    if (specs) {
      specs.innerHTML =
        `<span>L: ${sc.leftArm.load}t/m${_fixedSide.side === "left" ? " 🔒" : ""}</span><span>Pier</span><span>R: ${sc.rightArm.load}t/m${_fixedSide.side === "right" ? " 🔒" : ""}</span>`;
    }

    // Reset arms
    const leftFill = document.getElementById("arm-fill-left");
    const rightFill = document.getElementById("arm-fill-right");
    if (leftFill) leftFill.style.width = (_fixedSide.side === "left" ? _fixedSide.value / sc.leftArm.max * 100 : 0) + "%";
    if (rightFill) rightFill.style.width = (_fixedSide.side === "right" ? _fixedSide.value / sc.rightArm.max * 100 : 0) + "%";
    const deck = document.getElementById("bridge-deck");
    if (deck) deck.style.transform = "rotate(0deg)";

    // Update torque bars for initial state
    updateBridgeArms(sc, state.values[sc.id]);

    // Rebuild sliders — only show the adjustable side's slider; fixed side is a static label
    const panel = document.getElementById("lever-panel");
    if (panel) {
      const adjSide = _fixedSide.side === "left" ? "right" : "left";
      const adjArm = adjSide === "left" ? sc.leftArm : sc.rightArm;
      const fixedArm = _fixedSide.side === "left" ? sc.leftArm : sc.rightArm;
      panel.innerHTML = [
        `<div class="lever-row" id="lever-row-fixed">
          <label class="lever-label fixed-label">🔒 ${_fixedSide.side === "left" ? "Left" : "Right"} Arm (${fixedArm.load}t/m) — fixed at <strong>${_fixedSide.value}m</strong></label>
        </div>`,
        `<div class="lever-row" id="lever-row-${adjSide}">
          <label class="lever-label">${adjSide === "left" ? "Left" : "Right"} Arm (${adjArm.load}t/m)</label>
          <div class="lever-track">
            <input type="range" class="lever-slider" id="lever-${adjSide}"
              data-side="${adjSide}" min="0" max="${adjArm.max}" value="0" step="1">
            <div class="lever-thumb-label" id="lever-val-${adjSide}">0m</div>
          </div>
        </div>`
      ].join("");
      bindBridgeSliders(era, state);
    }
    // Reset gauge
    const bubble = document.getElementById("gauge-bubble");
    if (bubble) { bubble.style.left = "50%"; bubble.classList.remove("balanced"); }
  }

  function runBalanceAutomation(era) {
    const panel = document.getElementById("auto-lever-panel");
    if (!panel) return;
    const steps = era.scenarios;
    let step = 0;
    let timerStart = performance.now();
    let timerRaf = null;

    function setStatus(t, c) {
      const el = document.getElementById("auto-status");
      if (el) { el.textContent = t; if (c) el.style.color = c; }
    }

    function showMsgAndBtn() {
      if (timerRaf) cancelAnimationFrame(timerRaf);
      const banner = document.getElementById("auto-banner");
      if (banner) banner.style.display = "flex";
    }

    function updateTimer() {
      const elapsed = (performance.now() - timerStart) / 1000;
      const el = document.getElementById("auto-timer");
      if (el) el.textContent = elapsed.toFixed(1);
      timerRaf = requestAnimationFrame(updateTimer);
    }

    function updateArmsForScenario(sc, vals) {
      const leftFill = document.getElementById("auto-arm-fill-left");
      const rightFill = document.getElementById("auto-arm-fill-right");
      if (leftFill) leftFill.style.width = ((vals?.left ?? 0) / sc.leftArm.max * 100) + "%";
      if (rightFill) rightFill.style.width = ((vals?.right ?? 0) / sc.rightArm.max * 100) + "%";
      const deck = document.getElementById("auto-bridge-deck");
      if (deck) deck.style.transform = "rotate(0deg)";
      const lv = vals?.left ?? 0;
      const rv = vals?.right ?? 0;
      const lt = sc.leftArm.load * lv;
      const rt = sc.rightArm.load * rv;
      const maxT = Math.max(sc.leftArm.load * sc.leftArm.max, sc.rightArm.load * sc.rightArm.max, 1);
      const lf = document.getElementById("auto-torque-fill-left");
      const rf = document.getElementById("auto-torque-fill-right");
      const lvl = document.getElementById("auto-torque-val-left");
      const rvl = document.getElementById("auto-torque-val-right");
      if (lf) lf.style.height = (lt / maxT * 100) + "%";
      if (rf) rf.style.height = (rt / maxT * 100) + "%";
      if (lvl) lvl.textContent = lt;
      if (rvl) rvl.textContent = rt;
    }

    function updateLeverPanel(sc, fixed) {
      const adjSide = fixed.side === "left" ? "right" : "left";
      const adjArm = adjSide === "left" ? sc.leftArm : sc.rightArm;
      const fixedArm = fixed.side === "left" ? sc.leftArm : sc.rightArm;
      panel.innerHTML = [
        `<div class="lever-row" style="opacity:0.7;pointer-events:none">
          <label class="lever-label fixed-label">🔒 ${fixed.side === "left" ? "Left" : "Right"} Arm (${fixedArm.load}t/m) — fixed at <strong>${fixed.value}m</strong></label>
        </div>`,
        `<div class="lever-row" style="opacity:0.6;pointer-events:none">
          <label class="lever-label">${adjSide === "left" ? "Left" : "Right"} Arm (${adjArm.load}t/m)</label>
          <div class="lever-track">
            <input type="range" class="lever-slider auto-slider" id="auto-lever-${adjSide}" disabled
              value="0" min="0" max="${adjArm.max}" step="1" data-side="${adjSide}">
            <div class="lever-thumb-label" id="auto-lever-val-${adjSide}">0m</div>
          </div>
        </div>`
      ].join("");
    }

    function updateGauge(imb) {
      const bubble = document.getElementById("auto-gauge-bubble");
      if (!bubble) return;
      const pct = imb * 35;
      bubble.style.left = (50 + pct) + "%";
      bubble.classList.toggle("balanced", Math.abs(imb) < 0.05);
    }

    function doStep() {
      if (step >= steps.length) {
        const elapsed = ((performance.now() - timerStart) / 1000).toFixed(1);
        setStatus("✅ All cantilever spans balanced in " + elapsed + " seconds.", "#4ade80");
        setTimeout(showMsgAndBtn, 1200);
        return;
      }

      const sc = steps[step];
      const label = document.getElementById("auto-scene-label");
      if (label) label.textContent = `Level ${step + 1}/${steps.length}: ${sc.title}`;

      // Pick a random fixed side (same logic as the game)
      const fixed = pickFixedSide(sc);
      const adjSide = fixed.side === "left" ? "right" : "left";
      const adjArm = adjSide === "left" ? sc.leftArm : sc.rightArm;

      // Set initial state: fixed side at its value, adjustable at 0
      const initVals = { left: 0, right: 0 };
      initVals[fixed.side] = fixed.value;
      updateArmsForScenario(sc, initVals);
      updateLeverPanel(sc, fixed);
      setStatus(`🤖 Computing moments for ${sc.title}…`);

      // Calculate target for the adjustable side
      const fixedArm = fixed.side === "left" ? sc.leftArm : sc.rightArm;
      const fixedTorque = fixedArm.load * fixed.value;
      const adjTarget = Math.round(fixedTorque / adjArm.load);

      // Only animate the adjustable side's slider
      const slider = document.getElementById("auto-lever-" + adjSide);
      if (!slider) { step++; setTimeout(doStep, 300); return; }

      const start = 0;
      const end = Math.min(adjTarget, adjArm.max);
      const duration = era.speed * 3;
      const startTime = performance.now();

      function animateSlider(now) {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        const val = start + (end - start) * eased;
        slider.value = Math.round(val);
        const lbl = document.getElementById("auto-lever-val-" + adjSide);
        if (lbl) lbl.textContent = Math.round(val) + "m";
        // Update bridge arms
        const fill = document.getElementById("auto-arm-fill-" + adjSide);
        if (fill) fill.style.width = (Math.round(val) / adjArm.max * 100) + "%";
        // Update torque bars + gauge
        const v = { left: 0, right: 0 };
        v[fixed.side] = fixed.value;
        v[adjSide] = parseFloat(slider.value) || 0;
        const lt = sc.leftArm.load * v.left;
        const rt = sc.rightArm.load * v.right;
        const maxT = Math.max(sc.leftArm.load * sc.leftArm.max, sc.rightArm.load * sc.rightArm.max, 1);
        const lf = document.getElementById("auto-torque-fill-left");
        const rf = document.getElementById("auto-torque-fill-right");
        const lvl = document.getElementById("auto-torque-val-left");
        const rvl = document.getElementById("auto-torque-val-right");
        if (lf) lf.style.height = (lt / maxT * 100) + "%";
        if (rf) rf.style.height = (rt / maxT * 100) + "%";
        if (lvl) lvl.textContent = lt;
        if (rvl) rvl.textContent = rt;
        const net = BalanceEngine.calcNetTorque(sc, v);
        updateGauge(Math.max(-1, Math.min(1, net / maxT)));

        if (t < 1) {
          requestAnimationFrame(animateSlider);
        } else {
        setStatus(`✅ ${sc.title} — balanced at ${Math.round(end)}m`, "#4ade80");
        step++;
        setTimeout(() => doStep(), 900);
        }
      }
      requestAnimationFrame(animateSlider);
    }

    timerStart = performance.now();
    updateTimer();
    setTimeout(doStep, 400);
  }

  return {
    renderBalancePuzzle, startBalanceGame, stopBalanceGame, bindBridgeSliders, updateBridgeArms, updateGauge, onBridgeBalanced, pickFixedSide, updateBridgeScene, runBalanceAutomation
  };
})());
