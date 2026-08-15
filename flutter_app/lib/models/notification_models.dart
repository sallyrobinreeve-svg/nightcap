class AppNotification {
  const AppNotification({
    required this.id,
    required this.type,
    required this.actorId,
    required this.actorName,
    this.actorAvatarUrl,
    required this.createdAt,
    this.entryId,
    this.entryDate,
    this.reactionType,
    this.commentPreview,
  });

  final String id;
  final NotificationType type;
  final String actorId;
  final String actorName;
  final String? actorAvatarUrl;
  final String createdAt;
  final String? entryId;
  final String? entryDate;
  final String? reactionType;
  final String? commentPreview;
}

enum NotificationType { reaction, comment, followRequest }

class NotificationState {
  const NotificationState({
    required this.notifications,
    required this.lastSeenAt,
  });

  final List<AppNotification> notifications;
  final String? lastSeenAt;

  int get unreadCount {
    if (lastSeenAt == null) return notifications.length;
    final seen = DateTime.tryParse(lastSeenAt!) ?? DateTime.fromMillisecondsSinceEpoch(0);
    return notifications.where((n) {
      final created = DateTime.tryParse(n.createdAt);
      return created != null && created.isAfter(seen);
    }).length;
  }
}
