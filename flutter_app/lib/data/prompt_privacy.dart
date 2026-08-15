const promptMetadataKeys = {
  'hasMission',
  'missionCompleted',
  'kissedPrivate',
  'whoKissedWhoPrivate',
};

String privacyKeyFor(String promptId) => '${promptId}Private';

bool isPromptMetadataKey(String key) {
  return promptMetadataKeys.contains(key) || key.endsWith('Private');
}

bool isPromptPrivate(Map<String, dynamic> prompts, String promptId) {
  if (promptId == 'kissedAnyone' || promptId == 'kissedWho') {
    return prompts['kissedPrivate'] == true ||
        prompts['whoKissedWhoPrivate'] == true;
  }
  return prompts[privacyKeyFor(promptId)] == true;
}

bool kissedAnyoneValue(dynamic value) {
  if (value == true) return true;
  if (value is String) return value.toLowerCase() == 'yes';
  return false;
}

bool hasMissionValue(dynamic value) => value == true;
