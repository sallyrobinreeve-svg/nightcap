class FeedEntry {
  const FeedEntry({
    required this.id,
    required this.userId,
    required this.dateOfNight,
    required this.createdAt,
    required this.rating,
    required this.prompts,
    required this.displayName,
    required this.thumbnailUrl,
    required this.reactionCount,
    required this.commentCount,
  });

  final String id;
  final String userId;
  final String dateOfNight;
  final String createdAt;
  final int? rating;
  final Map<String, dynamic> prompts;
  final String? displayName;
  final String? thumbnailUrl;
  final int reactionCount;
  final int commentCount;

  String? get mission => prompts['mission'] as String?;
}

class FeedCursor {
  const FeedCursor({required this.createdAt});

  /// ISO timestamp of the last entry on the current page. The feed is ordered
  /// by `created_at` (newest first), so this is a stable pagination cursor and
  /// guarantees freshly posted recaps appear at the top.
  final String createdAt;
}

class FeedPage {
  const FeedPage({required this.entries, required this.nextCursor});
  final List<FeedEntry> entries;
  final FeedCursor? nextCursor;
}
