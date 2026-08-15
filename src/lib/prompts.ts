export type PromptInputType = "text" | "textarea" | "slider" | "toggle" | "choices";

export interface PromptDefinition {
  id: string;
  label: string;
  category: string;
  inputType: PromptInputType;
  placeholder?: string;
  sliderMin?: number;
  sliderMax?: number;
  toggleLabels?: [string, string];
  choices?: string[];
  privateByDefault?: boolean;
}

export const PROMPT_CATEGORIES = [
  "Recap",
  "Story",
  "Social",
  "Party",
  "Chaotic",
  "Reflection",
  "Mission",
] as const;

export const PROMPTS: PromptDefinition[] = [
  { id: "chaos", label: "Rate the chaos", category: "Recap", inputType: "slider", sliderMin: 1, sliderMax: 10 },
  { id: "whoWasDrunkest", label: "MVP of messiness (who was drunkest?)", category: "Recap", inputType: "text" },
  { id: "funniestThing", label: "Funniest moment", category: "Recap", inputType: "textarea" },
  { id: "quoteOfNight", label: "Quote of the night", category: "Recap", inputType: "text" },
  { id: "kissedAnyone", label: "Did you kiss anyone?", category: "Recap", inputType: "toggle", toggleLabels: ["Yes", "No"], privateByDefault: true },
  { id: "kissedWho", label: "Who?", category: "Recap", inputType: "text", placeholder: "Optional" },
  { id: "homeTime", label: "Home time", category: "Recap", inputType: "text", placeholder: "e.g. 4am" },
  { id: "mainCharacter", label: "Main character moment", category: "Story", inputType: "textarea" },
  { id: "plotTwist", label: "Plot twist", category: "Story", inputType: "textarea" },
  { id: "mostEmbarrassing", label: "Most embarrassing moment", category: "Story", inputType: "textarea" },
  { id: "highlight", label: "Highlight of the night", category: "Story", inputType: "textarea" },
  { id: "lowestPoint", label: "Lowest point", category: "Story", inputType: "textarea" },
  { id: "nightMvp", label: "Night MVP", category: "Social", inputType: "text" },
  { id: "lostSoldier", label: "Lost soldier", category: "Social", inputType: "text" },
  { id: "unexpectedLegend", label: "Unexpected legend", category: "Social", inputType: "text" },
  { id: "metAnyoneNew", label: "Met anyone new?", category: "Social", inputType: "text" },
  { id: "songOfNight", label: "Song of the night", category: "Party", inputType: "text" },
  { id: "drinkOfChoice", label: "Drink of choice", category: "Party", inputType: "text" },
  { id: "danceFloorRating", label: "Dance floor rating", category: "Party", inputType: "slider", sliderMin: 1, sliderMax: 10 },
  { id: "bestLocation", label: "Best location", category: "Party", inputType: "text" },
  { id: "biggestRedFlag", label: "Biggest red flag moment", category: "Chaotic", inputType: "textarea" },
  { id: "memoryGap", label: "Memory gap", category: "Chaotic", inputType: "textarea" },
  { id: "morningInvestigation", label: "Morning investigation", category: "Chaotic", inputType: "textarea" },
  { id: "regretLevel", label: "Regret level", category: "Chaotic", inputType: "slider", sliderMin: 1, sliderMax: 10 },
  { id: "coreMemory", label: "Core memory", category: "Reflection", inputType: "textarea" },
  { id: "oneWordVibe", label: "One-word vibe", category: "Reflection", inputType: "text" },
  { id: "wouldRepeat", label: "Would you repeat the night?", category: "Reflection", inputType: "toggle", toggleLabels: ["Yes", "No"] },
  { id: "tonightsObjective", label: "Mission of the night", category: "Mission", inputType: "text" },
  { id: "missionResult", label: "Mission result", category: "Mission", inputType: "text" },
  { id: "bonusAchievement", label: "Bonus achievement", category: "Mission", inputType: "text" },
  { id: "generalComment", label: "General thoughts about the night", category: "Reflection", inputType: "textarea" },
];

export const DEFAULT_PROMPT_IDS = [
  "chaos",
  "whoWasDrunkest",
  "funniestThing",
  "kissedAnyone",
  "songOfNight",
  "oneWordVibe",
  "tonightsObjective",
  "generalComment",
];

export const TIMELINE_EMOJIS = ["🥂", "🏠", "🎉", "🍻", "🎶", "🕺", "🏃", "📱", "🍕", "☕", "🌟", "💃", "🎭", "🔥", "💫"];
