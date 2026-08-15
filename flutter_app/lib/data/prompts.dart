enum PromptInputType { text, textarea, slider, toggle, choices }

class PromptDefinition {
  const PromptDefinition({
    required this.id,
    required this.label,
    required this.category,
    required this.inputType,
    this.placeholder,
    this.sliderMin = 1,
    this.sliderMax = 10,
    this.toggleLabels = const ['Yes', 'No'],
    this.choices = const [],
    this.privateByDefault = false,
    this.canBePrivate = false,
  });

  final String id;
  final String label;
  final String category;
  final PromptInputType inputType;
  final String? placeholder;
  final int sliderMin;
  final int sliderMax;
  final List<String> toggleLabels;
  final List<String> choices;
  final bool privateByDefault;
  final bool canBePrivate;
}

const defaultPromptIds = [
  'chaos',
  'whoWasDrunkest',
  'funniestThing',
  'songOfNight',
  'oneWordVibe',
  'generalComment',
];

const promptDefinitions = [
  PromptDefinition(
    id: 'chaos',
    label: 'Rate the chaos',
    category: 'Recap',
    inputType: PromptInputType.slider,
  ),
  PromptDefinition(
    id: 'whoWasDrunkest',
    label: 'MVP of messiness (who was drunkest?)',
    category: 'Recap',
    inputType: PromptInputType.text,
    canBePrivate: true,
  ),
  PromptDefinition(
    id: 'funniestThing',
    label: 'Funniest moment',
    category: 'Recap',
    inputType: PromptInputType.textarea,
    canBePrivate: true,
  ),
  PromptDefinition(
    id: 'quoteOfNight',
    label: 'Quote of the night',
    category: 'Recap',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'kissedAnyone',
    label: 'Did you kiss anyone?',
    category: 'Recap',
    inputType: PromptInputType.toggle,
    privateByDefault: true,
  ),
  PromptDefinition(
    id: 'kissedWho',
    label: 'Who?',
    category: 'Recap',
    inputType: PromptInputType.text,
    placeholder: 'Optional',
    privateByDefault: true,
  ),
  PromptDefinition(
    id: 'homeTime',
    label: 'Home time',
    category: 'Recap',
    inputType: PromptInputType.text,
    placeholder: 'e.g. 4am',
  ),
  PromptDefinition(
    id: 'songOfNight',
    label: 'Song of the night',
    category: 'Party',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'oneWordVibe',
    label: 'One-word vibe',
    category: 'Reflection',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'tonightsObjective',
    label: 'Mission of the night',
    category: 'Mission',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'missionResult',
    label: 'Mission result',
    category: 'Mission',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'generalComment',
    label: 'Notable mentions',
    category: 'Reflection',
    inputType: PromptInputType.textarea,
    canBePrivate: true,
  ),
  PromptDefinition(
    id: 'nightMvp',
    label: 'Night MVP',
    category: 'Social',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'drinkOfChoice',
    label: 'Drink of choice',
    category: 'Party',
    inputType: PromptInputType.text,
  ),
  PromptDefinition(
    id: 'coreMemory',
    label: 'Core memory',
    category: 'Reflection',
    inputType: PromptInputType.textarea,
  ),
];

final promptLabelById = {
  for (final prompt in promptDefinitions) prompt.id: prompt.label,
};

List<PromptDefinition> defaultPrompts() {
  final byId = {for (final p in promptDefinitions) p.id: p};
  return [
    for (final id in defaultPromptIds)
      if (byId[id] != null) byId[id]!,
  ];
}

List<PromptDefinition> extraPrompts() {
  final defaults = defaultPromptIds.toSet();
  return [
    for (final prompt in promptDefinitions)
      if (!defaults.contains(prompt.id)) prompt,
  ];
}

String promptDisplayLabel(String id) => promptLabelById[id] ?? id;
