import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/feed_models.dart';
import '../models/friend_models.dart';
import '../services/feed_service.dart';
import '../services/friends_service.dart';
import '../theme.dart';
import '../widgets/night_widgets.dart';
import '../widgets/social_widgets.dart';
import 'entry_detail_screen.dart';
import 'notifications_leaderboard_screens.dart';

class FeedScreen extends StatefulWidget {
  const FeedScreen({super.key});

  @override
  State<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends State<FeedScreen> {
  final _scroll = ScrollController();
  final _entries = <FeedEntry>[];
  FeedCursor? _cursor;
  bool _loading = true;
  bool _loadingMore = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _load(refresh: true);
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels >= _scroll.position.maxScrollExtent - 300) {
      _loadMore();
    }
  }

  Future<void> _load({bool refresh = false}) async {
    if (refresh) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }
    try {
      final page = await feedService.fetchPage();
      if (!mounted) return;
      setState(() {
        _entries
          ..clear()
          ..addAll(page.entries);
        _cursor = page.nextCursor;
        _loading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _error = 'Could not load feed.';
          _loading = false;
        });
      }
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || _cursor == null) return;
    setState(() => _loadingMore = true);
    try {
      final page = await feedService.fetchPage(cursor: _cursor);
      if (!mounted) return;
      setState(() {
        _entries.addAll(page.entries);
        _cursor = page.nextCursor;
        _loadingMore = false;
      });
    } catch (_) {
      if (mounted) setState(() => _loadingMore = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      title: 'Feed',
      actions: [
        IconButton(
          tooltip: 'Leaderboard',
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const LeaderboardScreen(),
              ),
            );
          },
          icon: const Icon(Icons.emoji_events_outlined),
        ),
        const NotificationBell(),
      ],
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? ErrorCard(message: _error!, onRetry: () => _load(refresh: true))
          : _entries.isEmpty
          ? const EmptyState(
              icon: Icons.local_fire_department,
              title: 'No nights yet',
              body:
                  'Create your first entry or add friends to fill the feed.',
            )
          : RefreshIndicator(
              onRefresh: () => _load(refresh: true),
              child: ListView.separated(
                controller: _scroll,
                itemCount: _entries.length + 1,
                separatorBuilder: (_, _) => const SizedBox(height: 14),
                itemBuilder: (context, index) {
                  if (index >= _entries.length) {
                    if (_loadingMore) {
                      return const Padding(
                        padding: EdgeInsets.all(16),
                        child: Center(child: CircularProgressIndicator()),
                      );
                    }
                    return const SizedBox(height: 8);
                  }
                  return FeedEntryCard(
                    entry: _entries[index],
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute<void>(
                          builder: (_) =>
                              EntryDetailScreen(entryId: _entries[index].id),
                        ),
                      );
                      if (mounted) _load(refresh: true);
                    },
                    onBlocked: () => _load(refresh: true),
                  );
                },
              ),
            ),
    );
  }
}

class FeedEntryCard extends StatelessWidget {
  const FeedEntryCard({
    required this.entry,
    required this.onTap,
    this.onBlocked,
    super.key,
  });

  final FeedEntry entry;
  final VoidCallback onTap;
  final VoidCallback? onBlocked;

  @override
  Widget build(BuildContext context) {
    final date = DateTime.tryParse(entry.dateOfNight);
    return NightCard(
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    entry.displayName ?? 'NightCapt user',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                ReportBlockMenu(
                  reportedUserId: entry.userId,
                  entryId: entry.id,
                  onChanged: onBlocked,
                ),
              ],
            ),
            if (entry.thumbnailUrl != null) ...[
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  entry.thumbnailUrl!,
                  height: 220,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            ],
            if (entry.videoUrl != null && entry.thumbnailUrl == null) ...[
              const SizedBox(height: 14),
              Container(
                height: 180,
                width: double.infinity,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: NightColors.background,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.play_circle_outline, color: NightColors.accent),
                    SizedBox(width: 8),
                    Text('Video attached'),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.star,
                  color: entry.rating == null
                      ? NightColors.muted
                      : NightColors.yellow,
                ),
                const SizedBox(width: 6),
                Text(entry.rating == null ? 'Not rated' : '${entry.rating} / 5'),
                const Spacer(),
                Text(
                  date == null ? '' : DateFormat.yMMMd().format(date),
                  style: const TextStyle(color: NightColors.muted),
                ),
              ],
            ),
            if (entry.mission != null && entry.mission!.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(
                'Mission: ${entry.mission}',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: NightColors.muted),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.local_fire_department, size: 16, color: NightColors.muted),
                const SizedBox(width: 4),
                Text('${entry.reactionCount}'),
                const SizedBox(width: 16),
                const Icon(Icons.chat_bubble_outline, size: 16, color: NightColors.muted),
                const SizedBox(width: 4),
                Text('${entry.commentCount}'),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class FriendsScreen extends StatefulWidget {
  const FriendsScreen({super.key});

  @override
  State<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends State<FriendsScreen> {
  final _search = TextEditingController();
  Timer? _debounce;
  List<UserSearchResult> _results = [];
  List<UserProfile> _friends = [];
  List<UserProfile> _requests = [];
  bool _searching = false;
  bool _loading = true;
  String _query = '';

  @override
  void initState() {
    super.initState();
    _refresh();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
  }

  Future<void> _refresh() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        friendsService.friends(),
        friendsService.incomingRequests(),
      ]);
      if (!mounted) return;
      setState(() {
        _friends = results[0];
        _requests = results[1];
        _loading = false;
      });
      if (_query.length >= 2) _runSearch(_query);
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _onQueryChanged(String value) {
    _debounce?.cancel();
    setState(() => _query = value.trim());
    _debounce = Timer(const Duration(milliseconds: 350), () => _runSearch(value));
  }

  Future<void> _runSearch(String value) async {
    final q = value.trim();
    if (q.length < 2) {
      setState(() {
        _results = [];
        _searching = false;
      });
      return;
    }
    setState(() => _searching = true);
    try {
      final results = await friendsService.search(q);
      if (mounted && _search.text.trim() == q) {
        setState(() => _results = results);
      }
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      title: 'Friends',
      child: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              children: [
                TextField(
                  controller: _search,
                  onChanged: _onQueryChanged,
                  decoration: nightInputDecoration('Search by name or username'),
                ),
                const SizedBox(height: 20),
                if (_query.length >= 2) ...[
                  const _SectionTitle('Search results'),
                  if (!_searching && _results.isEmpty)
                    const _Hint('No users found.')
                  else
                    for (final result in _results)
                      _FriendTile(
                        profile: result.profile,
                        trailing: _searchAction(result),
                      ),
                  const Divider(height: 32),
                ],
                const _SectionTitle('Requests'),
                if (_requests.isEmpty)
                  const _Hint('No pending requests.')
                else
                  for (final profile in _requests)
                    _FriendTile(
                      profile: profile,
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextButton(
                            onPressed: () async {
                              await friendsService.respond(profile.id, accept: true);
                              _refresh();
                            },
                            child: const Text('Accept'),
                          ),
                          IconButton(
                            onPressed: () async {
                              await friendsService.respond(profile.id, accept: false);
                              _refresh();
                            },
                            icon: const Icon(Icons.close, color: NightColors.muted),
                          ),
                        ],
                      ),
                    ),
                const Divider(height: 32),
                const _SectionTitle('Your friends'),
                if (_friends.isEmpty)
                  const _Hint('No friends yet. Search above to add some.')
                else
                  for (final profile in _friends)
                    _FriendTile(
                      profile: profile,
                      trailing: TextButton(
                        onPressed: () async {
                          await friendsService.removeFriend(profile.id);
                          _refresh();
                        },
                        child: const Text('Remove'),
                      ),
                    ),
              ],
            ),
    );
  }

  Widget _searchAction(UserSearchResult result) {
    switch (result.status) {
      case FollowStatus.accepted:
        return const _Pill('Friends');
      case FollowStatus.pendingOut:
        return const _Pill('Requested');
      case FollowStatus.pendingIn:
        return TextButton(
          onPressed: () async {
            await friendsService.respond(result.profile.id, accept: true);
            _refresh();
          },
          child: const Text('Accept'),
        );
      case FollowStatus.none:
      case FollowStatus.rejected:
        return FilledButton(
          onPressed: () async {
            await friendsService.sendRequest(result.profile.id);
            _refresh();
          },
          child: const Text('Add'),
        );
    }
  }
}

class _FriendTile extends StatelessWidget {
  const _FriendTile({required this.profile, required this.trailing});

  final UserProfile profile;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          UserAvatar(name: profile.name, avatarUrl: profile.avatarUrl),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(profile.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                if (profile.username != null)
                  Text(
                    '@${profile.username}',
                    style: const TextStyle(color: NightColors.muted, fontSize: 13),
                  ),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
  );
}

class _Hint extends StatelessWidget {
  const _Hint(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 6),
    child: Text(text, style: const TextStyle(color: NightColors.muted)),
  );
}

class _Pill extends StatelessWidget {
  const _Pill(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
    decoration: BoxDecoration(
      color: NightColors.background,
      borderRadius: BorderRadius.circular(20),
    ),
    child: Text(text, style: const TextStyle(color: NightColors.muted)),
  );
}
