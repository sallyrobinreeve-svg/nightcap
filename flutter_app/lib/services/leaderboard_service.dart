import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/leaderboard_models.dart';

class LeaderboardService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<List<LeaderboardEntry>> fetch() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final follows = await _client
        .from('follows')
        .select('follower_id, following_id, status')
        .eq('status', 'accepted')
        .or('follower_id.eq.$userId,following_id.eq.$userId');

    final friendIds = <String>{};
    for (final row in follows as List) {
      final follower = row['follower_id'] as String;
      final following = row['following_id'] as String;
      friendIds.add(follower == userId ? following : follower);
    }

    final allIds = [userId, ...friendIds];
    final results = await Future.wait([
      _client
          .from('profiles')
          .select('id, display_name, username, avatar_url')
          .inFilter('id', allIds),
      _client
          .from('user_stats')
          .select(
            'user_id, total_entries, avg_rating, kiss_count, missions_completed, top_club_visits',
          )
          .inFilter('user_id', allIds),
    ]);

    final profiles = (results[0] as List).cast<Map<String, dynamic>>();
    final stats = (results[1] as List).cast<Map<String, dynamic>>();
    final statsByUser = {for (final row in stats) row['user_id'] as String: row};

    return [
      for (final profile in profiles)
        LeaderboardEntry(
          userId: profile['id'] as String,
          displayName: profile['display_name'] as String? ?? 'Unknown',
          avatarUrl: profile['avatar_url'] as String?,
          isMe: profile['id'] == userId,
          totalEntries: statsByUser[profile['id']]?['total_entries'] as int? ?? 0,
          avgRating: (statsByUser[profile['id']]?['avg_rating'] as num?)?.toDouble(),
          kissCount: statsByUser[profile['id']]?['kiss_count'] as int? ?? 0,
          missionsCompleted:
              statsByUser[profile['id']]?['missions_completed'] as int? ?? 0,
          topClubVisits:
              statsByUser[profile['id']]?['top_club_visits'] as int? ?? 0,
        ),
    ];
  }
}

final leaderboardService = LeaderboardService();
