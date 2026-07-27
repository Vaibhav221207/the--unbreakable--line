/**
 * ERA_DATA — All narrative content, puzzle definitions, and configuration.
 * Add Eras 2-6 by pushing new objects into this array.
 *
 * pieces[] fields:
 *   id, icon, label, slot (slot ID)
 *   x, y (position within arch container, pixels)
 *   rot (rotation in degrees to follow arch curve)
 */
const ERA_DATA = [
  {
    id: 1,
    label: "The Age of Hands",
    icon: "🪨",
    intro: {
      title: "The Unbreakable Boundary",
      subtitle: "Six eras. One builder. A line machines cannot cross.",
      lines: [
        "Each age brings a new challenge — and a new kind of tool.",
        "The question is: who builds, and who is replaced?"
      ],
      btn: "Step Into the Past"
    },
    narrative: {
      scene: "The sun rises over a river valley, 3,000 years before machines. A lone builder kneels beside rough-cut stone, her calloused hands her only tools. The village needs an arch — strong enough to hold, graceful enough to last.",
      quest: "Choose each stone and place it where it belongs. A foundation is nothing without order."
    },
    // Stone positions form a true arch — each stone rotated to follow the curve
    // Position values: x,y as percentages of arch container (0-100)
    // w,h as percentage of container width
    // rot in degrees (rotation follows arch curve tangent)
    // type: "base" | "pillar" | "curved" | "keystone" — controls CSS shape + quarry preview
    pieces: [
      { id: "base-l",    icon: "", label: "Heavy Base",     slot: "s0",  x: 16,  y: 83, w: 21, h: 17, rot: 0,   type: "base" },
      { id: "base-r",    icon: "", label: "Heavy Base",     slot: "s3",  x: 84,  y: 83, w: 21, h: 17, rot: 0,   type: "base" },
      { id: "supp-l",    icon: "", label: "Straight Pillar", slot: "s1",  x: 26,  y: 57, w: 11, h: 28, rot: 0,   type: "pillar" },
      { id: "supp-r",    icon: "", label: "Straight Pillar", slot: "s4",  x: 74,  y: 57, w: 11, h: 28, rot: 0,   type: "pillar" },
      { id: "arch-l",    icon: "", label: "Curved Stone",    slot: "s2",  x: 40,  y: 36, w: 14, h: 20, rot: -32, type: "curved" },
      { id: "arch-r",    icon: "", label: "Curved Stone",    slot: "s5",  x: 60,  y: 36, w: 14, h: 20, rot: 32,  type: "curved" },
      { id: "keystone",  icon: "", label: "Wedge Keystone",  slot: "s6",  x: 50,  y: 14, w: 18, h: 17, rot: 0,   type: "keystone" }
    ],
    order: ["base-l", "base-r", "supp-l", "supp-r", "arch-l", "arch-r", "keystone"],
    hints: {
      noPick: "Pick a stone from the quarry first! 👆",
      wrongSlot: "That stone doesn't fit there.",
      wrongOrder: "Build from the ground up! Foundation first! 🧱",
      already: "That stone is already placed.",
      locked: "Please wait..."
    },
    celebration: {
      title: "The Arch Stands! 🏛️",
      text: "Against the dust and the heat, your arch holds firm. The village cheers. But across the centuries, something stirs — cold, patient, and learning.",
      emoji: "🎉🏛️✨",
      btn: "Decades Later… →"
    },
    automation: {
      intro: "Centuries pass. In a factory lit by cold blue light, a robotic arm receives the same task. No hesitation. No fatigue. No pride in the work — just precision.",
      speed: 160,
      message: `<strong>It finishes in seconds.</strong> Perfect. Repeatable. Tireless.<br><br>
The same arch. The same stones. Yet the warmth of the builder's hands is gone.<br><br>
Automation didn't fail — it did exactly what it was told. But when a problem arises that <em>has no known solution</em>, whose hands will shape the answer?<br><br>
<span style="color:#8ab">Not the machine's. Only the builder's.</span>`
    }
  },

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
];

window.ERA_DATA = ERA_DATA;