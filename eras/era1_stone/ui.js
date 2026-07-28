Object.assign(window.UIRenderer, (() => {
  const $ = id => document.getElementById(id);

  function renderPuzzle(era) {
    // Generate positioned stone slots — x,y,w,h as percentages of parent
    const slotHtml = era.pieces.map(p => {
      return `<div class="stone-slot" id="${p.slot}" data-pnp-slot="${p.slot}" data-slot="${p.slot}"
        style="left:${p.x - p.w/2}%;top:${p.y - p.h/2}%;width:${p.w}%;height:${p.h}%;--r:${p.rot}deg"></div>`;
    }).join("");

    // Picker grid — shape preview per type
    const pickerHtml = era.pieces.map(p =>
      `<button class="pick-btn pnp-item" id="pick-${p.id}" data-pnp-id="${p.id}" data-type="${p.type}">
        <div class="shape-preview shape-${p.type}"></div>
        <span>${p.label}</span>
      </button>`
    ).join("");

    return `<div class="screen active">
      ${window.UIRenderer.floatingHTML(era)}
      <div class="era-badge"><span>🪨</span> Era ${era.id} — ${era.label}</div>
      <h2>Build the Arch</h2>
      <div class="arch-stage pnp-drop" id="arch-stage">
        ${slotHtml}
      </div>
      <div class="progress-track"><div class="progress-fill" id="prog-fill"></div></div>
      <div class="hint-bar" id="hint-bar"></div>
      <div class="material-picker">
        <h3>🔨 Quarry</h3>
        <div class="picker-grid">${pickerHtml}</div>
        <div class="pick-hint">Drag a stone onto the arch, or tap one then tap its slot</div>
      </div>
    </div>`;
  }

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

  return {
    renderPuzzle, syncPicker, syncProgress, fillSlot, shakeSlot, runAutomationTimeline
  };
})());
