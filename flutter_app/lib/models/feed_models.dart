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
    this.videoUrl,
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
  final String? videoUrl;

  String? get mission =>
      prompts['tonightsObjective'] as String? ?? prompts['mission'] as String?;
}

class FeedCursor {
  const FeedCursor({required this.createdAt});
  final String createdAt;
}

class FeedPage {
  const FeedPage({required this.entries, required this.nextCursor});
  final List<FeedEntry> entries;
  final FeedCursor? nextCursor;
}
