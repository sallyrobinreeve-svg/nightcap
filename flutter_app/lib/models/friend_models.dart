enum FollowStatus { none, pendingOut, pendingIn, accepted, rejected }

class UserProfile {
  const UserProfile({
    required this.id,
    this.displayName,
    this.username,
    this.avatarUrl,
    this.bio,
  });

  final String id;
  final String? displayName;
  final String? username;
  final String? avatarUrl;
  final String? bio;

  String get name {
    if (displayName?.trim().isNotEmpty == true) return displayName!.trim();
    if (username?.trim().isNotEmpty == true) return '@${username!.trim()}';
    return 'NightCapt user';
  }

  factory UserProfile.fromRow(Map<String, dynamic> row) => UserProfile(
    id: row['id'] as String,
    displayName: row['display_name'] as String?,
    username: row['username'] as String?,
    avatarUrl: row['avatar_url'] as String?,
    bio: row['bio'] as String?,
  );
}

class UserSearchResult {
  const UserSearchResult({required this.profile, required this.status});

  final UserProfile profile;
  final FollowStatus status;
}

FollowStatus deriveFollowStatus(String? outgoing, String? incoming) {
  if (outgoing == 'accepted' || incoming == 'accepted') {
    return FollowStatus.accepted;
  }
  if (outgoing == 'pending') return FollowStatus.pendingOut;
  if (incoming == 'pending') return FollowStatus.pendingIn;
  if (outgoing == 'rejected' || incoming == 'rejected') {
    return FollowStatus.rejected;
  }
  return FollowStatus.none;
}
