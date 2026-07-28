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
      { id: "base-l",    icon: "", label: "Heavy Base",     slot: "s0",  x: 14,  y: 91, w: 28, h: 18, rot: 0,   type: "base" },
      { id: "base-r",    icon: "", label: "Heavy Base",     slot: "s3",  x: 86,  y: 91, w: 28, h: 18, rot: 0,   type: "base" },
      { id: "supp-l",    icon: "", label: "Straight Pillar", slot: "s1",  x: 24,  y: 66, w: 12, h: 32, rot: 0,   type: "pillar" },
      { id: "supp-r",    icon: "", label: "Straight Pillar", slot: "s4",  x: 76,  y: 66, w: 12, h: 32, rot: 0,   type: "pillar" },
      { id: "arch-l",    icon: "", label: "Curved Stone",    slot: "s2",  x: 37,  y: 38, w: 16, h: 26, rot: -30, type: "curved" },
      { id: "arch-r",    icon: "", label: "Curved Stone",    slot: "s5",  x: 63,  y: 38, w: 16, h: 26, rot: 30,  type: "curved" },
      { id: "keystone",  icon: "", label: "Wedge Keystone",  slot: "s6",  x: 50,  y: 12, w: 26, h: 22, rot: 0,   type: "keystone" }
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
      speed: 280,
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
  },
// ────────────────────────────────────────────────────────
// Era 3 — The Machine Age (balanced cantilever bridge sliders)
// ────────────────────────────────────────────────────────
{
  id: 3,
  label: "The Machine Age",
  icon: "🏗️",
  puzzleType: "balance",
  intro: {
    title: "The Unbreakable Boundary",
    subtitle: "Six eras. One builder. A line machines cannot cross.",
    lines: [
      "Steam and steel. Gears and girders. The age of machines has arrived.",
      "But every crane still needs a human hand to find its balance."
    ],
    btn: "Enter the Machine Shop"
  },
  narrative: {
    scene: "A river gorge waits to be crossed. A cantilever bridge — the most daring design of the Machine Age — will span the gap. But each arm must grow in perfect balance from the pier, or the entire structure will topple into the gorge below.",
    quest: "Extend the left and right cantilever arms using the sliders. Keep them balanced as you build toward the far banks."
  },
  scenarios: [
    {
      id: "l1",
      title: "Even Span",
      desc: "Equal loads — find the balanced extension",
      icon: "🏗️",
      leftArm: { load: 5, max: 40 },
      rightArm: { load: 4, max: 50 },
      target: { left: 20, right: 25 },
      tolerance: 2
    },
    {
      id: "l2",
      title: "Heavy Side",
      desc: "One arm carries heavier steel sections",
      icon: "🔩",
      leftArm: { load: 6, max: 40 },
      rightArm: { load: 3, max: 60 },
      target: { left: 15, right: 30 },
      tolerance: 2
    },
    {
      id: "l3",
      title: "River Crossing",
      desc: "A wide span over deep water",
      icon: "🌊",
      leftArm: { load: 4, max: 50 },
      rightArm: { load: 5, max: 40 },
      target: { left: 25, right: 20 },
      tolerance: 2
    },
    {
      id: "l4",
      title: "Precision Alignment",
      desc: "Tight tolerance — misalignment means collapse",
      icon: "⚙️",
      leftArm: { load: 3, max: 60 },
      rightArm: { load: 4, max: 50 },
      target: { left: 28, right: 21 },
      tolerance: 2
    }
  ],
  celebration: {
    title: "The Cantilever Holds! 🌉",
    text: "Arm by arm, the bridge reaches across the gorge. The steel work is true, the balance perfect. But on the opposite bank, a machine watches — and calculates.",
    emoji: "🎉🌉🔩",
    btn: "Automate It →"
  },
  automation: {
    intro: "A robotic gantry glides along the pier. With mechanical precision, it calculates the exact moment required on each side and slides the cantilever arms to their optimal extensions.",
    speed: 80,
    message: `<strong>Cantilever balance computation complete.</strong> 0.24 seconds per arm.<br><br>
The machine solved the equilibrium equation — load × distance, a simple product.<br><br>
But what happens when the wind gust hits, the load shifts, or the steel expands in the heat?<br><br>
<span style="color:#6a8aaa">The machine calculates. Only the builder adapts.</span>`
  }
  },
  // ────────────────────────────────────────────────────────
  // Era 4 — The Age of CAD (blueprint simulator toggles)
  // ────────────────────────────────────────────────────────
  {
    id: 4,
    label: "The Age of CAD",
    icon: "💻",
    puzzleType: "blueprint",
    intro: {
      title: "The Unbreakable Boundary",
      subtitle: "Six eras. One builder. A line machines cannot cross.",
      lines: [
        "The screen glows blue. The mouse replaces the trowel.",
        "Structures are tested in silicon before a single stone is cut."
      ],
      btn: "Open the Blueprint"
    },
    narrative: {
      scene: "A quiet office lit by monitors. No dust. No clamor. An engineer adjusts parameters on screen, watching the simulation bend and flex before anything is built. The age of computer-aided design has arrived — structures tested a thousand times before the first shovel breaks ground.",
      quest: "Run simulations for two hazard zones. Pick the right foundation, bracing, and material — or watch the structure fail on screen."
    },
    params: [
      { id: "foundation", label: "Foundation", options: [
        { id: "shallow", label: "Shallow" },
        { id: "deep", label: "Deep" }
      ]},
      { id: "bracing", label: "Bracing", options: [
        { id: "none", label: "None" },
        { id: "diagonal", label: "Diagonal" },
        { id: "cross", label: "Cross" }
      ]},
      { id: "material", label: "Material", options: [
        { id: "rigid", label: "Rigid" },
        { id: "flexible", label: "Flexible" }
      ]}
    ],
    scenarios: [
      {
        id: "earthquake",
        title: "Earthquake Zone",
        desc: "Seismic activity expected — design for lateral ground motion",
        icon: "🌋",
        correct: { foundation: "deep", bracing: "cross", material: "flexible" },
        failureHints: {
          foundation: "Shallow foundations liquefy in seismic shaking. Deep anchors reach stable strata.",
          bracing: "Without cross bracing, the structure sways. Cross braces resist both compression and tension.",
          material: "Rigid materials crack under seismic stress. Flexible materials absorb energy through deformation."
        },
        successText: "Deep foundations anchor below the liquefaction zone. Cross bracing resists both compression and tension from seismic waves. Flexible materials absorb energy through controlled deformation — the structure rides the quake."
      },
      {
        id: "flood",
        title: "Flood-Prone Area",
        desc: "Seasonal flooding — design for water pressure and erosion",
        icon: "🌊",
        correct: { foundation: "deep", bracing: "diagonal", material: "rigid" },
        failureHints: {
          foundation: "Shallow foundations wash out in floods. Deep piles reach below scour depth.",
          bracing: "Cross bracing traps debris and increases water load. Diagonal bracing lets water flow through.",
          material: "Flexible materials deform under constant water pressure. Rigid materials hold their shape."
        },
        successText: "Deep foundations reach below scour depth. Diagonal bracing provides lateral support while allowing water to pass through without trapping debris. Rigid materials maintain shape against continuous hydrostatic pressure."
      }
    ],
    celebration: {
      title: "Blueprint Verified! 💻",
      text: "The simulation holds. Your design survives the hazard. But next to the monitor, a terminal scrolls through millions of parameter combinations in seconds — searching for a solution you never considered.",
      emoji: "🎉💻📐",
      btn: "Run Brute Force →"
    },
    automation: {
      intro: "A CAD terminal runs through every possible parameter combination — shallow+none+rigid, shallow+none+flexible — testing thousands of configurations in under a second. Brute force. No intuition. No experience.",
      speed: 90,
      message: `<strong>All 12 combinations tested.</strong> 0.84 seconds per sweep.<br><br>
The computer found the optimal design by brute force — testing every possibility because it can. Speed without understanding. Precision without craft.<br><br>
But when a problem has <em>no known parameters</em>, who programs the search?<br><br>
<span style="color:#80d0e0">The machine optimizes. Only the builder originates.</span>`
    }
  },
  // ────────────────────────────────────────────────────────
  {
    id: 5,
    label: "The Age of Robotics & 3D Printing",
    icon: "🤖",
    puzzleType: "print",
    intro: {
      title: "The Age of Robotics & 3D Printing",
      subtitle: "Material synthesis meets digital fabrication",
      lines: [
        "3D printing lets engineers build complex geometries that traditional construction can't achieve — layer by layer, from the ground up.",
        "But the machine still needs the builder's intent. Choose your ingredients, set the pattern, and print."
      ],
      btn: "Enter the Lab"
    },
    narrative: {
      scene: "The workshop has changed. A material synthesizer hums in the corner, its chamber ready for your ingredients. Beside it, a 3D printer waits — layer by layer, it will bring your design to life.",
      quest: "Synthesize the right material, choose the infill pattern, and print a structure that survives the test."
    },
    params: [
      { label: "Ingredients", id: "ingredients" },
      { label: "Pattern", id: "pattern" }
    ],
    ingredients: [
      { id: "carbon_strands", label: "Carbon Strands", icon: "🧵", category: "fiber" },
      { id: "resin", label: "Resin", icon: "🧪", category: "binder" },
      { id: "recycled_polymer", label: "Recycled Polymer", icon: "♻️", category: "polymer" },
      { id: "flex_additive", label: "Flex Additive", icon: "💧", category: "additive" },
      { id: "sand", label: "Sand", icon: "🪨", category: "aggregate" },
      { id: "standard_binder", label: "Standard Binder", icon: "🧱", category: "binder" }
    ],
    correctMixes: {
      lightweight_composite: { a: "carbon_strands", b: "resin", label: "Lightweight Composite", icon: "🔷", desc: "Carbon-fiber-reinforced — strong, light, rigid." },
      flexible_polymer: { a: "recycled_polymer", b: "flex_additive", label: "Flexible Polymer", icon: "🌀", desc: "Elastomeric — bends without breaking." },
      standard_concrete: { a: "sand", b: "standard_binder", label: "Standard Concrete", icon: "🧱", desc: "Traditional — heavy, cheap, strong in compression." }
    },
    patterns: [
      { id: "solid", icon: "⬛", label: "Solid Fill" },
      { id: "honeycomb", icon: "⬡", label: "Honeycomb Grid" },
      { id: "organic", icon: "🌀", label: "Organic Lattice" }
    ],
    scenarios: [
      {
        id: "roof",
        title: "Featherweight Roof",
        desc: "Ultra-light spanning structure — needs strength without weight",
        icon: "🏗️",
        correct: { ingredients: "lightweight_composite", pattern: "honeycomb" },
        failureHints: {
          ingredients: "Those ingredients don't form a usable structural material. Try a fiber + binder combination, or an aggregate + binder.",
          pattern: "This pattern doesn't suit a lightweight spanning structure. Consider a grid-based infill for strength without weight."
        },
        successText: "Lightweight Composite + Honeycomb Grid: the spanning structure is strong, light, and uses minimal material. The roof holds — a triumph of additive engineering."
      },
      {
        id: "support",
        title: "Complex Curved Support",
        desc: "Non-standard curved geometry — needs flexibility and conformability",
        icon: "🏛️",
        correct: { ingredients: "flexible_polymer", pattern: "organic" },
        failureHints: {
          ingredients: "These ingredients can't produce a flexible material for curved geometry. Try a polymer + additive combination.",
          pattern: "A rigid pattern won't follow complex curves. Choose an organic, conformable infill."
        },
        successText: "Flexible Polymer + Organic Lattice: the curved support flexes under load without fracturing. The organic lattice distributes stress naturally through the complex geometry."
      }
    ],
    celebration: {
      title: "Printed! 🤖",
      text: "The printer whirs to a stop. Your design stands — synthesized, patterned, and built. But nearby, a robotic arm is already mixing its own batch, printing its own shape, without waiting for a builder's intent.",
      emoji: "🤖🔷🏗️",
      btn: "Watch Automation →"
    },
    automation: {
      intro: "A robotic fabrication cell takes over — automatically selecting ingredients, calculating infill patterns, and printing the optimal structure in one continuous cycle. It doesn't just simulate anymore. It builds.",
      speed: 110,
      message: `<strong>Autonomous fabrication complete.</strong> 0.22 seconds per layer.<br><br>
The robot selected, mixed, and printed without human input. Design and construction have merged into a single automated pipeline.<br><br>
<span style="color:#70e0c0">The machine now builds what it computes. The builder's role shifts from maker to curator.</span>`
    }
  }
];

window.ERA_DATA = ERA_DATA;