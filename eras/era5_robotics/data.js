window.ERA_DATA.push(
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
);
