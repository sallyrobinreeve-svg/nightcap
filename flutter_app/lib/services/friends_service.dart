import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/friend_models.dart';

class FriendsService {
  SupabaseClient get _client => Supabase.instance.client;
  String get _me => _client.auth.currentUser!.id;

  Future<List<UserProfile>> _profilesByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    final rows = await _client
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio')
        .inFilter('id', ids);
    return [
      for (final row in rows as List)
        UserProfile.fromRow(row as Map<String, dynamic>),
    ];
  }

  Future<List<UserProfile>> friends() async {
    final rows = await _client
        .from('follows')
        .select('follower_id, following_id, status')
        .eq('status', 'accepted')
        .or('follower_id.eq.$_me,following_id.eq.$_me');

    final ids = <String>{};
    for (final row in rows as List) {
      final follower = row['follower_id'] as String;
      final following = row['following_id'] as String;
      ids.add(follower == _me ? following : follower);
    }
    ids.remove(_me);
    return _profilesByIds(ids.toList());
  }

  Future<List<UserProfile>> incomingRequests() async {
    final rows = await _client
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', _me)
        .eq('status', 'pending')
        .order('created_at', ascending: false);

    final ids = [
      for (final row in rows as List) row['follower_id'] as String,
    ];
    final profiles = await _profilesByIds(ids);
    final byId = {for (final profile in profiles) profile.id: profile};
    return [for (final id in ids) if (byId[id] != null) byId[id]!];
  }

  Future<List<UserSearchResult>> search(String query) async {
    final q = query.trim();
    if (q.length < 2) return [];

    final pattern = '%$q%';
    final rows = await _client
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio')
        .neq('id', _me)
        .or('display_name.ilike.$pattern,username.ilike.$pattern')
        .limit(20);

    final profiles = [
      for (final row in rows as List)
        UserProfile.fromRow(row as Map<String, dynamic>),
    ];
    if (profiles.isEmpty) return [];

    final ids = [for (final profile in profiles) profile.id];
    final outgoing = await _client
        .from('follows')
        .select('following_id, status')
        .eq('follower_id', _me)
        .inFilter('following_id', ids);
    final incoming = await _client
        .from('follows')
        .select('follower_id, status')
        .eq('following_id', _me)
        .inFilter('follower_id', ids);

    final outByUser = {
      for (final row in outgoing as List)
        row['following_id'] as String: row['status'] as String?,
    };
    final inByUser = {
      for (final row in incoming as List)
        row['follower_id'] as String: row['status'] as String?,
    };

    return [
      for (final profile in profiles)
        UserSearchResult(
          profile: profile,
          status: deriveFollowStatus(outByUser[profile.id], inByUser[profile.id]),
        ),
    ];
  }

  Future<void> sendRequest(String userId) async {
    final existing = await _client
        .from('follows')
        .select('status')
        .eq('follower_id', _me)
        .eq('following_id', userId)
        .maybeSingle();

    final status = existing?['status'] as String?;
    if (status == 'accepted' || status == 'pending') return;

    if (status == 'rejected') {
      await _client
          .from('follows')
          .update({'status': 'pending'})
          .eq('follower_id', _me)
          .eq('following_id', userId);
      return;
    }

    try {
      await _client.from('follows').insert({
        'follower_id': _me,
        'following_id': userId,
        'status': 'pending',
      });
    } on PostgrestException catch (error) {
      if (error.code != '23505') rethrow;
    }
  }

  Future<void> respond(String userId, {required bool accept}) async {
    if (!accept) {
      await _client
          .from('follows')
          .update({'status': 'rejected'})
          .eq('follower_id', userId)
          .eq('following_id', _me);
      return;
    }

    await _client
        .from('follows')
        .update({'status': 'accepted'})
        .eq('follower_id', userId)
        .eq('following_id', _me);

    final reverse = await _client
        .from('follows')
        .select('status')
        .eq('follower_id', _me)
        .eq('following_id', userId)
        .maybeSingle();

    if (reverse != null) {
      await _client
          .from('follows')
          .update({'status': 'accepted'})
          .eq('follower_id', _me)
          .eq('following_id', userId);
    } else {
      await _client.from('follows').insert({
        'follower_id': _me,
        'following_id': userId,
        'status': 'accepted',
      });
    }
  }

  Future<void> removeFriend(String userId) async {
    await _client
        .from('follows')
        .delete()
        .eq('follower_id', _me)
        .eq('following_id', userId);
    try {
      await _client
          .from('follows')
          .delete()
          .eq('follower_id', userId)
          .eq('following_id', _me);
    } catch (_) {}
  }
}

final friendsService = FriendsService();
