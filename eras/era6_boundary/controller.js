Object.assign(window.Game, (() => {
  function launchBoundaryPuzzle() {
    Game.state = window.BoundaryEngine.createState();
    Game.render(window.UIRenderer.renderBoundaryScreen1(Game.currentEra));
    if (window.AudioSystem) AudioSystem.startBeltHum();
    setTimeout(() => { if (window.AudioSystem) AudioSystem.stopBeltHum(); }, 7000);
  }

  function onBoundaryNext() {
    if (window.AudioSystem) AudioSystem.stopBeltHum();
    AudioSystem.playSound('tap');
    const era = Game.currentEra;
    const st = Game.state;
    window.BoundaryEngine.advanceScreen(st);
    if (st.screen === 1) {
      Game.render(window.UIRenderer.renderBoundaryScreen2(era, st));
    } else if (st.screen === 2) {
      Game.render(window.UIRenderer.renderBoundaryScreen3(era, st));
    } else if (st.screen === 3) {
      document.body.classList.add("body-bookend");
      Game.render(window.UIRenderer.renderBoundaryScreen4(era));
    }
  }

  function onBoundaryCardToggle(cardId) {
    AudioSystem.playSound('tap');
    const st = Game.state;
    const result = window.BoundaryEngine.togglePriority(st, cardId);
    if (!result.ok) return;
    Game.render(window.UIRenderer.renderBoundaryScreen2(Game.currentEra, st));
  }

  function onBoundaryDone() {
    Game.restart();
  }

  return {
    launchBoundaryPuzzle, onBoundaryNext, onBoundaryCardToggle, onBoundaryDone
  };
})());
