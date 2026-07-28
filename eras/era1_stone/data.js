window.ERA_DATA.push(
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
  }
);
