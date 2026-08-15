import 'package:supabase_flutter/supabase_flutter.dart';

import '../models/friend_models.dart';

class ProfileService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<UserProfile?> currentProfile() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;
    final row = await _client
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio')
        .eq('id', userId)
        .maybeSingle();
    if (row == null) return null;
    return UserProfile.fromRow(row);
  }

  Future<UserProfile?> fetchProfile(String userId) async {
    final row = await _client
        .from('profiles')
        .select('id, display_name, username, avatar_url, bio')
        .eq('id', userId)
        .maybeSingle();
    if (row == null) return null;
    return UserProfile.fromRow(row);
  }

  Future<void> updateProfile({
    String? displayName,
    String? username,
    String? bio,
    String? avatarUrl,
  }) async {
    final userId = _client.auth.currentUser!.id;
    final updates = <String, dynamic>{};
    if (displayName != null) updates['display_name'] = displayName.trim();
    if (username != null) {
      final normalized = username.trim().toLowerCase();
      if (normalized.isNotEmpty) updates['username'] = normalized;
    }
    if (bio != null) updates['bio'] = bio.trim();
    if (avatarUrl != null) updates['avatar_url'] = avatarUrl;
    if (updates.isEmpty) return;
    await _client.from('profiles').update(updates).eq('id', userId);
  }

  Future<bool> isUsernameAvailable(String username, {String? exceptUserId}) async {
    final normalized = username.trim().toLowerCase();
    if (normalized.length < 3) return false;
    final row = await _client
        .from('profiles')
        .select('id')
        .eq('username', normalized)
        .maybeSingle();
    if (row == null) return true;
    return exceptUserId != null && row['id'] == exceptUserId;
  }
}

final profileService = ProfileService();
