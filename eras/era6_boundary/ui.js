Object.assign(window.UIRenderer, (() => {
  function renderBoundaryScreen1(era) {
    return `<div class="screen active bnd-screen">
      <div class="bnd-screen-inner">
        <div class="bnd-badge">🤖 Automation Complete</div>
        <div class="bnd-speed-badge">⏱ 0.22s per layer — 4 iterations</div>

        <div class="bnd-build-scene">
          <div class="bnd-build-arm">
            <div class="bnd-build-arm-rail"></div>
            <div class="bnd-build-arm-carriage">
              <div class="bnd-build-arm-head"></div>
              <div class="bnd-build-arm-nozzle"></div>
            </div>
          </div>
          <div class="bnd-build-laser"></div>
          <div class="bnd-build-sparks">
            <div class="bnd-spark s1"></div>
            <div class="bnd-spark s2"></div>
            <div class="bnd-spark s3"></div>
            <div class="bnd-spark s4"></div>
            <div class="bnd-spark s5"></div>
            <div class="bnd-spark s6"></div>
          </div>
          <div class="bnd-build-house">
            <div class="bnd-build-foundation"></div>
            <div class="bnd-build-wall left"></div>
            <div class="bnd-build-wall right"></div>
            <div class="bnd-build-roof"></div>
            <div class="bnd-build-door"></div>
            <div class="bnd-build-window"></div>
            <div class="bnd-build-chimney"></div>
          </div>
          <div class="bnd-build-glow-ring"></div>
          <div class="bnd-build-ground"></div>
        </div>

        <p class="bnd-line bnd-fade" style="animation-delay:5s">Automation handles the technical build.</p>
        <p class="bnd-line bnd-fade" style="animation-delay:5.7s">Fast, precise, reliable.</p>
        <div class="bnd-spacer"></div>
        <button class="btn bnd-btn bnd-fade" style="animation-delay:6.5s" onclick="Game.onBoundaryNext()">Continue →</button>
      </div>
    </div>`;
  }

  function renderBoundaryScreen2(era, state) {
    const cardsHtml = era.priorities.map(p => {
      const selected = state.selected.includes(p.id);
      return `<div class="bnd-card${selected ? ' selected' : ''}" onclick="Game.onBoundaryCardToggle('${p.id}')">
        <div class="bnd-card-icon">${p.icon}</div>
        <div class="bnd-card-label">${p.label}</div>
        <div class="bnd-card-desc">${p.desc}</div>
      </div>`;
    }).join("");

    const showBtn = state.selected.length === 2 ? "inline-flex" : "none";

    return `<div class="screen active bnd-screen">
      <div class="bnd-screen-inner">
        <p class="bnd-question">The structure is built. Now — what is it FOR?</p>
        <div class="bnd-cards">${cardsHtml}</div>
        <p class="bnd-hint">${state.selected.length === 2 ? "You've selected 2 priorities." : "Select your top 2 priorities (tap to select)"}</p>
        <button class="btn bnd-btn" style="display:${showBtn}" onclick="Game.onBoundaryNext()">Continue →</button>
      </div>
    </div>`;
  }

  function renderBoundaryScreen3(era, state) {
    const reflection = window.BoundaryEngine.getReflection(era, state.selected);
    if (!reflection) return renderBoundaryScreen2(era, state);

    return `<div class="screen active bnd-screen">
      <div class="bnd-screen-inner">
        <div class="bnd-reflection">
          <p class="bnd-reflection-text bnd-fade" style="animation-delay:0.3s">"${reflection}"</p>
          <div class="bnd-spacer"></div>
          <p class="bnd-reflection-footnote bnd-fade" style="animation-delay:2s">A different engineer might choose differently — for a different community's needs.</p>
        </div>
        <div class="bnd-spacer"></div>
        <button class="btn bnd-btn bnd-fade" style="animation-delay:3s" onclick="Game.onBoundaryNext()">Continue →</button>
      </div>
    </div>`;
  }

  function renderBoundaryScreen4(era) {
    return `<div class="screen active bnd-screen">
      <div class="bnd-screen-inner">
        <div class="bnd-closing-scene">
          <div class="bnd-engineer">
            <div class="bnd-eng-hardhat"></div>
            <div class="bnd-eng-head">
              <div class="bnd-eng-glasses">
                <div class="bnd-eng-lens left"></div>
                <div class="bnd-eng-lens right"></div>
                <div class="bnd-eng-bridge"></div>
              </div>
              <div class="bnd-eng-eye left"></div>
              <div class="bnd-eng-eye right"></div>
              <div class="bnd-eng-smile"></div>
            </div>
            <div class="bnd-eng-body">
              <div class="bnd-eng-collar"></div>
              <div class="bnd-eng-pocket"></div>
            </div>
            <div class="bnd-eng-arm left"></div>
            <div class="bnd-eng-arm right">
              <div class="bnd-eng-blueprint"></div>
            </div>
            <div class="bnd-eng-legs">
              <div class="bnd-eng-leg left"></div>
              <div class="bnd-eng-leg right"></div>
            </div>
          </div>
          <div class="bnd-closing-divider"></div>
          <div class="bnd-automaton">
            <div class="bnd-auto-antenna"></div>
            <div class="bnd-auto-head">
              <div class="bnd-auto-visor"></div>
              <div class="bnd-auto-indicator"></div>
            </div>
            <div class="bnd-auto-body">
              <div class="bnd-auto-vent"></div>
              <div class="bnd-auto-bolt top"></div>
              <div class="bnd-auto-bolt bottom"></div>
            </div>
            <div class="bnd-auto-arm left">
              <div class="bnd-auto-joint"></div>
            </div>
            <div class="bnd-auto-arm right">
              <div class="bnd-auto-joint"></div>
            </div>
            <div class="bnd-auto-base">
              <div class="bnd-auto-wheel left"></div>
              <div class="bnd-auto-wheel right"></div>
            </div>
          </div>
        </div>
        <div class="bnd-closing-text">
          <p class="bnd-closing-line bnd-fade" style="animation-delay:0.5s">Automation didn't take the engineer's job.</p>
          <p class="bnd-closing-line bnd-fade" style="animation-delay:2.2s">It took the repetitive parts —</p>
          <p class="bnd-closing-line bnd-fade" style="animation-delay:4s">so the engineer could focus on the question only a human can answer:</p>
          <p class="bnd-closing-line bnd-fade bnd-closing-emphasis" style="animation-delay:5.8s">what should we build, and who is it for?</p>
        </div>
        <button class="btn bnd-btn bnd-fade" style="animation-delay:8s;margin-top:32px" onclick="Game.onBoundaryDone()">Start over from Era 1</button>
      </div>
    </div>`;
  }

  return {
    renderBoundaryScreen1, renderBoundaryScreen2, renderBoundaryScreen3, renderBoundaryScreen4
  };
})());
