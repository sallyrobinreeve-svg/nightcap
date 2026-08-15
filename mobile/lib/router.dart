import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'features/auth/sign_in_screen.dart';
import 'features/auth/sign_up_screen.dart';
import 'features/entries/create_entry_screen.dart';
import 'features/entries/entry_detail_screen.dart';
import 'features/feed/feed_screen.dart';
import 'features/friends/friends_screen.dart';
import 'supabase_providers.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final supabase = ref.watch(supabaseProvider);

  return GoRouter(
    initialLocation: '/feed',
    refreshListenable: _GoRouterRefreshStream(supabase.auth.onAuthStateChange),
    redirect: (context, state) {
      final loggedIn = supabase.auth.currentSession != null;
      final loc = state.matchedLocation;
      final onAuthScreen = loc == '/signin' || loc == '/signup';

      if (!loggedIn) return onAuthScreen ? null : '/signin';
      if (onAuthScreen) return '/feed';
      return null;
    },
    routes: [
      GoRoute(path: '/signin', builder: (_, _) => const SignInScreen()),
      GoRoute(path: '/signup', builder: (_, _) => const SignUpScreen()),
      GoRoute(path: '/feed', builder: (_, _) => const FeedScreen()),
      GoRoute(path: '/friends', builder: (_, _) => const FriendsScreen()),
      GoRoute(path: '/create', builder: (_, _) => const CreateEntryScreen()),
      GoRoute(
        path: '/entries/:id',
        builder: (_, state) => EntryDetailScreen(entryId: state.pathParameters['id']!),
      ),
    ],
  );
});

/// Bridges a [Stream] to a [Listenable] so GoRouter re-runs redirects on
/// every auth change.
class _GoRouterRefreshStream extends ChangeNotifier {
  _GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _subscription = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _subscription;

  @override
  void dispose() {
    _subscription.cancel();
    super.dispose();
  }
}
