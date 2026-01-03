export const QUESTIONS = [
  {
    id: "RC_001",
    type: "single_select",
    text: "When you imagine your ideal Saturday night, what sounds most appealing?",
    options: [
      { id: "opt_1", text: "Deep conversation with one person, no distractions" },
      { id: "opt_2", text: "Group hangout with friends, lots of energy" },
      { id: "opt_3", text: "Solo time to recharge, then maybe meet up later" },
      { id: "opt_4", text: "Spontaneous — I’d decide based on my mood that day" }
    ]
  },

  {
    id: "RC_002",
    type: "multi_select",
    text: "Think about the last time you felt truly seen by someone. What did they do?",
    options: [
      { id: "opt_1", text: "They listened without trying to fix things" },
      { id: "opt_2", text: "They remembered small details" },
      { id: "opt_3", text: "They asked thoughtful follow-up questions" }
    ]
  },

  {
    id: "RC_003",
    type: "slider",
    text: "When someone you’re interested in takes 8+ hours to reply, what’s your first thought?",
    min: 0,
    max: 10,
    default: 5
  },

  {
    id: "RC_004",
    type: "single_select",
    text: "Complete this sentence: In relationships, I’m most afraid of…",
    options: [
      { id: "opt_1", text: "Being abandoned or left behind" },
      { id: "opt_2", text: "Losing my independence" },
      { id: "opt_3", text: "Being misunderstood" },
      { id: "opt_4", text: "Getting too close too fast" }
    ]
  },

  {
    id: "RC_005",
    type: "body_map_select",
    text: "When you disagree with someone you care about, where do you first notice it in your body?",
    options: [
      { id: "chest", text: "Chest tightens or heart races" },
      { id: "stomach", text: "Stomach knots" },
      { id: "throat", text: "Throat tightens" },
      { id: "head", text: "Head feels heavy or tense" }
    ]
  },

  {
    id: "RC_006",
    type: "single_select",
    text: "How did your parents or caregivers handle conflict when you were growing up?",
    options: [
      { id: "opt_1", text: "They talked things through calmly" },
      { id: "opt_2", text: "They avoided conflict" },
      { id: "opt_3", text: "Conflicts escalated quickly" },
      { id: "opt_4", text: "I’m not sure / it varied" }
    ]
  },

  {
    id: "RC_007",
    type: "multi_select",
    text: "When someone showers you with intense attention and affection early on, you feel…",
    options: [
      { id: "opt_1", text: "Excited — this is what I’ve been wanting" },
      { id: "opt_2", text: "Cautious — it feels a bit fast" },
      { id: "opt_3", text: "Flattered but unsure" },
      { id: "opt_4", text: "Overwhelmed" }
    ]
  },

  {
    id: "RC_008",
    type: "open_text",
    text: "What does ‘ready for a relationship’ mean to you right now?",
    minChars: 20,
    maxChars: 300
  }
];
