Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');

  function launchBalancePuzzle() {
    Game.state = window.BalanceEngine.createState(Game.currentEra);
    window.Game.render(window.UIRenderer.renderBalancePuzzle(Game.currentEra));
    window.UIRenderer.showHint("⬅️ Adjust the levers to balance the crane");
    window.UIRenderer.startBalanceGame(Game.currentEra, Game.state, {
      onComplete: handleBalanceComplete
    });
  }

  function handleBalanceComplete() {
    window.UIRenderer.stopBalanceGame();
    window.UIRenderer.showHint("✅ All lifts balanced!");
    setTimeout(() => window.Game.appendToBody(window.UIRenderer.renderCelebration(Game.currentEra)), 500);
  }

  return {
    launchBalancePuzzle, handleBalanceComplete
  };
})());
