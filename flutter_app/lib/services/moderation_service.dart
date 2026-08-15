import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';

SupabaseClient get _client => Supabase.instance.client;

class ModerationService {
  Future<void> report({
    required String reportedUserId,
    String? entryId,
    String? commentId,
    String? reason,
  }) async {
    final token = _client.auth.currentSession?.accessToken;
    if (token == null) throw StateError('Not signed in');

    final response = await http.post(
      Uri.parse('${appConfig.siteUrl}/api/report'),
      headers: {
        'authorization': 'Bearer $token',
        'content-type': 'application/json',
      },
      body: jsonEncode({
        'reported_user_id': reportedUserId,
        if (entryId != null) 'entry_id': entryId,
        if (commentId != null) 'comment_id': commentId,
        if (reason != null) 'reason': reason,
      }),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Report failed');
    }
  }

  Future<void> block(String blockedUserId) async {
    final token = _client.auth.currentSession?.accessToken;
    if (token == null) throw StateError('Not signed in');

    final response = await http.post(
      Uri.parse('${appConfig.siteUrl}/api/block'),
      headers: {
        'authorization': 'Bearer $token',
        'content-type': 'application/json',
      },
      body: jsonEncode({'blocked_id': blockedUserId}),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Block failed');
    }
  }

  Future<void> unblock(String blockedUserId) async {
    final token = _client.auth.currentSession?.accessToken;
    if (token == null) throw StateError('Not signed in');

    final response = await http.delete(
      Uri.parse(
        '${appConfig.siteUrl}/api/block?blocked_id=$blockedUserId',
      ),
      headers: {'authorization': 'Bearer $token'},
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception('Unblock failed');
    }
  }

  Future<Set<String>> blockedUserIds() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return {};
    final rows = await _client
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);
    return {
      for (final row in rows as List) row['blocked_id'] as String,
    };
  }

  Future<bool> isBlocked(String userId) async {
    final blocked = await blockedUserIds();
    return blocked.contains(userId);
  }
}

final moderationService = ModerationService();
