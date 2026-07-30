Object.assign(window.Game, (() => {
  const $ = id => document.getElementById(id);
  const app = document.getElementById('app');

  function launchConveyorPuzzle() {
    Game.state = window.MatchingEngine.createState(Game.currentEra);
    window.Game.render(window.UIRenderer.renderConveyorPuzzle(Game.currentEra));
    window.UIRenderer.showHint("⬅️ Watch the belt — grab the right material, drop it on its bin!");
    window.UIRenderer.startConveyorBelt(Game.currentEra, Game.state, {
      onDrop: handleBeltDrop
    });
  }

  function handleBeltDrop(materialId, scenarioId) {
    const validation = window.MatchingEngine.validate(Game.currentEra, Game.state, materialId, scenarioId);
    if (!validation.ok) {
      AudioSystem.playSound('fail');
      if (validation.reason === "wrongMatch") {
        window.UIRenderer.shakeBin(scenarioId);
        window.UIRenderer.showHint(validation.hint + " Try again!");
      } else if (validation.reason === "alreadyDone") {
        window.UIRenderer.shakeBin(scenarioId);
        window.UIRenderer.showHint("That bin is already filled!");
      } else {
        window.UIRenderer.shakeBin(scenarioId);
        window.UIRenderer.showHint("That doesn't work here.");
      }
      return;
    }
    const mat = Game.currentEra.materials.find(m => m.id === materialId);
    window.MatchingEngine.commit(Game.state, materialId, scenarioId);
    AudioSystem.playSound('success');
    window.UIRenderer.fillBin(scenarioId, mat ? mat.label : materialId);
    window.UIRenderer.showHint(`✅ ${mat ? mat.label : materialId} placed in ${scenarioId}!`);

    if (window.MatchingEngine.isComplete(Game.state)) {
      window.UIRenderer.stopConveyorBelt();
      setTimeout(() => window.Game.appendToBody(window.UIRenderer.renderCelebration(Game.currentEra)), 600);
    }
  }

  return {
    launchConveyorPuzzle, handleBeltDrop
  };
})());
