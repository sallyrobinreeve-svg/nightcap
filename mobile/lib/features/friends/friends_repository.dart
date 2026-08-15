import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../supabase_providers.dart';
import 'friend_models.dart';

/// All follow/friend operations, mirroring the web API semantics (pending →
/// accepted requests, mutual accept, search with derived status). Row-level
/// security restricts inserts/updates to the appropriate side of the row.
class FriendsRepository {
  FriendsRepository(this._client);

  final SupabaseClient _client;

  String get _me => _client.auth.currentUser!.id;

  Future<List<Profile>> _profilesByIds(List<String> ids) async {
    if (ids.isEmpty) return [];
    final rows = await _client
        .from('profiles')
        .select('id, display_name, avatar_url')
        .inFilter('id', ids);
    return [for (final r in (rows as List).cast<Map<String, dynamic>>()) Profile.fromRow(r)];
  }

  Future<List<Profile>> friends() async {
    final me = _me;
    final rows = await _client
        .from('follows')
        .select('follower_id, following_id, status')
        .eq('status', 'accepted')
        .or('follower_id.eq.$me,following_id.eq.$me');

    final ids = <String>{};
    for (final r in (rows as List).cast<Map<String, dynamic>>()) {
      final follower = r['follower_id'] as String;
      final following = r['following_id'] as String;
      ids.add(follower == me ? following : follower);
    }
    ids.remove(me);
    return _profilesByIds(ids.toList());
  }

  Future<List<Profile>> incomingRequests() async {
    final rows = await _client
        .from('follows')
        .select('follower_id, created_at')
        .eq('following_id', _me)
        .eq('status', 'pending')
        .order('created_at', ascending: false);

    final ids = [for (final r in (rows as List).cast<Map<String, dynamic>>()) r['follower_id'] as String];
    final profiles = await _profilesByIds(ids);
    final byId = {for (final p in profiles) p.id: p};
    return [for (final id in ids) if (byId[id] != null) byId[id]!];
  }

  Future<List<UserSearchResult>> search(String query) async {
    final q = query.trim();
    if (q.length < 2) return [];
    final me = _me;

    final rows = await _client
        .from('profiles')
        .select('id, display_name, avatar_url')
        .neq('id', me)
        .ilike('display_name', '%$q%')
        .limit(20);

    final profiles = [for (final r in (rows as List).cast<Map<String, dynamic>>()) Profile.fromRow(r)];
    if (profiles.isEmpty) return [];

    final ids = [for (final p in profiles) p.id];
    final outgoing = await _client
        .from('follows')
        .select('following_id, status')
        .eq('follower_id', me)
        .inFilter('following_id', ids);
    final incoming = await _client
        .from('follows')
        .select('follower_id, status')
        .eq('following_id', me)
        .inFilter('follower_id', ids);

    final outByUser = {
      for (final r in (outgoing as List).cast<Map<String, dynamic>>())
        r['following_id'] as String: r['status'] as String?,
    };
    final inByUser = {
      for (final r in (incoming as List).cast<Map<String, dynamic>>())
        r['follower_id'] as String: r['status'] as String?,
    };

    return [
      for (final p in profiles)
        UserSearchResult(
          profile: p,
          status: deriveFollowStatus(outByUser[p.id], inByUser[p.id]),
        ),
    ];
  }

  /// Send (or re-send) a follow request.
  Future<void> sendRequest(String userId) async {
    final me = _me;
    final existing = await _client
        .from('follows')
        .select('status')
        .eq('follower_id', me)
        .eq('following_id', userId)
        .maybeSingle();

    final status = existing?['status'] as String?;
    if (status == 'accepted' || status == 'pending') return;

    if (status == 'rejected') {
      await _client
          .from('follows')
          .update({'status': 'pending'})
          .eq('follower_id', me)
          .eq('following_id', userId);
      return;
    }

    try {
      await _client.from('follows').insert({
        'follower_id': me,
        'following_id': userId,
        'status': 'pending',
      });
    } on PostgrestException catch (e) {
      if (e.code != '23505') rethrow; // ignore duplicate (already requested)
    }
  }

  /// Accept or reject an incoming request from [userId].
  Future<void> respond(String userId, {required bool accept}) async {
    final me = _me;

    if (!accept) {
      await _client
          .from('follows')
          .update({'status': 'rejected'})
          .eq('follower_id', userId)
          .eq('following_id', me);
      return;
    }

    await _client
        .from('follows')
        .update({'status': 'accepted'})
        .eq('follower_id', userId)
        .eq('following_id', me);

    // Add the reverse direction so both feeds see each other.
    final reverse = await _client
        .from('follows')
        .select('status')
        .eq('follower_id', me)
        .eq('following_id', userId)
        .maybeSingle();

    if (reverse != null) {
      await _client
          .from('follows')
          .update({'status': 'accepted'})
          .eq('follower_id', me)
          .eq('following_id', userId);
    } else {
      await _client.from('follows').insert({
        'follower_id': me,
        'following_id': userId,
        'status': 'accepted',
      });
    }
  }

  /// Remove a friend / cancel a request. RLS only lets us delete our own
  /// outgoing row; the reverse delete is best-effort.
  Future<void> removeFriend(String userId) async {
    final me = _me;
    await _client.from('follows').delete().eq('follower_id', me).eq('following_id', userId);
    try {
      await _client.from('follows').delete().eq('follower_id', userId).eq('following_id', me);
    } catch (_) {
      // Reverse row is owned by the other user; ignore RLS denial.
    }
  }
}

final friendsRepositoryProvider = Provider<FriendsRepository>(
  (ref) => FriendsRepository(ref.watch(supabaseProvider)),
);

final friendsListProvider = FutureProvider.autoDispose<List<Profile>>(
  (ref) => ref.watch(friendsRepositoryProvider).friends(),
);

final friendRequestsProvider = FutureProvider.autoDispose<List<Profile>>(
  (ref) => ref.watch(friendsRepositoryProvider).incomingRequests(),
);
