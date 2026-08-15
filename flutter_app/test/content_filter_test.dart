import 'package:flutter_test/flutter_test.dart';
import 'package:nightcapt_flutter/services/content_filter.dart';

void main() {
  test('allows clean text', () {
    expect(containsObjectionableContent('Great night out!'), isFalse);
    expect(
      containsObjectionableContentInObject({'highlight': 'Dancing with friends'}),
      isFalse,
    );
  });

  test('blocks objectionable words with word boundaries', () {
    expect(containsObjectionableContent('what the fuck'), isTrue);
    expect(containsObjectionableContent('kys'), isTrue);
    expect(containsObjectionableContent('kill yourself'), isTrue);
  });

  test('assertContentAllowed throws with community message', () {
    expect(
      () => assertContentAllowed('shit happens'),
      throwsA(
        predicate(
          (error) =>
              error is ContentFilterException &&
              error.toString() == ContentFilterException.message,
        ),
      ),
    );
  });

  test('assertEntryContentAllowed checks prompts and timeline notes', () {
    expect(
      () => assertEntryContentAllowed(
        prompts: {'notes': 'all good'},
        timelineNotes: ['fine'],
      ),
      returnsNormally,
    );

    expect(
      () => assertEntryContentAllowed(
        prompts: {'notes': 'fuck this'},
        timelineNotes: ['fine'],
      ),
      throwsA(isA<ContentFilterException>()),
    );

    expect(
      () => assertEntryContentAllowed(
        prompts: {'notes': 'fine'},
        timelineNotes: ['pedo alert'],
      ),
      throwsA(isA<ContentFilterException>()),
    );
  });
}
