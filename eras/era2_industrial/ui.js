Object.assign(window.UIRenderer, (() => {
  const $ = id => document.getElementById(id);
  let _beltCallbacks = null;
  let _beltActive = false;
  let _beltTimers = [];
  let _beltDragged = null;
  let _beltDragOffset = {};

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
      ${window.UIRenderer.floatingHTML(era)}
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

  function fillBin(scenarioId, materialLabel) {
    const bin = $(`bin-${scenarioId}`);
    const result = $(`bin-result-${scenarioId}`);
    if (!bin || !result) return;
    bin.classList.add("correct-drop", "matched");
    result.innerHTML = `<span class="bin-filled">✓ ${materialLabel}</span>`;
  }

  function shakeBin(scenarioId) {
    const bin = $(`bin-${scenarioId}`);
    if (!bin) return;
    bin.classList.remove("wrong-drop");
    void bin.offsetHeight;
    bin.classList.add("wrong-drop");
    setTimeout(() => bin.classList.remove("wrong-drop"), 400);
  }

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
                    resultEl.innerHTML = `<span class="match-filled">${icon} ${label}</span>`;
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

  return {
    renderConveyorPuzzle, startConveyorBelt, stopConveyorBelt, fillBin, shakeBin, runMatchingAutomation
  };
})());
