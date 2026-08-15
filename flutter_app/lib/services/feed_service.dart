import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/feed_models.dart';

class FeedService {
  static const pageSize = 20;

  SupabaseClient get _client => Supabase.instance.client;

  Future<List<String>> _audienceIds(String userId) async {
    final blocked = await _client
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);
    final follows = await _client
        .from('follows')
        .select('follower_id, following_id, status')
        .eq('status', 'accepted')
        .or('follower_id.eq.$userId,following_id.eq.$userId');

    final blockedIds = {
      for (final row in blocked as List) row['blocked_id'] as String,
    };

    final ids = <String>{userId};
    for (final row in follows as List) {
      final follower = row['follower_id'] as String;
      final following = row['following_id'] as String;
      final other = follower == userId ? following : follower;
      if (!blockedIds.contains(other)) ids.add(other);
    }
    return ids.toList();
  }

  Future<FeedPage> fetchPage({FeedCursor? cursor}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) {
      return const FeedPage(entries: [], nextCursor: null);
    }

    final audience = await _audienceIds(userId);
    if (audience.isEmpty) {
      return const FeedPage(entries: [], nextCursor: null);
    }

    var filter = _client
        .from('entries')
        .select(
          'id, user_id, date_of_night, rating, prompts, created_at, video_url',
        )
        .inFilter('user_id', audience);

    if (cursor != null) {
      filter = filter.lt('created_at', cursor.createdAt);
    }

    final rows = await filter
        .order('created_at', ascending: false)
        .order('id', ascending: false)
        .limit(pageSize);

    final entries = (rows as List).cast<Map<String, dynamic>>();
    if (entries.isEmpty) {
      return const FeedPage(entries: [], nextCursor: null);
    }

    final entryIds = [for (final entry in entries) entry['id'] as String];
    final userIds = {
      for (final entry in entries) entry['user_id'] as String,
    }.toList();

    final results = await Future.wait([
      _client
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .inFilter('id', userIds),
      _client.from('photos').select('entry_id, type, url').inFilter('entry_id', entryIds),
      _client.from('reactions').select('entry_id').inFilter('entry_id', entryIds),
      _client.from('comments').select('entry_id').inFilter('entry_id', entryIds),
    ]);

    final profiles = (results[0] as List).cast<Map<String, dynamic>>();
    final photos = (results[1] as List).cast<Map<String, dynamic>>();
    final reactions = (results[2] as List).cast<Map<String, dynamic>>();
    final comments = (results[3] as List).cast<Map<String, dynamic>>();

    final nameById = <String, String?>{};
    for (final profile in profiles) {
      final displayName = profile['display_name'] as String?;
      final username = profile['username'] as String?;
      nameById[profile['id'] as String] =
          displayName?.trim().isNotEmpty == true
          ? displayName
          : (username?.trim().isNotEmpty == true ? '@$username' : null);
    }

    final thumbByEntry = <String, String>{};
    for (final photo in photos) {
      final type = photo['type'] as String?;
      final entryId = photo['entry_id'] as String;
      if ((type == 'favourite' || type == 'outfit') &&
          !thumbByEntry.containsKey(entryId)) {
        thumbByEntry[entryId] = photo['url'] as String;
      }
    }

    final reactionCounts = <String, int>{};
    for (final reaction in reactions) {
      final id = reaction['entry_id'] as String;
      reactionCounts[id] = (reactionCounts[id] ?? 0) + 1;
    }

    final commentCounts = <String, int>{};
    for (final comment in comments) {
      final id = comment['entry_id'] as String;
      commentCounts[id] = (commentCounts[id] ?? 0) + 1;
    }

    final feedEntries = [
      for (final entry in entries)
        FeedEntry(
          id: entry['id'] as String,
          userId: entry['user_id'] as String,
          dateOfNight: entry['date_of_night'] as String,
          createdAt: entry['created_at'] as String,
          rating: entry['rating'] as int?,
          prompts: (entry['prompts'] as Map?)?.cast<String, dynamic>() ?? {},
          displayName: nameById[entry['user_id']],
          thumbnailUrl: thumbByEntry[entry['id']],
          reactionCount: reactionCounts[entry['id']] ?? 0,
          commentCount: commentCounts[entry['id']] ?? 0,
          videoUrl: entry['video_url'] as String?,
        ),
    ];

    final last = entries.last;
    final nextCursor = entries.length == pageSize
        ? FeedCursor(createdAt: last['created_at'] as String)
        : null;

    return FeedPage(entries: feedEntries, nextCursor: nextCursor);
  }
}

final feedService = FeedService();
