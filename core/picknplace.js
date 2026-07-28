window.PickNPlace = (() => {
  const LP_DELAY = 400;
  const LP_THRESHOLD = 10;

  let _cfg = null;
  let _sel = null;          // currently selected item id
  let _drag = {};           // HTML5 drag state
  let _lp = {};             // long-press state
  let _zoneTap = null;      // zone touch tap state

  function getItemId(el) {
    if (!el || !_cfg) return null;
    return _cfg.getItemId ? _cfg.getItemId(el) : (el.dataset.pieceId || el.dataset.matId || null);
  }

  function getSlotId(el) {
    if (!el || !_cfg) return null;
    return _cfg.getSlotId ? _cfg.getSlotId(el) : (el.dataset.pnpSlot || el.dataset.slotId || el.id || null);
  }

  function findSlot(el) {
    return el ? el.closest(_cfg.slotItemSelector || '[data-pnp-slot]') : null;
  }

  function selectItem(id) {
    _sel = id;
    if (_cfg.onSelect) _cfg.onSelect(id);
  }

  function placeItem(itemId, slotId) {
    if (!_cfg || !_cfg.onPlace) return;
    _cfg.onPlace(itemId, slotId);
    _sel = null;
  }

  function clearSel() {
    _sel = null;
  }

  function getGhost(icon) {
    const g = document.createElement("div");
    g.className = "pnp-ghost";
    g.textContent = icon || "?";
    Object.assign(g.style, {
      position: "fixed", zIndex: 99999, pointerEvents: "none",
      width: "44px", height: "44px", borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: "1.4rem",
      background: "radial-gradient(circle at 35% 35%, rgba(255,220,160,0.95), rgba(200,150,80,0.9))",
      border: "2px solid rgba(255,200,100,0.5)",
      boxShadow: "0 3px 12px rgba(0,0,0,0.35), 0 0 20px rgba(255,200,100,0.15)",
      left: "-200px", top: "-200px",
      transition: "none"
    });
    document.body.appendChild(g);
    return g;
  }

  // ── Desktop HTML5 Drag ──
  function onDragStart(e) {
    const el = e.target.closest(_cfg.pickerItemSelector);
    if (!el) return;
    const id = getItemId(el);
    if (!id) return;
    _drag.itemId = id;
    _drag.ghost = getGhost(_cfg.getIcon ? _cfg.getIcon(el) : id);
    e.dataTransfer.setDragImage(_drag.ghost, 22, 22);
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("text/plain", id);
    if (_cfg.onDragStart) _cfg.onDragStart(id, el);
  }

  function onDragEnd() {
    if (_drag.ghost) { _drag.ghost.remove(); _drag.ghost = null; }
    _drag.itemId = null;
    if (_cfg.onDragEnd) _cfg.onDragEnd();
  }

  function onDragOver(e) {
    const zone = e.target.closest(_cfg.dropZoneSelector);
    if (!zone) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    zone.classList.add("pnp-drag-over");
  }

  function onDragLeave(e) {
    const zone = e.target.closest(_cfg.dropZoneSelector);
    if (zone) zone.classList.remove("pnp-drag-over");
  }

  function onDrop(e) {
    const zone = e.target.closest(_cfg.dropZoneSelector);
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove("pnp-drag-over");
    const id = e.dataTransfer.getData("text/plain") || _drag.itemId;
    if (!id) return;
    // Find the specific slot under the cursor
    const slot = findSlot(e.target);
    const slotId = slot ? getSlotId(slot) : getSlotId(zone);
    selectItem(id);
    placeItem(id, slotId || "drop");
  }

  // ── Desktop Click ──
  function onClick(e) {
    const el = e.target.closest(_cfg.pickerItemSelector);
    if (el) {
      const id = getItemId(el);
      if (!id) return;
      selectItem(id);
      if (_cfg.onClick) _cfg.onClick(id, el);
      return;
    }
    // Click on slot inside drop zone — place selected item
    const slot = findSlot(e.target);
    if (slot && _sel) {
      const slotId = getSlotId(slot);
      if (slotId) placeItem(_sel, slotId);
    }
  }

  // ── Touch Long-Press Drag + Tap (picker items) ──
  function onTouchStart(e) {
    const el = e.target.closest(_cfg.pickerItemSelector);
    if (!el) return;
    const id = getItemId(el);
    if (!id) return;
    const t = e.touches[0];
    _lp = {
      timer: setTimeout(() => {
        if (_lp.moved) return;
        _lp.isDragging = true;
        const icon = _cfg.getIcon ? _cfg.getIcon(el) : id;
        _lp.ghost = getGhost(icon);
      }, LP_DELAY),
      startX: t.clientX, startY: t.clientY,
      isDragging: false, moved: false,
      card: el, materialId: id, ghost: null
    };
  }

  function onTouchMove(e) {
    if (!_lp.card) return;
    const t = e.touches[0];
    const dx = t.clientX - _lp.startX;
    const dy = t.clientY - _lp.startY;
    if (_lp.isDragging) {
      e.preventDefault();
      if (_lp.ghost) {
        _lp.ghost.style.left = (t.clientX - 22) + "px";
        _lp.ghost.style.top = (t.clientY - 22) + "px";
      }
      return;
    }
    if (dx * dx + dy * dy > LP_THRESHOLD * LP_THRESHOLD) {
      _lp.moved = true;
      clearTimeout(_lp.timer);
    }
  }

  function onTouchEnd(e) {
    if (!_lp.card) return;
    const t = e.changedTouches[0];
    if (_lp.isDragging) {
      if (_lp.ghost) _lp.ghost.remove();
      const drop = document.elementFromPoint(t.clientX, t.clientY);
      const zone = drop ? drop.closest(_cfg.dropZoneSelector) : null;
      if (zone) {
        const slot = findSlot(drop);
        const slotId = slot ? getSlotId(slot) : getSlotId(zone);
        selectItem(_lp.materialId);
        placeItem(_lp.materialId, slotId || "drop");
      }
    } else if (!_lp.moved) {
      // Tap — select and show prompt
      selectItem(_lp.materialId);
      if (_cfg.onTap) _cfg.onTap(_lp.materialId, _lp.card);
    }
    cleanupLP();
  }

  function onTouchCancel() { cleanupLP(); }

  function cleanupLP() {
    clearTimeout(_lp.timer);
    if (_lp.ghost) _lp.ghost.remove();
    _lp = {};
  }

  // ── Touch on drop zone slots (tap to place) ──
  function onZoneTouchStart(e) {
    const slot = findSlot(e.target);
    if (!slot) return;
    const t = e.touches[0];
    _zoneTap = {
      slot,
      slotId: getSlotId(slot),
      startX: t.clientX,
      startY: t.clientY
    };
  }

  function onZoneTouchEnd(e) {
    if (!_zoneTap || !_sel) { _zoneTap = null; return; }
    const t = e.changedTouches[0];
    const dx = t.clientX - _zoneTap.startX;
    const dy = t.clientY - _zoneTap.startY;
    if (dx * dx + dy * dy < LP_THRESHOLD * LP_THRESHOLD) {
      e.preventDefault();
      placeItem(_sel, _zoneTap.slotId);
    }
    _zoneTap = null;
  }

  function onZoneTouchCancel() { _zoneTap = null; }

  function setupListeners() {
    const items = document.querySelector(_cfg.pickerContainer) || document;
    const dropZone = document.querySelector(_cfg.dropZoneSelector);

    // Desktop drag — set draggable on picker items
    items.querySelectorAll(_cfg.pickerItemSelector).forEach(el => el.setAttribute("draggable", "true"));

    items.addEventListener("dragstart", onDragStart);
    items.addEventListener("dragend", onDragEnd);

    if (dropZone) {
      dropZone.addEventListener("dragover", onDragOver);
      dropZone.addEventListener("dragleave", onDragLeave);
      dropZone.addEventListener("drop", onDrop);
    }

    // Desktop click (picker items + slots)
    (items).addEventListener("click", onClick);
    if (dropZone) dropZone.addEventListener("click", onClick);

    // Touch on picker items
    items.addEventListener("touchstart", onTouchStart, { passive: true });
    items.addEventListener("touchmove", onTouchMove, { passive: false });
    items.addEventListener("touchend", onTouchEnd);
    items.addEventListener("touchcancel", onTouchCancel);

    // Touch on drop zone slots
    if (dropZone) {
      dropZone.addEventListener("touchstart", onZoneTouchStart, { passive: true });
      dropZone.addEventListener("touchend", onZoneTouchEnd);
      dropZone.addEventListener("touchcancel", onZoneTouchCancel);
    }
  }

  function teardownListeners() {
    const items = document.querySelector(_cfg.pickerContainer) || document;
    const dropZone = document.querySelector(_cfg.dropZoneSelector);

    items.removeEventListener("dragstart", onDragStart);
    items.removeEventListener("dragend", onDragEnd);
    if (dropZone) {
      dropZone.removeEventListener("dragover", onDragOver);
      dropZone.removeEventListener("dragleave", onDragLeave);
      dropZone.removeEventListener("drop", onDrop);
    }
    items.removeEventListener("click", onClick);
    if (dropZone) dropZone.removeEventListener("click", onClick);
    items.removeEventListener("touchstart", onTouchStart);
    items.removeEventListener("touchmove", onTouchMove);
    items.removeEventListener("touchend", onTouchEnd);
    items.removeEventListener("touchcancel", onTouchCancel);
    if (dropZone) {
      dropZone.removeEventListener("touchstart", onZoneTouchStart);
      dropZone.removeEventListener("touchend", onZoneTouchEnd);
      dropZone.removeEventListener("touchcancel", onZoneTouchCancel);
    }
    cleanupLP();
    _drag = {};
    _zoneTap = null;
  }

  // ── Public API ──
  function setup(config) {
    teardownListeners();
    _cfg = Object.assign({
      pickerContainer: null,
      pickerItemSelector: ".pnp-item",
      slotItemSelector: null,
      dropZoneSelector: ".pnp-drop",
      getItemId: null,
      getSlotId: null,
      getIcon: null,
      onSelect: null,
      onPlace: null,
      onClick: null,
      onTap: null,
      onDragStart: null,
      onDragEnd: null
    }, config);
    _sel = null;
    setupListeners();
  }

  function destroy() {
    teardownListeners();
    _cfg = null;
    _sel = null;
  }

  function getSelected() { return _sel; }

  return { setup, destroy, getSelected };
})();
