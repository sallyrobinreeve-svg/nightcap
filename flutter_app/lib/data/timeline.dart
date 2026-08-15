const timelineStepTypes = ['pres', 'club', 'bar', 'afters', 'other'];

const timelineTypeLabels = {
  'pres': 'Pres',
  'club': 'Club',
  'bar': 'Bar',
  'afters': 'Afters',
  'other': 'Other',
};

const timelineEmojis = [
  '🥂', '🏠', '🎉', '🍻', '🎶', '🕺', '🏃', '📱', '🍕', '☕',
  '🌟', '💃', '🎭', '🔥', '💫',
];

String timelineTypeLabel(String type) =>
    timelineTypeLabels[type] ?? type;
