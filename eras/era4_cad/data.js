window.ERA_DATA.push(
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
  }
);
