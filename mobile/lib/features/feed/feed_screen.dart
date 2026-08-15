import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../theme.dart';
import '../auth/auth_repository.dart';
import 'feed_controller.dart';
import 'feed_entry.dart';

class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key});

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController
      ..removeListener(_onScroll)
      ..dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients) return;
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 400) {
      ref.read(feedControllerProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final feed = ref.watch(feedControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'NightCapt',
          style: TextStyle(color: kAccent, fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            key: const Key('feed_friends_button'),
            tooltip: 'Friends',
            icon: const Icon(Icons.people_outline),
            onPressed: () => context.push('/friends'),
          ),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authRepositoryProvider).signOut(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        key: const Key('feed_create_fab'),
        backgroundColor: kAccent,
        foregroundColor: Colors.white,
        onPressed: () async {
          final created = await context.push<bool>('/create');
          if (created == true) {
            await ref.read(feedControllerProvider.notifier).refresh();
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('New recap'),
      ),
      body: feed.when(
        loading: () => const Center(child: CircularProgressIndicator(color: kAccent)),
        error: (err, _) => _ErrorView(
          onRetry: () => ref.read(feedControllerProvider.notifier).refresh(),
        ),
        data: (state) {
          if (state.entries.isEmpty) {
            return const _EmptyView();
          }
          return RefreshIndicator(
            color: kAccent,
            onRefresh: () => ref.read(feedControllerProvider.notifier).refresh(),
            child: ListView.separated(
              controller: _scrollController,
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
              itemCount: state.entries.length + 1,
              separatorBuilder: (_, _) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                if (index >= state.entries.length) {
                  return _FeedFooter(loading: state.loadingMore, hasMore: state.hasMore);
                }
                return _EntryCard(entry: state.entries[index]);
              },
            ),
          );
        },
      ),
    );
  }
}

class _EntryCard extends StatelessWidget {
  const _EntryCard({required this.entry});

  final FeedEntry entry;

  String _formattedDate() {
    try {
      final date = DateTime.parse(entry.dateOfNight);
      return DateFormat('EEEE, MMM d, yyyy').format(date);
    } catch (_) {
      return entry.dateOfNight;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: () => context.push('/entries/${entry.id}'),
        child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: 72,
                height: 72,
                child: entry.thumbnailUrl != null
                    ? Image.network(
                        entry.thumbnailUrl!,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => _thumbFallback(),
                      )
                    : _thumbFallback(),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _formattedDate(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (entry.displayName != null) ...[
                    const SizedBox(height: 2),
                    Text('by ${entry.displayName}', style: const TextStyle(color: kAccent, fontSize: 13)),
                  ],
                  if (entry.rating != null) ...[
                    const SizedBox(height: 4),
                    Text('${entry.rating} / 5 stars', style: const TextStyle(color: kMuted, fontSize: 13)),
                  ],
                  if (entry.mission != null && entry.mission!.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Mission: ${entry.mission}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: kMuted, fontSize: 13),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.local_fire_department, size: 16, color: kMuted),
                      const SizedBox(width: 4),
                      Text('${entry.reactionCount}', style: const TextStyle(color: kMuted, fontSize: 13)),
                      const SizedBox(width: 16),
                      const Icon(Icons.chat_bubble_outline, size: 15, color: kMuted),
                      const SizedBox(width: 4),
                      Text('${entry.commentCount}', style: const TextStyle(color: kMuted, fontSize: 13)),
                    ],
                  ),
                ],
              ),
            ),
          ],
          ),
        ),
      ),
    );
  }

  Widget _thumbFallback() {
    return Container(
      color: kBackground,
      alignment: Alignment.center,
      child: Text(
        entry.rating != null ? '${entry.rating}' : '–',
        style: const TextStyle(color: kMuted, fontSize: 22),
      ),
    );
  }
}

class _FeedFooter extends StatelessWidget {
  const _FeedFooter({required this.loading, required this.hasMore});

  final bool loading;
  final bool hasMore;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Center(
        child: loading
            ? const CircularProgressIndicator(color: kAccent)
            : hasMore
                ? const SizedBox.shrink()
                : const Text("You're all caught up.", style: TextStyle(color: kMuted)),
      ),
    );
  }
}

class _EmptyView extends StatelessWidget {
  const _EmptyView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(32),
        child: Text(
          'No recaps yet. Tap "New recap" to capture your first night.',
          textAlign: TextAlign.center,
          style: TextStyle(color: kMuted, fontSize: 16),
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.onRetry});

  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('Failed to load feed', style: TextStyle(color: Colors.redAccent)),
          const SizedBox(height: 12),
          TextButton(onPressed: onRetry, child: const Text('Retry', style: TextStyle(color: kAccent))),
        ],
      ),
    );
  }
}
