window.ERA_DATA.push(
// ────────────────────────────────────────────────────────
  // Era 2 — The Industrial Age (matching puzzle, any order)
  // ────────────────────────────────────────────────────────
  {
    id: 2,
    label: "The Industrial Age",
    icon: "⚙️",
    puzzleType: "matching",
    intro: {
      title: "The Unbreakable Boundary",
      subtitle: "Six eras. One builder. A line machines cannot cross.",
      lines: [
        "The age of steam has arrived. Iron and fire reshape the world.",
        "But some choices still require a human touch."
      ],
      btn: "Enter the Factory"
    },
    narrative: {
      scene: "Steam hisses through iron pipes. A factory floor hums with the rhythm of belts and gears. Human hands still guide the work — for now. A new building must be fitted with the right materials for each purpose.",
      quest: "Match each building scenario with the best material. Any order works — just get it right."
    },
    // 3 scenarios, 5 materials, any-order matching
    scenarios: [
      { id: "beam",  title: "Structural Beam",  desc: "A floor beam under heavy industrial load. Needs high tensile strength.",        icon: "🏗️" },
      { id: "wall",  title: "Exterior Wall",    desc: "A factory wall facing rain and heat. Needs weather resistance.",                icon: "🧱" },
      { id: "arch",  title: "Entrance Arch",    desc: "A visible entry support. Needs strength with aesthetic appeal.",                icon: "🏛️" }
    ],
    materials: [
      { id: "steel",    label: "Steel Girder",    icon: "🔩" },
      { id: "concrete", label: "Concrete Block",  icon: "🧱" },
      { id: "castiron", label: "Cast Iron Column", icon: "⚙️" },
      { id: "timber",   label: "Treated Timber",  icon: "🪵" },
      { id: "wrought",  label: "Wrought Iron",    icon: "🔗" }
    ],
    // Exactly one correct material per scenario — other materials are distractors
    correctMatches: { beam: "steel", wall: "concrete", arch: "wrought" },
    // Playful "why not" hint shown per selected material on wrong match
    wrongHints: {
      steel:    "Steel is immensely strong, but this application needs a different property.",
      concrete: "Concrete stands up to weather, but strength or looks aren't right here.",
      castiron: "Cast iron is sturdy but brittle — the wrong choice for this task.",
      timber:   "Timber is warm and traditional, but this calls for something more modern.",
      wrought:  "Wrought iron is tough and elegant, but not the fit for this scenario."
    },
    celebration: {
      title: "The Factory Stands! 🏭",
      text: "Steam rises through iron rafters. The building is complete. But on the factory floor, a machine watches — and learns.",
      emoji: "🎉🏭⚙️",
      btn: "Automate It →"
    },
    automation: {
      intro: "A conveyor belt hums to life. A mechanical arm scans each scenario, selects the optimal material with cold precision, and matches them in seconds.",
      speed: 120,
      message: `<strong>Pattern recognition complete.</strong> 0.36 seconds per match.<br><br>
The machine didn't deliberate. It didn't weigh beauty against durability. It simply computed the optimal answer.<br><br>
But what happens when there is <em>no optimal answer</em>?<br><br>
<span style="color:#c08050">The machine can match. Only the builder can imagine.</span>`
    }
  }
);
