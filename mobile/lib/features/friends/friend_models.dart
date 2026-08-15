enum FollowStatus { none, pendingOut, pendingIn, accepted, rejected }

class Profile {
  const Profile({required this.id, required this.displayName, this.avatarUrl});

  final String id;
  final String? displayName;
  final String? avatarUrl;

  String get name => displayName?.trim().isNotEmpty == true ? displayName! : 'Anonymous';

  factory Profile.fromRow(Map<String, dynamic> row) => Profile(
        id: row['id'] as String,
        displayName: row['display_name'] as String?,
        avatarUrl: row['avatar_url'] as String?,
      );
}

class UserSearchResult {
  const UserSearchResult({required this.profile, required this.status});
  final Profile profile;
  final FollowStatus status;
}

/// Derives the relationship between the current user and another user from the
/// outgoing (me -> them) and incoming (them -> me) follow rows. Mirrors the web
/// app's `deriveFollowStatus`.
FollowStatus deriveFollowStatus(String? outgoing, String? incoming) {
  if (outgoing == 'accepted' || incoming == 'accepted') return FollowStatus.accepted;
  if (outgoing == 'pending') return FollowStatus.pendingOut;
  if (incoming == 'pending') return FollowStatus.pendingIn;
  if (outgoing == 'rejected' || incoming == 'rejected') return FollowStatus.rejected;
  return FollowStatus.none;
}
