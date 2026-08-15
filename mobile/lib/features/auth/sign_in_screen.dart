import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../phone.dart';
import '../../theme.dart';
import 'auth_repository.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _national = TextEditingController();
  final _code = TextEditingController();
  String _countryIso = 'GB';
  String? _e164;
  bool _awaitingCode = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _national.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode() async {
    final country = countryByIso(_countryIso);
    final parsed = parsePhoneInput(country.dial, _national.text);
    if (parsed == null) {
      setState(() => _error = 'Enter a valid mobile number.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(authRepositoryProvider).sendCode(phone: parsed);
      setState(() {
        _e164 = parsed;
        _awaitingCode = true;
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
      await ref.read(authRepositoryProvider).verifyCode(phone: phone, token: token);
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
                    'NightCapt',
                    style: TextStyle(
                      color: kAccent,
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text('Welcome back — we’ll text you a code', style: TextStyle(color: kMuted)),
                  const SizedBox(height: 32),
                  if (_awaitingCode) ...[
                    Text(
                      'Code sent to ${formatPhoneForDisplay(_e164 ?? '')}',
                      style: const TextStyle(color: kMuted),
                    ),
                    TextButton(
                      onPressed: _loading
                          ? null
                          : () => setState(() {
                                _awaitingCode = false;
                                _code.clear();
                                _error = null;
                              }),
                      child: const Text('Change number'),
                    ),
                    TextField(
                      key: const Key('signin_otp'),
                      controller: _code,
                      keyboardType: TextInputType.number,
                      autofillHints: const [AutofillHints.oneTimeCode],
                      decoration: const InputDecoration(hintText: '6-digit code'),
                    ),
                  ] else ...[
                    DropdownButtonFormField<String>(
                      key: const Key('signin_country'),
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
                      key: const Key('signin_phone'),
                      controller: _national,
                      keyboardType: TextInputType.phone,
                      autofillHints: const [AutofillHints.telephoneNumber],
                      decoration: InputDecoration(hintText: country.placeholder),
                    ),
                  ],
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(_error!, style: const TextStyle(color: Colors.redAccent)),
                  ],
                  const SizedBox(height: 24),
                  ElevatedButton(
                    key: const Key('signin_submit'),
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
                    onPressed: _loading ? null : () => context.go('/signup'),
                    child: const Text(
                      "Don't have an account? Sign up",
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
