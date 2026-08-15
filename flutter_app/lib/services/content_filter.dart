/// Content filter for UGC (App Store Guideline 1.2).
/// Rejects objectionable content. Uses word-boundary matching to reduce false positives.
class ContentFilterException implements Exception {
  static const message = 'Content violates our community guidelines';

  @override
  String toString() => message;
}

final _blockedPatterns = [
  RegExp(
    r'\b(fuck|shit|faggot|nigger|nigga|retard|rape|pedo|kill\s+yourself|kys)\b',
    caseSensitive: false,
  ),
];

bool containsObjectionableContent(String? text) {
  if (text == null || text.isEmpty) return false;
  return _blockedPatterns.any((pattern) => pattern.hasMatch(text));
}

bool containsObjectionableContentInObject(dynamic value) {
  if (value == null) return false;
  if (value is String) return containsObjectionableContent(value);
  if (value is List) {
    return value.any(containsObjectionableContentInObject);
  }
  if (value is Map) {
    return value.values.any(containsObjectionableContentInObject);
  }
  return false;
}

void assertContentAllowed(String text) {
  if (containsObjectionableContent(text)) {
    throw ContentFilterException();
  }
}

void assertEntryContentAllowed({
  required Map<String, dynamic> prompts,
  Iterable<String?> timelineNotes = const [],
}) {
  if (containsObjectionableContentInObject(prompts)) {
    throw ContentFilterException();
  }
  for (final notes in timelineNotes) {
    if (containsObjectionableContent(notes)) {
      throw ContentFilterException();
    }
  }
}
