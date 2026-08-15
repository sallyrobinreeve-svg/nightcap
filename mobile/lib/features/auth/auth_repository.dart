import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../supabase_providers.dart';

class AuthRepository {
  AuthRepository(this._client);

  final SupabaseClient _client;

  Future<void> sendCode({
    required String phone,
    String? displayName,
    String? termsAcceptedAt,
  }) async {
    await _client.auth.signInWithOtp(
      phone: phone,
      shouldCreateUser: true,
      data: {
        if (displayName != null && displayName.isNotEmpty) 'full_name': displayName,
        if (termsAcceptedAt != null) 'terms_accepted_at': termsAcceptedAt,
      },
    );
  }

  Future<AuthResponse> verifyCode({
    required String phone,
    required String token,
  }) {
    return _client.auth.verifyOTP(
      phone: phone,
      token: token,
      type: OtpType.sms,
    );
  }

  Future<void> completeProfile({
    required String userId,
    required String displayName,
  }) async {
    await _client.from('profiles').update({
      'display_name': displayName,
      'terms_accepted_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', userId);
  }

  Future<void> signOut() => _client.auth.signOut();
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.watch(supabaseProvider)),
);
