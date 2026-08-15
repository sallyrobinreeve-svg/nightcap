import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// The shared Supabase client.
final supabaseProvider = Provider<SupabaseClient>(
  (ref) => Supabase.instance.client,
);

/// Emits whenever the auth session changes (sign in / out / token refresh).
final authStateProvider = StreamProvider<AuthState>(
  (ref) => ref.watch(supabaseProvider).auth.onAuthStateChange,
);

/// The currently signed-in user, or null. Re-evaluates on auth changes.
final currentUserProvider = Provider<User?>((ref) {
  ref.watch(authStateProvider);
  return ref.watch(supabaseProvider).auth.currentUser;
});

/// The current user's id (or null). Unlike [currentUserProvider] this only
/// changes when the *identity* changes (sign in/out/switch), not on every token
/// refresh, so user-scoped data providers can watch it to reset cleanly.
final currentUserIdProvider = Provider<String?>((ref) {
  ref.watch(authStateProvider);
  return ref.watch(supabaseProvider).auth.currentUser?.id;
});
