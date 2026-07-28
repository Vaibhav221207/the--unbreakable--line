window.UIRenderer = (() => {
  const $ = id => document.getElementById(id);

  function floatingHTML(era) {
    const shapeSets = {
      1: ["rock","spark","leaf","rock","spark","leaf"],
      2: ["gear","bolt","smoke","gear","rivet","bolt"],
      3: ["beam","hex","dot","beam","hex","dot"],
      5: ["dot","hex","spark","dot","hex","spark"],
      6: ["leaf","dot","leaf","dot","leaf","dot"]
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
      <button class="btn" onclick="Game.launchPuzzle()">${era.narrative.btn || "Start Building"}</button>
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
      return window.UIRenderer.renderPrintAutomation(era);
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

  return {
    floatingHTML, renderIntro, renderNarrative, renderCelebration, renderAutomation, renderEndOfDemo, showHint, clearHint
  };
})();
