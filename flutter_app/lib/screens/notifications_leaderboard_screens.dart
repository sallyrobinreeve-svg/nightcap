import 'package:flutter/material.dart';

import '../models/leaderboard_models.dart';
import '../models/notification_models.dart';
import '../services/friends_service.dart';
import '../services/leaderboard_service.dart';
import '../services/notifications_service.dart';
import '../theme.dart';
import '../widgets/night_widgets.dart';
import 'entry_detail_screen.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  late Future<NotificationState> _future = notificationsService.fetch();

  void _reload() => setState(() => _future = notificationsService.fetch());

  @override
  void initState() {
    super.initState();
    notificationsService.markRead();
  }

  String _message(AppNotification notification) {
    return switch (notification.type) {
      NotificationType.reaction =>
        'reacted ${notification.reactionType ?? ''} to your recap',
      NotificationType.comment =>
        'commented: "${notification.commentPreview ?? ''}"',
      NotificationType.followRequest => 'sent you a friend request',
    };
  }

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      title: 'Notifications',
      child: FutureBuilder<NotificationState>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final items = snapshot.data!.notifications;
          if (items.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_none,
              title: 'All caught up',
              body: 'Reactions, comments, and friend requests will show up here.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView.separated(
              itemCount: items.length,
              separatorBuilder: (_, _) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final item = items[index];
                return NightCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      UserAvatar(
                        name: item.actorName,
                        avatarUrl: item.actorAvatarUrl,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              text: TextSpan(
                                style: const TextStyle(color: Colors.white),
                                children: [
                                  TextSpan(
                                    text: item.actorName,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: NightColors.accent,
                                    ),
                                  ),
                                  TextSpan(text: ' ${_message(item)}'),
                                ],
                              ),
                            ),
                            if (item.entryDate != null)
                              Text(
                                item.entryDate!,
                                style: const TextStyle(
                                  color: NightColors.muted,
                                  fontSize: 12,
                                ),
                              ),
                            if (item.type == NotificationType.followRequest) ...[
                              const SizedBox(height: 8),
                              Row(
                                children: [
                                  FilledButton(
                                    onPressed: () async {
                                      await friendsService.respond(
                                        item.actorId,
                                        accept: true,
                                      );
                                      _reload();
                                    },
                                    child: const Text('Accept'),
                                  ),
                                  const SizedBox(width: 8),
                                  OutlinedButton(
                                    onPressed: () async {
                                      await friendsService.respond(
                                        item.actorId,
                                        accept: false,
                                      );
                                      _reload();
                                    },
                                    child: const Text('Decline'),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),
                      if (item.entryId != null)
                        IconButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute<void>(
                                builder: (_) =>
                                    EntryDetailScreen(entryId: item.entryId!),
                              ),
                            );
                          },
                          icon: const Icon(Icons.chevron_right),
                        ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class LeaderboardScreen extends StatefulWidget {
  const LeaderboardScreen({super.key});

  @override
  State<LeaderboardScreen> createState() => _LeaderboardScreenState();
}

class _LeaderboardScreenState extends State<LeaderboardScreen> {
  late Future<List<LeaderboardEntry>> _future = leaderboardService.fetch();
  LeaderboardSort sort = LeaderboardSort.entries;

  void _reload() => setState(() => _future = leaderboardService.fetch());

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      title: 'Leaderboard',
      child: FutureBuilder<List<LeaderboardEntry>>(
        future: _future,
        builder: (context, snapshot) {
          if (!snapshot.hasData) {
            return const Center(child: CircularProgressIndicator());
          }
          final entries = [...snapshot.data!];
          if (entries.length <= 1) {
            return const EmptyState(
              icon: Icons.emoji_events_outlined,
              title: 'No rivals yet',
              body: 'Add friends to compare stats on the leaderboard.',
            );
          }

          entries.sort((a, b) => sort.sortValue(b).compareTo(sort.sortValue(a)));

          return RefreshIndicator(
            onRefresh: () async => _reload(),
            child: ListView(
              children: [
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: LeaderboardSort.values.map((value) {
                    return ChoiceChip(
                      label: Text(value.title),
                      selected: sort == value,
                      onSelected: (_) => setState(() => sort = value),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 16),
                for (var i = 0; i < entries.length; i++)
                  NightCard(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      children: [
                        Text(
                          '#${i + 1}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: NightColors.accent,
                          ),
                        ),
                        const SizedBox(width: 12),
                        UserAvatar(
                          name: entries[i].displayName,
                          avatarUrl: entries[i].avatarUrl,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                entries[i].isMe
                                    ? '${entries[i].displayName} (you)'
                                    : entries[i].displayName,
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text(
                                sort.formatValue(entries[i]),
                                style: const TextStyle(color: NightColors.muted),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class NotificationBell extends StatefulWidget {
  const NotificationBell({super.key});

  @override
  State<NotificationBell> createState() => _NotificationBellState();
}

class _NotificationBellState extends State<NotificationBell> {
  int unread = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final count = await notificationsService.unreadCount();
    if (mounted) setState(() => unread = count);
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: 'Notifications',
      onPressed: () async {
        await Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (_) => const NotificationsScreen()),
        );
        _load();
      },
      icon: Badge(
        isLabelVisible: unread > 0,
        label: Text('$unread'),
        child: const Icon(Icons.notifications_outlined),
      ),
    );
  }
}
