import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../supabase_providers.dart';
import 'feed_entry.dart';
import 'feed_repository.dart';

class FeedState {
  const FeedState({
    this.entries = const [],
    this.cursor,
    this.loadingMore = false,
  });

  final List<FeedEntry> entries;
  final FeedCursor? cursor;
  final bool loadingMore;

  bool get hasMore => cursor != null;

  FeedState copyWith({
    List<FeedEntry>? entries,
    FeedCursor? cursor,
    bool clearCursor = false,
    bool? loadingMore,
  }) {
    return FeedState(
      entries: entries ?? this.entries,
      cursor: clearCursor ? null : (cursor ?? this.cursor),
      loadingMore: loadingMore ?? this.loadingMore,
    );
  }
}

class FeedController extends AsyncNotifier<FeedState> {
  @override
  Future<FeedState> build() async {
    // Rebuild whenever the signed-in identity changes so we never show a
    // previous account's feed after switching users.
    final userId = ref.watch(currentUserIdProvider);
    if (userId == null) return const FeedState();
    final page = await ref.read(feedRepositoryProvider).fetchPage(userId: userId);
    return FeedState(entries: page.entries, cursor: page.nextCursor);
  }

  Future<void> loadMore() async {
    final current = state.asData?.value;
    final user = ref.read(supabaseProvider).auth.currentUser;
    if (current == null || user == null) return;
    if (current.loadingMore || !current.hasMore) return;

    state = AsyncData(current.copyWith(loadingMore: true));
    try {
      final page = await ref
          .read(feedRepositoryProvider)
          .fetchPage(userId: user.id, cursor: current.cursor);

      final existing = {for (final e in current.entries) e.id};
      final merged = [
        ...current.entries,
        ...page.entries.where((e) => !existing.contains(e.id)),
      ];

      state = AsyncData(FeedState(
        entries: merged,
        cursor: page.nextCursor,
        loadingMore: false,
      ));
    } catch (_) {
      state = AsyncData(current.copyWith(loadingMore: false));
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }
}

final feedControllerProvider =
    AsyncNotifierProvider<FeedController, FeedState>(FeedController.new);
