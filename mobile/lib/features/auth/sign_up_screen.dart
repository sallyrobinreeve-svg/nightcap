import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../phone.dart';
import '../../theme.dart';
import 'auth_repository.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _name = TextEditingController();
  final _national = TextEditingController();
  final _code = TextEditingController();
  String _countryIso = 'GB';
  String? _e164;
  bool _awaitingCode = false;
  bool _accepted = false;
  bool _loading = false;
  String? _error;
  String? _message;

  @override
  void dispose() {
    _name.dispose();
    _national.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    if (!_accepted) {
      setState(() => _error = 'Please agree to the Terms and Privacy Policy.');
      return;
    }
    final country = countryByIso(_countryIso);
    final parsed = parsePhoneInput(country.dial, _national.text);
    if (parsed == null) {
      setState(() => _error = 'Enter a valid mobile number.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
      _message = null;
    });
    try {
      await ref.read(authRepositoryProvider).sendCode(
            phone: parsed,
            displayName: _name.text.trim(),
            termsAcceptedAt: DateTime.now().toUtc().toIso8601String(),
          );
      setState(() {
        _e164 = parsed;
        _awaitingCode = true;
        _message = 'We sent a 6-digit code to ${formatPhoneForDisplay(parsed)}.';
      });
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'We could not send a text. Try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _verify() async {
    final phone = _e164;
    final token = digitsOnly(_code.text);
    if (phone == null || token.length != 6) {
      setState(() => _error = 'Enter the 6-digit code from your text.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await ref.read(authRepositoryProvider).verifyCode(
            phone: phone,
            token: token,
          );
      final userId = response.user?.id;
      if (userId != null) {
        await ref.read(authRepositoryProvider).completeProfile(
              userId: userId,
              displayName: _name.text.trim(),
            );
      }
    } on AuthException catch (e) {
      setState(() => _error = e.message);
    } catch (_) {
      setState(() => _error = 'That code did not work. Try again.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final country = countryByIso(_countryIso);
    return Scaffold(
      appBar: AppBar(),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Create account',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                  if (_awaitingCode) ...[
                    TextField(
                      key: const Key('signup_otp'),
                      controller: _code,
                      keyboardType: TextInputType.number,
                      autofillHints: const [AutofillHints.oneTimeCode],
                      decoration: const InputDecoration(hintText: '6-digit code'),
                    ),
                  ] else ...[
                    TextField(
                      key: const Key('signup_name'),
                      controller: _name,
                      decoration: const InputDecoration(hintText: 'Display name'),
                    ),
                    const SizedBox(height: 12),
                    DropdownButtonFormField<String>(
                      key: const Key('signup_country'),
                      initialValue: _countryIso,
                      items: [
                        for (final item in countries)
                          DropdownMenuItem(
                            value: item.iso,
                            child: Text('${item.flag} +${item.dial}'),
                          ),
                      ],
                      onChanged: (value) {
                        if (value != null) setState(() => _countryIso = value);
                      },
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      key: const Key('signup_phone'),
                      controller: _national,
                      keyboardType: TextInputType.phone,
                      decoration: InputDecoration(hintText: country.placeholder),
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      key: const Key('signup_terms'),
                      value: _accepted,
                      onChanged: (v) => setState(() => _accepted = v ?? false),
                      controlAffinity: ListTileControlAffinity.leading,
                      contentPadding: EdgeInsets.zero,
                      activeColor: kAccent,
                      title: const Text(
                        'I agree to the Terms of Use and Privacy Policy.',
                        style: TextStyle(color: kMuted, fontSize: 13),
                      ),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 8),
                    Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                  ],
                  if (_message != null) ...[
                    const SizedBox(height: 8),
                    Text(_message!, style: const TextStyle(color: kAccent)),
                  ],
                  const SizedBox(height: 20),
                  ElevatedButton(
                    key: const Key('signup_submit'),
                    onPressed: _loading ? null : (_awaitingCode ? _verify : _sendCode),
                    child: _loading
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                          )
                        : Text(_awaitingCode ? 'Continue' : 'Text me a code'),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: _loading ? null : () => context.go('/signin'),
                    child: const Text(
                      'Already have an account? Sign in',
                      style: TextStyle(color: kAccent),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
