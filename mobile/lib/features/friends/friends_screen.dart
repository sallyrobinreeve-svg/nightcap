import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../theme.dart';
import '../feed/feed_controller.dart';
import 'friend_models.dart';
import 'friends_repository.dart';

class FriendsScreen extends ConsumerStatefulWidget {
  const FriendsScreen({super.key});

  @override
  ConsumerState<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends ConsumerState<FriendsScreen> {
  final _search = TextEditingController();
  Timer? _debounce;
  List<UserSearchResult> _results = [];
  bool _searching = false;
  String _query = '';

  @override
  void dispose() {
    _debounce?.cancel();
    _search.dispose();
    super.dispose();
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
      final results = await ref.read(friendsRepositoryProvider).search(q);
      if (mounted && _search.text.trim() == q) {
        setState(() => _results = results);
      }
    } finally {
      if (mounted) setState(() => _searching = false);
    }
  }

  void _refreshAll() {
    ref.invalidate(friendsListProvider);
    ref.invalidate(friendRequestsProvider);
    ref.read(feedControllerProvider.notifier).refresh();
    if (_query.length >= 2) _runSearch(_query);
  }

  Future<void> _send(String userId) async {
    await ref.read(friendsRepositoryProvider).sendRequest(userId);
    _refreshAll();
  }

  Future<void> _respond(String userId, bool accept) async {
    await ref.read(friendsRepositoryProvider).respond(userId, accept: accept);
    _refreshAll();
  }

  Future<void> _remove(String userId) async {
    await ref.read(friendsRepositoryProvider).removeFriend(userId);
    _refreshAll();
  }

  @override
  Widget build(BuildContext context) {
    final requests = ref.watch(friendRequestsProvider);
    final friends = ref.watch(friendsListProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Friends')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          TextField(
            key: const Key('friends_search'),
            controller: _search,
            onChanged: _onQueryChanged,
            decoration: InputDecoration(
              hintText: 'Search by display name…',
              prefixIcon: const Icon(Icons.search, color: kMuted),
              suffixIcon: _searching
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        height: 18,
                        width: 18,
                        child: CircularProgressIndicator(strokeWidth: 2, color: kAccent),
                      ),
                    )
                  : null,
            ),
          ),
          const SizedBox(height: 16),

          if (_query.length >= 2) ...[
            _SectionTitle('Search results'),
            if (!_searching && _results.isEmpty)
              const _Hint('No users found.')
            else
              for (final r in _results)
                _UserTile(
                  profile: r.profile,
                  trailing: _searchAction(r),
                ),
            const SizedBox(height: 8),
            const Divider(color: kSurface, height: 32),
          ],

          _SectionTitle('Requests'),
          requests.when(
            loading: () => const _Loading(),
            error: (_, _) => const _Hint('Could not load requests.'),
            data: (items) => items.isEmpty
                ? const _Hint('No pending requests.')
                : Column(
                    children: [
                      for (final p in items)
                        _UserTile(
                          profile: p,
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              TextButton(
                                key: Key('accept_${p.id}'),
                                onPressed: () => _respond(p.id, true),
                                child: const Text('Accept', style: TextStyle(color: kAccent)),
                              ),
                              IconButton(
                                key: Key('reject_${p.id}'),
                                onPressed: () => _respond(p.id, false),
                                icon: const Icon(Icons.close, color: kMuted, size: 20),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
          ),
          const Divider(color: kSurface, height: 32),

          _SectionTitle('Your friends'),
          friends.when(
            loading: () => const _Loading(),
            error: (_, _) => const _Hint('Could not load friends.'),
            data: (items) => items.isEmpty
                ? const _Hint('No friends yet. Search above to add some.')
                : Column(
                    children: [
                      for (final p in items)
                        _UserTile(
                          profile: p,
                          trailing: TextButton(
                            key: Key('remove_${p.id}'),
                            onPressed: () => _remove(p.id),
                            child: const Text('Remove', style: TextStyle(color: kMuted)),
                          ),
                        ),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _searchAction(UserSearchResult r) {
    switch (r.status) {
      case FollowStatus.accepted:
        return const _Pill('Friends');
      case FollowStatus.pendingOut:
        return const _Pill('Requested');
      case FollowStatus.pendingIn:
        return TextButton(
          key: Key('accept_${r.profile.id}'),
          onPressed: () => _respond(r.profile.id, true),
          child: const Text('Accept', style: TextStyle(color: kAccent)),
        );
      case FollowStatus.none:
      case FollowStatus.rejected:
        return ElevatedButton(
          key: Key('add_${r.profile.id}'),
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(84, 38),
            padding: const EdgeInsets.symmetric(horizontal: 16),
          ),
          onPressed: () => _send(r.profile.id),
          child: const Text('Add'),
        );
    }
  }
}

class _UserTile extends StatelessWidget {
  const _UserTile({required this.profile, required this.trailing});

  final Profile profile;
  final Widget trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: kSurface,
            child: Text(
              profile.name.characters.first.toUpperCase(),
              style: const TextStyle(color: kAccent),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(profile.name, style: const TextStyle(color: Colors.white, fontSize: 16)),
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
        child: Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
        ),
      );
}

class _Hint extends StatelessWidget {
  const _Hint(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Text(text, style: const TextStyle(color: kMuted)),
      );
}

class _Loading extends StatelessWidget {
  const _Loading();
  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Center(child: CircularProgressIndicator(color: kAccent)),
      );
}

class _Pill extends StatelessWidget {
  const _Pill(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: kSurface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(text, style: const TextStyle(color: kMuted, fontSize: 13)),
      );
}
