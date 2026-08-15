import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../supabase_providers.dart';
import 'feed_entry.dart';

/// Reads the friend feed with keyset pagination, mirroring the web backend:
/// query only self + accepted friends (minus blocked) at the database, ordered
/// by (date_of_night desc, id desc). Row-level security further restricts which
/// entries are visible (own + public + friends-only).
class FeedRepository {
  FeedRepository(this._client);

  final SupabaseClient _client;

  static const pageSize = 15;

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

  Future<FeedPage> fetchPage({
    required String userId,
    FeedCursor? cursor,
  }) async {
    final audience = await _audienceIds(userId);
    if (audience.isEmpty) {
      return const FeedPage(entries: [], nextCursor: null);
    }

    var filter = _client
        .from('entries')
        .select('id, user_id, date_of_night, rating, prompts, created_at')
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

    final entryIds = [for (final e in entries) e['id'] as String];
    final userIds = {for (final e in entries) e['user_id'] as String}.toList();

    final results = await Future.wait([
      _client.from('profiles').select('id, display_name, avatar_url').inFilter('id', userIds),
      _client.from('photos').select('entry_id, type, url').inFilter('entry_id', entryIds),
      _client.from('reactions').select('entry_id').inFilter('entry_id', entryIds),
      _client.from('comments').select('entry_id').inFilter('entry_id', entryIds),
    ]);

    final profiles = (results[0] as List).cast<Map<String, dynamic>>();
    final photos = (results[1] as List).cast<Map<String, dynamic>>();
    final reactions = (results[2] as List).cast<Map<String, dynamic>>();
    final comments = (results[3] as List).cast<Map<String, dynamic>>();

    final nameById = {
      for (final p in profiles) p['id'] as String: p['display_name'] as String?,
    };

    final thumbByEntry = <String, String>{};
    for (final p in photos) {
      final type = p['type'] as String?;
      final entryId = p['entry_id'] as String;
      if ((type == 'favourite' || type == 'outfit') && !thumbByEntry.containsKey(entryId)) {
        thumbByEntry[entryId] = p['url'] as String;
      }
    }

    final reactionCounts = <String, int>{};
    for (final r in reactions) {
      final id = r['entry_id'] as String;
      reactionCounts[id] = (reactionCounts[id] ?? 0) + 1;
    }

    final commentCounts = <String, int>{};
    for (final c in comments) {
      final id = c['entry_id'] as String;
      commentCounts[id] = (commentCounts[id] ?? 0) + 1;
    }

    final feedEntries = [
      for (final e in entries)
        FeedEntry(
          id: e['id'] as String,
          userId: e['user_id'] as String,
          dateOfNight: e['date_of_night'] as String,
          createdAt: e['created_at'] as String,
          rating: e['rating'] as int?,
          prompts: (e['prompts'] as Map?)?.cast<String, dynamic>() ?? {},
          displayName: nameById[e['user_id']],
          thumbnailUrl: thumbByEntry[e['id']],
          reactionCount: reactionCounts[e['id']] ?? 0,
          commentCount: commentCounts[e['id']] ?? 0,
        ),
    ];

    final last = entries.last;
    final nextCursor = entries.length == pageSize
        ? FeedCursor(createdAt: last['created_at'] as String)
        : null;

    return FeedPage(entries: feedEntries, nextCursor: nextCursor);
  }
}

final feedRepositoryProvider = Provider<FeedRepository>(
  (ref) => FeedRepository(ref.watch(supabaseProvider)),
);
