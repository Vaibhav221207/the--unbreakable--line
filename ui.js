/**
 * UIRenderer — All DOM rendering templates and visual helpers.
 * Generates HTML strings and syncs UI state with puzzle engine.
 */
const UIRenderer = (() => {
  const $ = id => document.getElementById(id);

  // ---- Screen Templates ---- //

  function renderIntro(era) {
    return `<div class="screen active">
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
      <div style="font-size:3.5rem;margin-bottom:12px">${emoji}</div>
      <h2>${era.celebration.title}</h2>
      <p>${era.celebration.text}</p>
      <button class="btn" onclick="Game.showAutomation()" style="margin-top:14px">${era.celebration.btn || "Decades Later… →"}</button>
    </div>`;
  }

  // ---- Automation: cold/sterile full page rebuild ---- //
  function renderAutomation(era) {
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
      return `<div class="auto-page show" id="auto-page" style="background:linear-gradient(170deg,#1a0e08 0%,#2a1810 40%,#3a2218 100%)">
        <div style="font-size:4rem;margin-bottom:10px">🤖🏭</div>
        <div class="era-badge" style="background:linear-gradient(135deg,#6a3a2a,#4a2a1a);border-color:rgba(200,120,80,0.2)">
          <span>⚙️</span> The Machine Age</div>
        <p class="narrative auto-narr">${era.automation.intro}</p>
        <div class="speed-tag" style="background:linear-gradient(135deg,#6a3a2a,#4a2a1a);border-color:rgba(200,120,80,0.2)">
          ⏱ ${era.automation.speed}ms per match — 15× faster than human</div>
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
        <div class="auto-msg" id="auto-msg" style="display:none">${era.automation.message}</div>
        <button class="btn btn-sm btn-ghost" id="auto-finish" style="display:none;margin-top:16px" onclick="Game.finishEra()">See what comes next →</button>
      </div>`;
    }
    // Sequencing puzzle automation (Era 1)
    const slotHtml = era.pieces.map(p => {
      const autoId = "a" + p.slot.slice(1);
      return `<div class="stone-slot" id="${autoId}" data-slot="${autoId}"
        style="left:${p.x - p.w/2}%;top:${p.y - p.h/2}%;width:${p.w}%;height:${p.h}%;--r:${p.rot}deg"></div>`;
    }).join("");

    return `<div class="auto-page show" id="auto-page">
      <div style="font-size:4rem;margin-bottom:10px">🤖⚙️</div>
      <div class="era-badge" style="background:linear-gradient(135deg,#3a5a7a,#2a4a6a);border-color:rgba(100,150,200,0.1)">
        <span>⚙️</span> The Machine Age</div>
      <p class="narrative auto-narr">${era.automation.intro}</p>
      <div class="speed-tag">⏱ ${era.automation.speed}ms per stone — 12× faster than human</div>
      <div class="arch-stage auto-arch">${slotHtml}</div>
      <div class="auto-status" id="auto-status">Cold steel begins to move…</div>
      <div class="auto-msg" id="auto-msg" style="display:none">${era.automation.message}</div>
      <button class="btn btn-sm btn-ghost" id="auto-finish" style="display:none;margin-top:16px" onclick="Game.finishEra()">See what comes next →</button>
    </div>`;
  }

  function renderEndOfDemo(era, hasNextEra) {
    const btnLabel = hasNextEra ? `Continue to Era ${era.id + 1} →` : "Replay from Era 1";
    const btnAction = hasNextEra ? "Game.nextEra()" : "Game.restart()";
    return `<div class="screen active" style="padding-top:50px">
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

    const timer = setInterval(() => {
      if (step >= order.length) {
        clearInterval(timer);
        const status = $("auto-status");
        if (status) {
          status.textContent = "✅ Arch complete. 1.12 seconds.";
          status.style.color = "#4ade80";
        }
        setTimeout(() => {
          const msg = $("auto-msg");
          if (msg) msg.style.display = "block";
          const btn = $("auto-finish");
          if (btn) btn.style.display = "inline-flex";
          if (onDone) onDone();
        }, 1200);
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
      const m = document.getElementById("auto-msg"); if (m) m.style.display = "block";
      const b = document.getElementById("auto-finish"); if (b) b.style.display = "inline-flex";
    }

    function doStep() {
      if (step >= scenarios.length) {
        setCable(0); closeJaws();
        arm.style.transition = "opacity 0.4s";
        arm.style.opacity = "0";
        setTimeout(() => { arm.style.display = "none"; }, 400);
        setStatus("✅ All materials sorted. 0.38 seconds.", "#4ade80");
        setTimeout(showMsgAndBtn, 800);
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
    setTimeout(doStep, 400);
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
    runMatchingAutomation
  };
})();

window.UIRenderer = UIRenderer;