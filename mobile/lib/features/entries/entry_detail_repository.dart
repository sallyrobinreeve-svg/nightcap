import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../supabase_providers.dart';
import 'entry_detail.dart';

class EntryDetailRepository {
  EntryDetailRepository(this._client);

  final SupabaseClient _client;

  Future<EntryDetail> fetch(String entryId) async {
    final userId = _client.auth.currentUser?.id;

    final entry = await _client
        .from('entries')
        .select('id, user_id, date_of_night, rating, prompts, created_at')
        .eq('id', entryId)
        .maybeSingle();

    if (entry == null) {
      throw StateError('Entry not found or not visible.');
    }

    final authorId = entry['user_id'] as String;

    final results = await Future.wait<dynamic>([
      _client.from('profiles').select('display_name').eq('id', authorId).maybeSingle(),
      _client.from('photos').select('type, url').eq('entry_id', entryId),
      _client
          .from('timeline_steps')
          .select('type, location_name, time_at, notes, sort_order')
          .eq('entry_id', entryId)
          .order('sort_order', ascending: true),
      _client.from('reactions').select('user_id, type').eq('entry_id', entryId),
      _client
          .from('comments')
          .select('id, user_id, content, created_at')
          .eq('entry_id', entryId)
          .order('created_at', ascending: true),
    ]);

    final author = results[0] as Map<String, dynamic>?;
    final photos = (results[1] as List).cast<Map<String, dynamic>>();
    final timelineRows = (results[2] as List).cast<Map<String, dynamic>>();
    final reactions = (results[3] as List).cast<Map<String, dynamic>>();
    final commentRows = (results[4] as List).cast<Map<String, dynamic>>();

    final photoUrls = [
      for (final p in photos)
        if (p['type'] == 'favourite' || p['type'] == 'outfit') p['url'] as String,
    ];

    final timeline = [
      for (final t in timelineRows)
        TimelineStep(
          type: t['type'] as String,
          locationName: t['location_name'] as String?,
          timeAt: t['time_at'] as String?,
          notes: t['notes'] as String?,
        ),
    ];

    final reactionCounts = <String, int>{};
    String? myReactionType;
    for (final r in reactions) {
      final type = r['type'] as String;
      reactionCounts[type] = (reactionCounts[type] ?? 0) + 1;
      if (r['user_id'] == userId) myReactionType = type;
    }

    // Resolve commenter display names in one query.
    final commenterIds = {for (final c in commentRows) c['user_id'] as String}.toList();
    final nameById = <String, String?>{};
    if (commenterIds.isNotEmpty) {
      final profiles = await _client
          .from('profiles')
          .select('id, display_name')
          .inFilter('id', commenterIds);
      for (final p in (profiles as List).cast<Map<String, dynamic>>()) {
        nameById[p['id'] as String] = p['display_name'] as String?;
      }
    }

    final comments = [
      for (final c in commentRows)
        EntryComment(
          id: c['id'] as String,
          userId: c['user_id'] as String,
          content: c['content'] as String,
          createdAt: c['created_at'] as String,
          authorName: nameById[c['user_id']],
        ),
    ];

    return EntryDetail(
      id: entry['id'] as String,
      userId: authorId,
      dateOfNight: entry['date_of_night'] as String,
      rating: entry['rating'] as int?,
      prompts: (entry['prompts'] as Map?)?.cast<String, dynamic>() ?? {},
      authorName: author?['display_name'] as String?,
      photoUrls: photoUrls,
      timeline: timeline,
      reactionCounts: reactionCounts,
      myReactionType: myReactionType,
      comments: comments,
      isMine: authorId == userId,
      currentUserId: userId,
    );
  }

  /// Sets [type] as the user's reaction, or clears it if they tap the one they
  /// already have. The table allows a single reaction per (entry, user).
  Future<void> toggleReaction({
    required String entryId,
    required String type,
    required String? currentType,
  }) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;

    if (currentType == type) {
      await _client.from('reactions').delete().eq('entry_id', entryId).eq('user_id', userId);
    } else {
      await _client.from('reactions').upsert(
        {'entry_id': entryId, 'user_id': userId, 'type': type},
        onConflict: 'entry_id,user_id',
      );
    }
  }

  Future<void> addComment({required String entryId, required String content}) async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    await _client.from('comments').insert({
      'entry_id': entryId,
      'user_id': userId,
      'content': content,
    });
  }

  Future<void> deleteComment(String commentId) async {
    await _client.from('comments').delete().eq('id', commentId);
  }
}

final entryDetailRepositoryProvider = Provider<EntryDetailRepository>(
  (ref) => EntryDetailRepository(ref.watch(supabaseProvider)),
);

/// Detail for a single entry, keyed by entry id.
final entryDetailProvider =
    FutureProvider.family<EntryDetail, String>((ref, entryId) {
  return ref.watch(entryDetailRepositoryProvider).fetch(entryId);
});
