window.ERA_DATA.push(
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
  }
);
