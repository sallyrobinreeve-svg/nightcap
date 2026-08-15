import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/notification_models.dart';

class NotificationsService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<NotificationState> fetch() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) {
      return const NotificationState(notifications: [], lastSeenAt: null);
    }

    final profile = await _client
        .from('profiles')
        .select('last_notifications_seen_at')
        .eq('id', userId)
        .maybeSingle();

    final notifications = await _fetchForUser(userId);
    return NotificationState(
      notifications: notifications,
      lastSeenAt: profile?['last_notifications_seen_at'] as String?,
    );
  }

  Future<int> unreadCount() async {
    final state = await fetch();
    return state.unreadCount;
  }

  Future<void> markRead() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return;
    await _client
        .from('profiles')
        .update({
          'last_notifications_seen_at': DateTime.now().toUtc().toIso8601String(),
        })
        .eq('id', userId);
  }

  Future<List<AppNotification>> _fetchForUser(String userId) async {
    final blockedResults = await Future.wait([
      _client.from('blocks').select('blocked_id').eq('blocker_id', userId),
      _client.from('blocks').select('blocker_id').eq('blocked_id', userId),
    ]);

    final blockedIds = <String>{
      for (final row in blockedResults[0] as List) row['blocked_id'] as String,
      for (final row in blockedResults[1] as List) row['blocker_id'] as String,
    };

    final myEntries = await _client
        .from('entries')
        .select('id, date_of_night')
        .eq('user_id', userId);

    final entryIds = [
      for (final entry in myEntries as List) entry['id'] as String,
    ];
    final entryDateMap = {
      for (final entry in myEntries as List)
        entry['id'] as String: entry['date_of_night'] as String,
    };

    final activity = await Future.wait([
      entryIds.isEmpty
          ? Future.value(<Map<String, dynamic>>[])
          : _client
                .from('reactions')
                .select('id, entry_id, user_id, type, created_at')
                .inFilter('entry_id', entryIds)
                .neq('user_id', userId)
                .order('created_at', ascending: false)
                .limit(50)
                .then((rows) => (rows as List).cast<Map<String, dynamic>>()),
      entryIds.isEmpty
          ? Future.value(<Map<String, dynamic>>[])
          : _client
                .from('comments')
                .select('id, entry_id, user_id, content, created_at')
                .inFilter('entry_id', entryIds)
                .neq('user_id', userId)
                .order('created_at', ascending: false)
                .limit(50)
                .then((rows) => (rows as List).cast<Map<String, dynamic>>()),
      _client
          .from('follows')
          .select('follower_id, created_at')
          .eq('following_id', userId)
          .eq('status', 'pending')
          .order('created_at', ascending: false)
          .then((rows) => (rows as List).cast<Map<String, dynamic>>()),
    ]);

    final reactions = activity[0];
    final comments = activity[1];
    final pendingFollows = activity[2];

    final actorIds = <String>{};
    for (final row in reactions) {
      if (!blockedIds.contains(row['user_id'])) {
        actorIds.add(row['user_id'] as String);
      }
    }
    for (final row in comments) {
      if (!blockedIds.contains(row['user_id'])) {
        actorIds.add(row['user_id'] as String);
      }
    }
    for (final row in pendingFollows) {
      if (!blockedIds.contains(row['follower_id'])) {
        actorIds.add(row['follower_id'] as String);
      }
    }

    final profiles = actorIds.isEmpty
        ? <Map<String, dynamic>>[]
        : await _client
              .from('profiles')
              .select('id, display_name, username, avatar_url')
              .inFilter('id', actorIds.toList())
              .then((rows) => (rows as List).cast<Map<String, dynamic>>());

    final profileMap = {for (final profile in profiles) profile['id'] as String: profile};
    final notifications = <AppNotification>[];

    String actorName(Map<String, dynamic> profile) {
      final displayName = profile['display_name'] as String?;
      final username = profile['username'] as String?;
      if (displayName?.trim().isNotEmpty == true) return displayName!.trim();
      if (username?.trim().isNotEmpty == true) return '@$username';
      return 'NightCapt user';
    }

    for (final reaction in reactions) {
      final actorId = reaction['user_id'] as String;
      if (blockedIds.contains(actorId)) continue;
      final actor = profileMap[actorId];
      if (actor == null) continue;
      notifications.add(
        AppNotification(
          id: 'reaction:${reaction['id']}',
          type: NotificationType.reaction,
          actorId: actorId,
          actorName: actorName(actor),
          actorAvatarUrl: actor['avatar_url'] as String?,
          createdAt: reaction['created_at'] as String,
          entryId: reaction['entry_id'] as String,
          entryDate: entryDateMap[reaction['entry_id']],
          reactionType: reaction['type'] as String,
        ),
      );
    }

    for (final comment in comments) {
      final actorId = comment['user_id'] as String;
      if (blockedIds.contains(actorId)) continue;
      final actor = profileMap[actorId];
      if (actor == null) continue;
      final content = comment['content'] as String;
      notifications.add(
        AppNotification(
          id: 'comment:${comment['id']}',
          type: NotificationType.comment,
          actorId: actorId,
          actorName: actorName(actor),
          actorAvatarUrl: actor['avatar_url'] as String?,
          createdAt: comment['created_at'] as String,
          entryId: comment['entry_id'] as String,
          entryDate: entryDateMap[comment['entry_id']],
          commentPreview: content.length > 120 ? content.substring(0, 120) : content,
        ),
      );
    }

    for (final follow in pendingFollows) {
      final actorId = follow['follower_id'] as String;
      if (blockedIds.contains(actorId)) continue;
      final actor = profileMap[actorId];
      if (actor == null) continue;
      notifications.add(
        AppNotification(
          id: 'follow:$actorId',
          type: NotificationType.followRequest,
          actorId: actorId,
          actorName: actorName(actor),
          actorAvatarUrl: actor['avatar_url'] as String?,
          createdAt: follow['created_at'] as String,
        ),
      );
    }

    notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return notifications;
  }
}

final notificationsService = NotificationsService();
