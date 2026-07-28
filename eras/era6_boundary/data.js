window.ERA_DATA.push(
  {
    id: 6,
    label: "The Unbreakable Boundary",
    icon: "🌉",
    puzzleType: "boundary",
    intro: {
      title: "The Unbreakable Boundary",
      subtitle: "Technology meets purpose",
      lines: [
        "You've built with stone, forged with steel, mechanized with precision, simulated with data, and fabricated with automation.",
        "Now the tools are ready. The question is no longer 'can we build it?' — it's 'should we build it, and for whom?'"
      ],
      btn: "Begin the Final Step"
    },
    narrative: {
      scene: "The workshop is quiet now. Every tool you've mastered — stone, steel, machine, simulation, printer — stands ready. But the final build isn't about any of them. It's about what you choose to build, and why.",
      quest: "There is no puzzle to solve here. Only a question to answer.",
      btn: "Proceed"
    },
    priorities: [
      { id: "accessibility", icon: "♿", label: "Accessibility", desc: "Can elderly and disabled residents use this easily?" },
      { id: "cost", icon: "💰", label: "Cost", desc: "Can the community actually afford to maintain this?" },
      { id: "environment", icon: "🌿", label: "Environment", desc: "Does this protect the green space already here?" },
      { id: "culture", icon: "🎭", label: "Culture", desc: "Does this respect what this neighborhood already values?" },
      { id: "safety", icon: "🛡️", label: "Safety", desc: "Is this genuinely safe for kids playing nearby?" }
    ],
    reflections: {
      "accessibility+environment": "This space welcomes everyone while protecting what's already there.",
      "accessibility+cost": "This design reaches the most people while staying grounded in what the community can sustain.",
      "accessibility+culture": "This place honors the neighborhood's character by making it truly open to all who live here.",
      "accessibility+safety": "Everyone — young, old, able or not — can move through this space without fear.",
      "cost+environment": "This is a responsible design — gentle on the land and light on the community's wallet.",
      "cost+culture": "This choice preserves what matters most: the community's character and its long-term stability.",
      "cost+safety": "This is a practical, protective design — safe for children, sustainable for the budget.",
      "environment+culture": "This space grows from what's already here — both natural and human heritage protected together.",
      "environment+safety": "Nature and nurture coexist here: safe pathways through protected green space.",
      "safety+culture": "This neighborhood keeps its soul while making sure every corner is safe for its youngest members."
    }
  }
);
