/**
 * UIRenderer — All DOM rendering templates and visual helpers.
 * Generates HTML strings and syncs UI state with puzzle engine.
 */
const UIRenderer = (() => {
  const $ = id => document.getElementById(id);
  const BPE = BlueprintEngine;
  const PR = PrintEngine;

  // ---- Screen Templates ---- //

  /** Generate floating background items for the current era (CSS-drawn shapes). */
  function floatingHTML(era) {
    const shapeSets = {
      1: ["rock","spark","leaf","rock","spark","leaf"],
      2: ["gear","bolt","smoke","gear","rivet","bolt"],
      3: ["beam","hex","dot","beam","hex","dot"],
      5: ["dot","hex","spark","dot","hex","spark"]
    };
    const pool = shapeSets[era.id] || shapeSets[1];
    const cols = 4, rows = 3;
    const cellW = 100 / cols, cellH = 100 / rows;
    let html = `<div class="floating-bg">`;
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const shape = pool[idx % pool.length];
        const l = (c * cellW + cellW * 0.15 + Math.random() * cellW * 0.7).toFixed(1);
        const t = (r * cellH + cellH * 0.15 + Math.random() * cellH * 0.7).toFixed(1);
        const d = (Math.random() * 12).toFixed(1);
        const dur = (8 + Math.random() * 10).toFixed(1);
        const s = (0.4 + Math.random() * 0.6).toFixed(1);
        html += `<div class="fi shape-${shape}" style="left:${l}%;top:${t}%;--sz:${s};animation-delay:${d}s;animation-duration:${dur}s"></div>`;
        idx++;
      }
    }
    return html + `</div>`;
  }

  function renderIntro(era) {
    return `<div class="screen active">
      ${floatingHTML(era)}
      <div style="height:30px"></div>
      <div style="font-size:4rem;margin-bottom:10px">${era.icon}</div>
      <h1>${era.intro.title}</h1>
      <p class="subtitle">${era.intro.subtitle}</p>
      <p class="subtitle">${era.intro.lines[0]}</p>
      <p class="subtitle">${era.intro.lines[1]}</p>
      <button class="btn" onclick="Game.showNarrative()">${era.intro.btn}</button>
    </div>`;
  }

  function renderNarrative(era) {
    return `<div class="screen active">
      ${floatingHTML(era)}
      <div class="era-badge"><span>🏛️</span> Era ${era.id} — ${era.label}</div>
      <h2>${era.icon} ${era.label}</h2>
      <p class="narrative">${era.narrative.scene}</p>
      <p class="narrative" style="color:var(--stone-light);font-style:italic;">${era.narrative.quest}</p>
      <button class="btn" onclick="Game.launchPuzzle()">Start Building</button>
    </div>`;
  }

  // ---- Arch: stones positioned absolutely in an arch curve ---- //
  function renderPuzzle(era) {
    // Generate positioned stone slots — x,y,w,h as percentages of parent
    const slotHtml = era.pieces.map(p => {
      return `<div class="stone-slot" id="${p.slot}" data-slot="${p.slot}"
        style="left:${p.x - p.w/2}%;top:${p.y - p.h/2}%;width:${p.w}%;height:${p.h}%;--r:${p.rot}deg"
        onclick="Game.onSlotClick('${p.slot}')"></div>`;
    }).join("");

    // Picker grid — shape preview per type
    const pickerHtml = era.pieces.map(p =>
      `<button class="pick-btn" id="pick-${p.id}" data-type="${p.type}" onclick="Game.onPieceClick('${p.id}')">
        <div class="shape-preview shape-${p.type}"></div>
        <span>${p.label}</span>
      </button>`
    ).join("");

    return `<div class="screen active">
      ${floatingHTML(era)}
      <div class="era-badge"><span>🪨</span> Era ${era.id} — ${era.label}</div>
      <h2>Build the Arch</h2>
      <div class="arch-stage" id="arch-stage">
        ${slotHtml}
      </div>
      <div class="progress-track"><div class="progress-fill" id="prog-fill"></div></div>
      <div class="hint-bar" id="hint-bar"></div>
      <div class="material-picker">
        <h3>🔨 Quarry</h3>
        <div class="picker-grid">${pickerHtml}</div>
        <div class="pick-hint">Tap a stone → tap its place on the arch</div>
      </div>
    </div>`;
  }

  function renderCelebration(era) {
    const emoji = era.celebration.emoji || "🎉🏛️✨";
    return `<div class="celebration show" id="celebration">
      ${floatingHTML(era)}
      <div style="font-size:3.5rem;margin-bottom:12px">${emoji}</div>
      <h2>${era.celebration.title}</h2>
      <p>${era.celebration.text}</p>
      <button class="btn" onclick="Game.showAutomation()" style="margin-top:14px">${era.celebration.btn || "Decades Later… →"}</button>
    </div>`;
  }

  // ---- Automation: cold/sterile full page rebuild ---- //
  function renderAutomation(era) {
    // Balance puzzle automation (Era 3+)
    if (era.puzzleType === "balance") {
      const firstSc = era.scenarios[0];
      // Placeholder — will be rebuilt by runBalanceAutomation with a random fixed side
      const leverHtml = `<div class="lever-row" style="opacity:0.7;pointer-events:none">
        <label class="lever-label fixed-label">🔒 Arm fixed at initial position…</label>
      </div>
      <div class="lever-row" style="opacity:0.6;pointer-events:none">
        <label class="lever-label">Adjustable Arm</label>
        <div class="lever-track">
          <input type="range" class="lever-slider auto-slider" id="auto-lever-placeholder" disabled
            value="0" min="0" max="100" step="1">
          <div class="lever-thumb-label">0m</div>
        </div>
      </div>`;
      return `<div class="auto-page show auto-machine" id="auto-page">
        <div class="machine-frame">
          <div class="machine-scanline"></div>
          <div class="auto-scene-top">
            <div class="auto-timer" style="color:#d0e8ff">
              <span class="auto-timer-num" id="auto-timer">0.0</span><span class="auto-timer-unit">SECONDS</span>
              <div class="auto-timer-label">elapsed</div>
            </div>
            <div class="auto-scene-characters">
              <div class="auto-worker">
                <div class="auto-worker-hat"></div>
                <div class="auto-worker-head"></div>
                <div class="auto-worker-body"></div>
              </div>
              <div class="auto-arrow"><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div></div>
              <div class="auto-robot">
                <div class="auto-robot-head">
                  <div class="auto-robot-antenna"></div>
                  <div class="auto-robot-eye left"></div>
                  <div class="auto-robot-eye right"></div>
                  <div class="auto-robot-mouth"></div>
                </div>
                <div class="auto-robot-body"></div>
                <div class="auto-robot-arm left"></div>
                <div class="auto-robot-arm right"></div>
                <div class="auto-robot-wheel left"></div>
                <div class="auto-robot-wheel right"></div>
                <div class="auto-robot-shadow"></div>
              </div>
            </div>
            <div class="machine-specs">
              <span class="spec-item">⚡ ${era.automation.speed}ms/arm</span>
              <span class="spec-item">🔧 18× human</span>
              <span class="spec-item">⚖️ ±${era.scenarios[0].tolerance + 1}t·m</span>
            </div>
          </div>
          <p class="narrative auto-narr machine-narr">${era.automation.intro}</p>
          <div class="bridge-visual" id="auto-bridge">
            <div class="bridge-deck" id="auto-bridge-deck">
              <div class="arm-left" id="auto-arm-left"><div class="arm-fill" id="auto-arm-fill-left"></div></div>
              <div class="pier"></div>
              <div class="arm-right" id="auto-arm-right"><div class="arm-fill" id="auto-arm-fill-right"></div></div>
            </div>
            <div class="bridge-gap"></div>
            <div class="bridge-gap-right"></div>
          </div>
          <div class="machine-readout">
            <div class="torque-bars" id="auto-torque-bars">
              <div class="torque-side">
                <div class="torque-fill-wrap left">
                  <div class="torque-fill" id="auto-torque-fill-left"></div>
                </div>
                <span class="torque-val machine-val" id="auto-torque-val-left">0</span>
              </div>
              <div class="torque-label">MOMENT</div>
              <div class="torque-side">
                <div class="torque-fill-wrap right">
                  <div class="torque-fill" id="auto-torque-fill-right"></div>
                </div>
                <span class="torque-val machine-val" id="auto-torque-val-right">0</span>
              </div>
            </div>
            <div class="balance-gauge" id="auto-gauge">
              <div class="gauge-label">BALANCE</div>
              <div class="gauge-track">
                <div class="gauge-bubble" id="auto-gauge-bubble"></div>
              </div>
            </div>
          </div>
          <div class="machine-scene" id="auto-scene-label">Level 1 / ${era.scenarios.length}</div>
          <div class="lever-panel" id="auto-lever-panel">${leverHtml}</div>
          <div class="auto-status machine-status" id="auto-status">Mechanical calibration initiated…</div>
          <div class="auto-banner" id="auto-banner">
            <div class="auto-banner-inner">
              <div class="auto-banner-icon">⚖️</div>
              <div class="auto-banner-title">Cantilever Balance Complete</div>
              <div class="auto-banner-msg">${era.automation.message}</div>
              <button class="btn btn-ghost" onclick="Game.finishEra()">See what comes next →</button>
            </div>
          </div>
        </div>
      </div>`;
    }
    // Matching puzzle automation (Era 2+)
    if (era.puzzleType === "matching") {
      const cardHtml = era.scenarios.map(s => {
        const mat = era.materials.find(m => m.id === era.correctMatches[s.id]);
        return `<div class="auto-match-card" id="auto-${s.id}">
          <div class="match-icon">${s.icon}</div>
          <div class="match-title">${s.title}</div>
          <div class="match-result" id="auto-result-${s.id}">
            <span class="match-pending">⏳ awaiting…</span>
          </div>
        </div>`;
      }).join("");
      return `<div class="auto-page show" id="auto-page">
        <div class="auto-scene-top">
          <div class="auto-timer" style="color:#f0b878">
            <span class="auto-timer-num" id="auto-timer">0.0</span><span class="auto-timer-unit">SECONDS</span>
            <div class="auto-timer-label">elapsed</div>
          </div>
          <div class="auto-scene-characters">
            <div class="auto-worker">
              <div class="auto-worker-hat"></div>
              <div class="auto-worker-head"></div>
              <div class="auto-worker-body"></div>
            </div>
            <div class="auto-arrow"><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div></div>
            <div class="auto-robot">
              <div class="auto-robot-head">
                <div class="auto-robot-antenna"></div>
                <div class="auto-robot-eye left"></div>
                <div class="auto-robot-eye right"></div>
                <div class="auto-robot-mouth"></div>
              </div>
              <div class="auto-robot-body"></div>
              <div class="auto-robot-arm left"></div>
              <div class="auto-robot-arm right"></div>
              <div class="auto-robot-wheel left"></div>
              <div class="auto-robot-wheel right"></div>
              <div class="auto-robot-shadow"></div>
            </div>
          </div>
          <div class="era-badge" style="background:linear-gradient(135deg,#b06038,#8a4828);border-color:rgba(240,160,100,0.3);color:#ffe0b0">
            <span>⚙️</span> The Industrial Age</div>
          <div class="speed-tag" style="background:linear-gradient(135deg,#b06038,#8a4828);border-color:rgba(240,160,100,0.3);color:#ffe0b0">
            ⏱ ${era.automation.speed}ms per match — 15× faster</div>
        </div>
        <p class="narrative auto-narr">${era.automation.intro}</p>
        <div class="auto-match-grid">${cardHtml}</div>
        <div class="auto-status" id="auto-status">Conveyor belt engages…</div>
        <div class="auto-conveyor" id="auto-conveyor">
          <div class="conveyor-strip"></div>
          <div class="conveyor-roller left"></div>
          <div class="conveyor-roller right"></div>
        </div>
        <div class="robot-arm" id="robot-arm">
          <span class="hand-material" id="hand-material"></span>
          <div class="arm-gripper" id="arm-gripper">
            <div class="gripper-jaw left" id="jaw-left"></div>
            <div class="gripper-jaw right" id="jaw-right"></div>
          </div>
          <div class="arm-cable" id="arm-cable"></div>
          <div class="arm-joint"></div>
          <div class="arm-segment"></div>
          <div class="arm-joint"></div>
          <div class="arm-forearm"></div>
          <div class="arm-base">
            <div class="base-light"></div>
          </div>
        </div>
        <div class="auto-banner" id="auto-banner">
          <div class="auto-banner-inner">
            <div class="auto-banner-icon">⚙️</div>
            <div class="auto-banner-title">Material Sorting Complete</div>
            <div class="auto-banner-msg">${era.automation.message}</div>
            <button class="btn btn-ghost" onclick="Game.finishEra()">See what comes next →</button>
          </div>
        </div>
      </div>`;
    }
    // Blueprint puzzle automation (Era 4+)
    if (era.puzzleType === "blueprint") {
      return `<div class="auto-page show" id="auto-page">
        <div class="auto-scene-top">
          <div class="auto-timer" style="color:#80d0f0">
            <span class="auto-timer-num" id="auto-timer">0.0</span><span class="auto-timer-unit">SECONDS</span>
            <div class="auto-timer-label">elapsed</div>
          </div>
          <div class="auto-scene-characters">
            <div class="auto-worker">
              <div class="auto-worker-hat"></div>
              <div class="auto-worker-head"></div>
              <div class="auto-worker-body"></div>
            </div>
            <div class="auto-arrow"><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div></div>
            <div class="auto-robot">
              <div class="auto-robot-head">
                <div class="auto-robot-antenna"></div>
                <div class="auto-robot-eye left"></div>
                <div class="auto-robot-eye right"></div>
                <div class="auto-robot-mouth"></div>
              </div>
              <div class="auto-robot-body"></div>
              <div class="auto-robot-arm left"></div>
              <div class="auto-robot-arm right"></div>
              <div class="auto-robot-wheel left"></div>
              <div class="auto-robot-wheel right"></div>
              <div class="auto-robot-shadow"></div>
            </div>
          </div>
          <div class="era-badge" style="background:linear-gradient(135deg,#1a3a5a,#0a2a4a);border-color:rgba(80,180,240,0.3);color:#80d0f0">
            <span>💻</span> The Age of CAD</div>
          <div class="speed-tag" style="background:linear-gradient(135deg,#1a3a5a,#0a2a4a);border-color:rgba(80,180,240,0.2);color:#80d0f0">
            ⏱ ${era.automation.speed}ms per test — 12 combos brute-forced</div>
        </div>
        <p class="narrative auto-narr">${era.automation.intro}</p>
        <div class="bp-terminal" id="bp-terminal">
          <div class="bp-term-header"><span class="bp-term-dot r"></span><span class="bp-term-dot y"></span><span class="bp-term-dot g"></span><span class="bp-term-title">cad_sim.exe</span></div>
          <div class="bp-term-body" id="bp-term-body"></div>
          <div class="bp-term-cursor" id="bp-term-cursor">_</div>
        </div>
        <div class="auto-banner" id="auto-banner">
          <div class="auto-banner-inner">
            <div class="auto-banner-icon">💻</div>
            <div class="auto-banner-title">Optimal Design Found</div>
            <div class="auto-banner-msg">${era.automation.message}</div>
            <button class="btn btn-ghost" onclick="Game.finishEra()">See what comes next →</button>
          </div>
        </div>
      </div>`;
    }
    // Print puzzle automation (Era 5+)
    if (era.puzzleType === "print") {
      return renderPrintAutomation(era);
    }
    // Sequencing puzzle automation (Era 1)
    const slotHtml = era.pieces.map(p => {
      const autoId = "a" + p.slot.slice(1);
      return `<div class="stone-slot" id="${autoId}" data-slot="${autoId}"
        style="left:${p.x - p.w/2}%;top:${p.y - p.h/2}%;width:${p.w}%;height:${p.h}%;--r:${p.rot}deg"></div>`;
    }).join("");

    return `<div class="auto-page show" id="auto-page">
      <div class="auto-scene-top">
        <div class="auto-timer" style="color:#f0d090">
          <span class="auto-timer-num" id="auto-timer">0.0</span><span class="auto-timer-unit">SECONDS</span>
          <div class="auto-timer-label">elapsed</div>
        </div>
        <div class="auto-scene-characters">
          <div class="auto-worker">
            <div class="auto-worker-hat"></div>
            <div class="auto-worker-head"></div>
            <div class="auto-worker-body"></div>
          </div>
          <div class="auto-arrow"><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div></div>
          <div class="auto-robot">
            <div class="auto-robot-head">
              <div class="auto-robot-antenna"></div>
              <div class="auto-robot-eye left"></div>
              <div class="auto-robot-eye right"></div>
              <div class="auto-robot-mouth"></div>
            </div>
            <div class="auto-robot-body"></div>
            <div class="auto-robot-arm left"></div>
            <div class="auto-robot-arm right"></div>
            <div class="auto-robot-wheel left"></div>
            <div class="auto-robot-wheel right"></div>
            <div class="auto-robot-shadow"></div>
          </div>
        </div>
        <div class="era-badge" style="background:linear-gradient(135deg,#a07048,#805030);border-color:rgba(200,160,120,0.2);color:#f8e8d0">
          <span>🪨</span> The Age of Hands</div>
        <div class="speed-tag" style="background:linear-gradient(135deg,#a07048,#805030);border-color:rgba(200,160,120,0.2);color:#f8e8d0">
          ⏱ ${era.automation.speed}ms per stone — 12× faster</div>
      </div>
      <p class="narrative auto-narr">${era.automation.intro}</p>
      <div class="arch-stage auto-arch">${slotHtml}</div>
      <div class="auto-status" id="auto-status">Cold steel begins to move…</div>
      <div class="auto-banner" id="auto-banner">
        <div class="auto-banner-inner">
          <div class="auto-banner-icon">🧱</div>
          <div class="auto-banner-title">Arch Assembly Complete</div>
          <div class="auto-banner-msg">${era.automation.message}</div>
          <button class="btn btn-ghost" onclick="Game.finishEra()">See what comes next →</button>
        </div>
      </div>
    </div>`;
  }

  function renderEndOfDemo(era, hasNextEra) {
    const btnLabel = hasNextEra ? `Continue to Era ${era.id + 1} →` : "Replay from Era 1";
    const btnAction = hasNextEra ? "Game.nextEra()" : "Game.restart()";
    return `<div class="screen active" style="padding-top:50px">
      ${floatingHTML(era)}
      <div style="font-size:4rem;margin-bottom:10px">🚀</div>
      <h1>Era ${era.id} Complete</h1>
      <p class="subtitle">Humans built first. Machines copied faster.</p>
      <p class="narrative" style="max-width:460px">
        <strong>The Unbreakable Boundary</strong> continues across ${6 - era.id} more eras.<br>
        Each brings a harder challenge — until Era 6, where only human imagination can find the answer.
      </p>
      <button class="btn" onclick="${btnAction}">${btnLabel}</button>
    </div>`;
  }

  // ---- Sync Helpers ---- //

  function syncPicker(era, state) {
    era.pieces.forEach(p => {
      const btn = $(`pick-${p.id}`);
      if (!btn) return;
      btn.classList.toggle("placed", state.placed.has(p.id));
      btn.classList.toggle("selected", state.selected === p.id);
    });
  }

  function syncProgress(state) {
    const fill = $("prog-fill");
    if (fill) fill.style.width = `${(state.step / state.total) * 100}%`;
  }

  /** Fill a slot with placed stone (CSS-only stone shape, no emoji). */
  function fillSlot(slotId, icon, pieceId) {
    const el = $(slotId);
    if (!el) return;
    // Derive stone type + side from pieceId (e.g. "arch-l" → type="arch", dir="l")
    const parts = pieceId ? pieceId.split("-") : ["base"];
    const type = parts[0];
    el.innerHTML = "";
    el.setAttribute("data-stone", type);
    if (parts[1]) el.setAttribute("data-dir", parts[1]);
    else el.removeAttribute("data-dir");
    el.classList.add("filled", "correct");
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = "settle .5s cubic-bezier(.34,1.56,.64,1)";
  }

  function shakeSlot(slotId) {
    const el = $(slotId);
    if (!el) return;
    el.classList.remove("shake");
    void el.offsetHeight;
    el.classList.add("shake");
  }

  function showHint(msg) {
    const bar = $("hint-bar");
    if (!bar) return;
    bar.textContent = msg;
    bar.style.opacity = "1";
    clearTimeout(bar._hide);
    bar._hide = setTimeout(() => { if (bar) bar.style.opacity = ".6"; }, 2500);
  }

  function clearHint() {
    const bar = $("hint-bar");
    if (bar) bar.textContent = "";
  }

  /** Automation timeline — fills slots at speed intervals. */
  function runAutomationTimeline(era, onDone) {
    const order = era.order;
    const speed = era.automation.speed;
    let step = 0;
    let timerStart = performance.now();
    let timerRaf = null;

    function updateTimer() {
      const elapsed = (performance.now() - timerStart) / 1000;
      const el = document.getElementById("auto-timer");
      if (el) el.textContent = elapsed.toFixed(1);
      timerRaf = requestAnimationFrame(updateTimer);
    }
    updateTimer();

    const timer = setInterval(() => {
      if (step >= order.length) {
        clearInterval(timer);
        if (timerRaf) cancelAnimationFrame(timerRaf);
        const status = $("auto-status");
        if (status) {
          const elapsed = ((performance.now() - timerStart) / 1000).toFixed(1);
          status.textContent = "✅ Arch complete in " + elapsed + " seconds.";
          status.style.color = "#4ade80";
        }
        setTimeout(() => {
          const banner = $("auto-banner");
          if (banner) banner.style.display = "flex";
          if (onDone) onDone();
        }, 1500);
        return;
      }

      const pieceId = order[step];
      const piece = era.pieces.find(p => p.id === pieceId);
      if (!piece) { step++; return; }

      // Map s0→a0, s3→a3, etc.
      const autoId = "a" + piece.slot.slice(1);
      fillSlot(autoId, piece.icon, piece.id);

      const status = $("auto-status");
      if (status) status.textContent = `Assembling… ${step + 1}/${order.length}`;
      step++;
    }, speed);
  }

  // ================================================================
  //  CONVEYOR BELT — drag materials from belt into bins (Era 2+)
  // ================================================================

  function renderConveyorPuzzle(era) {
    const binHtml = era.scenarios.map(s =>
      `<div class="bin" id="bin-${s.id}" data-scenario="${s.id}">
        <div class="bin-icon">${s.icon}</div>
        <div class="bin-title">${s.title}</div>
        <div class="bin-desc">${s.desc}</div>
        <div class="bin-result" id="bin-result-${s.id}"></div>
      </div>`
    ).join("");

    return `<div class="screen active">
      ${floatingHTML(era)}
      <div class="era-badge" style="background:linear-gradient(135deg,#6a3a2a,#4a2a1a);border-color:rgba(200,120,80,0.2)">
        <span>${era.icon}</span> Era ${era.id} — ${era.label}</div>
      <h2>Sort the Materials</h2>
      <p class="subtitle">Drag each material from the conveyor belt to the matching bin</p>
      <div class="bins-row" id="bins-row">${binHtml}</div>
      <div class="conveyor-track" id="conveyor-track">
        <div class="belt-items" id="belt-items"></div>
      </div>
      <div class="hint-bar" id="hint-bar"></div>
      <div class="conveyor-status" id="conveyor-status"></div>
    </div>`;
  }

  // ================================================================
  //  BALANCED CANTILEVER BRIDGE — lever/slider controls (Era 3)
  // ================================================================

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
      ${floatingHTML(era)}
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

  // Bridge puzzle game state
  let _balanceCallbacks = null;
  let _balanceActive = false;
  let _balanceHoldTimer = null;
  const BALANCE_HOLD_MS = 500;
  let _fixedSide = null; // { side: "left"|"right", value: number } — random fixed arm

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

  /** Pick a random fixed side and value so the solution fits within the other arm's range. */
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

  // ================================================================
  //  CANTILEVER AUTOMATION — robot gantry extends arms
  // ================================================================

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

  // Belt state (managed by startConveyorBelt)
  let _beltTimers = [];
  let _beltDragged = null;
  let _beltDragOffset = { x: 0, y: 0 };
  let _beltCallbacks = null;
  let _beltActive = false;
  let _spawned = {}; // tracks spawned material types on belt

  function startConveyorBelt(era, state, callbacks) {
    _beltCallbacks = callbacks;
    _beltActive = true;
    const track = document.getElementById("conveyor-track");
    const container = document.getElementById("belt-items");
    if (!track || !container) return;

    // Clear any previous state
    stopConveyorBelt();
    _beltActive = true;

    // Spawn loop: tries to keep 2-4 items on belt
    function scheduleSpawn() {
      if (!_beltActive) return;
      const t = setTimeout(() => {
        spawnItem();
        scheduleSpawn();
      }, 1800 + Math.random() * 2200);
      _beltTimers.push(t);
    }

    function spawnItem() {
      if (!_beltActive) return;
      const used = Object.values(state.matched);
      const available = era.materials.filter(m => !used.includes(m.id));
      if (available.length === 0) return;

      const mat = available[Math.floor(Math.random() * available.length)];
      // Limit duplicates on belt
      const onBelt = Array.from(container.children).map(el => el.dataset.matId);
      const count = onBelt.filter(id => id === mat.id).length;
      if (count >= 2) return;

      const el = document.createElement("div");
      el.className = "belt-item";
      el.dataset.matId = mat.id;
      el.innerHTML =
        `<span class="belt-icon">${mat.icon}</span>` +
        `<span class="belt-label">${mat.label}</span>`;
      // Spread items across vertical lanes so they don't overlap
      el.style.top = (15 + Math.floor(Math.random() * 60)) + "%";
      el.style.animationDuration = (5 + Math.random() * 3) + "s";
      container.appendChild(el);

      // Remove when animation ends (off-screen right)
      const onEnd = () => {
        if (el !== _beltDragged) el.remove();
      };
      el.addEventListener("animationend", onEnd, { once: true });
    }

    scheduleSpawn();
    // Spawn a couple immediately so belt isn't empty
    setTimeout(spawnItem, 100);
    setTimeout(spawnItem, 600);

    // ---- Pointer-based drag (press-then-drag, mouse + touch) ---- //
    const DRAG_THRESHOLD = 6; // px movement before drag activates
    let _beltPending = null;   // item waiting for press threshold
    let _beltStartPos = null;  // start position for threshold check

    function getPos(e) {
      const ev = e.touches ? e.touches[0] || e.changedTouches[0] : e;
      return { x: ev.clientX, y: ev.clientY };
    }

    function activateDrag(item, pos) {
      const rect = item.getBoundingClientRect();
      _beltDragOffset.x = pos.x - rect.left;
      _beltDragOffset.y = pos.y - rect.top;
      const { left, top, width } = rect;
      item.style.animation = "none";
      item.style.position = "fixed";
      item.style.left = left + "px";
      item.style.top = top + "px";
      item.style.width = width + "px";
      item.style.zIndex = 1000;
      item.classList.remove("pressing");
      item.classList.add("grabbed");
      _beltDragged = item;
    }

    function onPointerDown(e) {
      const item = e.target.closest(".belt-item");
      if (!item || _beltDragged || !_beltActive) return;
      e.preventDefault();
      _beltPending = item;
      _beltStartPos = getPos(e);
      item.classList.add("pressing");
    }

    function onPointerMove(e) {
      // Check press threshold
      if (_beltPending && !_beltDragged) {
        const pos = getPos(e);
        const dx = pos.x - _beltStartPos.x;
        const dy = pos.y - _beltStartPos.y;
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          activateDrag(_beltPending, _beltStartPos);
          _beltPending = null;
        }
      }
      if (!_beltDragged) return;
      e.preventDefault();
      const pos = getPos(e);
      _beltDragged.style.left = (pos.x - _beltDragOffset.x) + "px";
      _beltDragged.style.top = (pos.y - _beltDragOffset.y) + "px";

      // Highlight bin under cursor — hide item so elementFromPoint sees through
      document.querySelectorAll(".bin.drag-over").forEach(b => b.classList.remove("drag-over"));
      _beltDragged.style.visibility = "hidden";
      const below = document.elementFromPoint(pos.x, pos.y);
      _beltDragged.style.visibility = "";
      if (below) {
        const bin = below.closest(".bin");
        if (bin) bin.classList.add("drag-over");
      }
    }

    function onPointerUp(e) {
      // Press released before drag threshold — cancel
      if (_beltPending) {
        _beltPending.classList.remove("pressing");
        _beltPending = null;
        return;
      }
      if (!_beltDragged) return;
      const item = _beltDragged;
      _beltDragged = null;

      const pos = e.changedTouches ? { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY } : getPos(e);

      // Find bin — hide item so elementFromPoint finds the bin underneath
      document.querySelectorAll(".bin.drag-over").forEach(b => b.classList.remove("drag-over"));
      item.style.visibility = "hidden";
      const below = document.elementFromPoint(pos.x, pos.y);
      item.style.visibility = "";
      const bin = below ? below.closest(".bin") : null;

      if (bin) {
        const scenarioId = bin.dataset.scenario;
        const materialId = item.dataset.matId;
        item.remove();
        if (_beltCallbacks && _beltCallbacks.onDrop) {
          _beltCallbacks.onDrop(materialId, scenarioId);
        }
      } else {
        // Dropped outside a bin — return item to belt
        item.style.position = "";
        item.style.left = "";
        item.style.top = "";
        item.style.width = "";
        item.style.zIndex = "";
        item.classList.remove("grabbed");
        const container2 = document.getElementById("belt-items");
        if (container2) {
          const clone = item.cloneNode(true);
          clone.style.animation = "none";
          clone.style.top = (15 + Math.floor(Math.random() * 60)) + "%";
          container2.removeChild(item);
          container2.appendChild(clone);
          void clone.offsetHeight;
          clone.style.animation = "";
          clone.style.animationDuration = (5 + Math.random() * 3) + "s";
        }
      }
    }

    // Bind events
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("mouseup", onPointerUp);
    document.addEventListener("touchstart", onPointerDown, { passive: false });
    document.addEventListener("touchmove", onPointerMove, { passive: false });
    document.addEventListener("touchend", onPointerUp);

    _beltTimers._handlers = { onPointerDown, onPointerMove, onPointerUp };
  }

  function stopConveyorBelt() {
    _beltActive = false;
    _beltDragged = null;
    _beltTimers.forEach(t => {
      if (typeof t === "number") clearTimeout(t);
    });
    const h = _beltTimers._handlers;
    if (h) {
      document.removeEventListener("mousedown", h.onPointerDown);
      document.removeEventListener("mousemove", h.onPointerMove);
      document.removeEventListener("mouseup", h.onPointerUp);
      document.removeEventListener("touchstart", h.onPointerDown);
      document.removeEventListener("touchmove", h.onPointerMove);
      document.removeEventListener("touchend", h.onPointerUp);
    }
    _beltTimers = [];
    // Clear remaining belt items
    const container = document.getElementById("belt-items");
    if (container) container.innerHTML = "";
  }

  /** Mark a bin as correctly filled. */
  function fillBin(scenarioId, materialLabel) {
    const bin = $(`bin-${scenarioId}`);
    const result = $(`bin-result-${scenarioId}`);
    if (!bin || !result) return;
    bin.classList.add("correct-drop", "matched");
    result.innerHTML = `<span class="bin-filled">✓ ${materialLabel}</span>`;
  }

  /** Shake a bin on wrong drop. */
  function shakeBin(scenarioId) {
    const bin = $(`bin-${scenarioId}`);
    if (!bin) return;
    bin.classList.remove("wrong-drop");
    void bin.offsetHeight;
    bin.classList.add("wrong-drop");
    setTimeout(() => bin.classList.remove("wrong-drop"), 400);
  }

  /** Matching automation — robot arm picks from conveyor, places on card. */
  function runMatchingAutomation(era) {
    const arm = document.getElementById("robot-arm");
    const cable = document.getElementById("arm-cable");
    const matEl = document.getElementById("hand-material");
    const jawL = document.getElementById("jaw-left");
    const jawR = document.getElementById("jaw-right");
    if (!arm || !cable || !matEl) return;

    const speed = era.automation.speed;
    const scenarios = era.scenarios;
    let step = 0;
    let timerStart = performance.now();
    let timerRaf = null;

    // Measure fixed arm overhead (everything above the cable + below the cable)
    const ARM_OVERHEAD = 160; // approx total fixed px: base+forearm+joints+segment+gripper

    function setCable(h) { cable.style.height = Math.max(h, 0) + "px"; }
    function setArmX(x) { arm.style.left = x + "px"; }
    function openJaws()  { jawL.classList.add("open"); jawR.classList.add("open"); }
    function closeJaws() { jawL.classList.remove("open"); jawR.classList.remove("open"); }
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

    function doStep() {
      if (step >= scenarios.length) {
        setCable(0); closeJaws();
        arm.style.transition = "opacity 0.4s";
        arm.style.opacity = "0";
        setTimeout(() => { arm.style.display = "none"; }, 400);
        const elapsed = ((performance.now() - timerStart) / 1000).toFixed(1);
        setStatus("✅ All materials sorted in " + elapsed + " seconds.", "#4ade80");
        setTimeout(showMsgAndBtn, 1200);
        return;
      }

      const s = scenarios[step];
      const matId = era.correctMatches[s.id];
      const mat = era.materials.find(m => m.id === matId);
      const card = document.getElementById("auto-" + s.id);
      if (!card) { step++; doStep(); return; }

      const armRect = arm.getBoundingClientRect();
      const armBottom = armRect.bottom;

      const conv = document.getElementById("auto-conveyor");
      const convRect = conv ? conv.getBoundingClientRect() : null;
      const beltCenterX = convRect ? convRect.left + convRect.width / 2 : window.innerWidth / 2;
      const beltTop = convRect ? convRect.top : armBottom - 100;

      const cardRect = card.getBoundingClientRect();
      const cardCX = cardRect.left + cardRect.width / 2;
      const cardTop = cardRect.top;

      const icon = mat ? mat.icon : "❓";
      const label = mat ? mat.label : matId;

      // Cable length = armBottom − targetTop − fixed overhead
      const cableToBelt = Math.max(armBottom - beltTop - ARM_OVERHEAD, 8);
      const cableToCard = Math.max(armBottom - cardTop - ARM_OVERHEAD, 8);

      setStatus(`🤖 Picking ${label} from belt…`);

      // Step 1: move arm above belt, cable retracted, jaws open
      setArmX(beltCenterX);
      setCable(0);
      openJaws();
      matEl.textContent = "";
      matEl.style.opacity = "0";

      setTimeout(() => {
        // Step 2: cable extends down to belt
        setCable(cableToBelt);

        setTimeout(() => {
          // Step 3: grab — jaws close, material appears
          closeJaws();
          matEl.textContent = icon;
          matEl.style.opacity = "1";

          setTimeout(() => {
            // Step 4: retract cable
            setCable(0);

            setTimeout(() => {
              // Step 5: slide to target card
              setArmX(cardCX);
              setStatus(`🤖 Carrying ${label} → ${s.title}`);

              setTimeout(() => {
                // Step 6: extend to card
                setCable(cableToCard);

                setTimeout(() => {
                  // Step 7: open jaws, drop, card fills
                  openJaws();
                  matEl.style.opacity = "0";
                  const resultEl = document.getElementById("auto-result-" + s.id);
                  if (resultEl) {
                    resultEl.innerHTML = `<span class="match-filled">⚙️ ${label}</span>`;
                  }
                  setStatus(`✅ ${label} → ${s.title}  (${step + 1}/${scenarios.length})`);

                  setTimeout(() => {
                    // Step 8: retract, next
                    setCable(0); closeJaws();
                    step++;
                    setTimeout(doStep, speed);
                  }, 250);
                }, 350);
              }, 500);
            }, 300);
          }, 250);
        }, 400);
      }, 500);
    }

    // Start
    setArmX(-100);
    setCable(0);
    closeJaws();
    timerStart = performance.now();
    updateTimer();
    setTimeout(doStep, 400);
  }

  // ================================================================
  //  BLUEPRINT SIMULATOR — toggle parameters + simulation (Era 4+)
  // ================================================================

  function renderBlueprintPuzzle(era, state) {
    const sc = BPE.getScenario(state, era);
    if (!sc) return "<div>No scenario</div>";

    function paramRow(param) {
      const sels = BPE.getSelections(state, sc.id);
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
      ${floatingHTML(era)}
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

  // ================================================================
  //  PRINT PUZZLE — Material Synthesizer + 3D Printer (Era 5+)
  // ================================================================

  function renderPrintPuzzle(era, state) {
    const sc = PR.getScenario(state, era);
    if (!sc) return "<div>No scenario</div>";
    const ch = PR.getChamber(state, sc.id);

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
      ${floatingHTML(era)}
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
          <div class="pr-pressure-gauge" id="pr-pressure-gauge" style="display:none">
            <div class="pr-pressure-label">Hold to bond...</div>
            <div class="pr-pressure-track">
              <div class="pr-pressure-sweet" id="pr-pressure-sweet"></div>
              <div class="pr-pressure-fill" id="pr-pressure-fill"></div>
            </div>
            <div class="pr-pressure-readout" id="pr-pressure-readout">0%</div>
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
            <div class="auto-worker-head"></div>
            <div class="auto-worker-body"></div>
          </div>
          <div class="auto-arrow"><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div><div class="auto-arrow-dot"></div></div>
          <div class="auto-robot">
            <div class="auto-robot-head">
              <div class="auto-robot-antenna"></div>
              <div class="auto-robot-eye left"></div>
              <div class="auto-robot-eye right"></div>
              <div class="auto-robot-mouth"></div>
            </div>
            <div class="auto-robot-body"></div>
            <div class="auto-robot-arm left"></div>
            <div class="auto-robot-arm right"></div>
            <div class="auto-robot-wheel left"></div>
            <div class="auto-robot-wheel right"></div>
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
    renderIntro, renderNarrative, renderPuzzle,
    renderCelebration, renderAutomation, renderEndOfDemo,
    syncPicker, syncProgress, fillSlot, shakeSlot, showHint, clearHint,
    runAutomationTimeline,
    // Conveyor belt puzzle exports
    renderConveyorPuzzle,
    startConveyorBelt, stopConveyorBelt,
    fillBin, shakeBin,
    runMatchingAutomation,
    // Crane balance puzzle exports
    renderBalancePuzzle,
    startBalanceGame, stopBalanceGame,
    runBalanceAutomation,
    // Blueprint simulator exports
    renderBlueprintPuzzle,
    showBlueprintSuccess, showBlueprintFailure,
    runBlueprintAutomation,
    // Print puzzle exports
    renderPrintPuzzle,
    showPrintSuccess, showPrintFailure,
    renderPrintAutomation, runPrintAutomation
  };
})();

window.UIRenderer = UIRenderer;