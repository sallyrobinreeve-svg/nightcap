import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config.dart';
import '../phone.dart';
import '../services/onboarding_service.dart';
import '../services/profile_service.dart';
import '../theme.dart';
import '../widgets/night_widgets.dart';
import 'home_shell.dart';
import 'onboarding_screen.dart';
import 'username_setup_screen.dart';

SupabaseClient get supabase => Supabase.instance.client;

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  @override
  void initState() {
    super.initState();
    supabase.auth.onAuthStateChange.listen((_) {
      if (mounted) setState(() {});
    });
  }

  @override
  Widget build(BuildContext context) {
    return supabase.auth.currentSession == null
        ? const WelcomeScreen()
        : const PostAuthGate();
  }
}

class PostAuthGate extends StatefulWidget {
  const PostAuthGate({super.key});

  @override
  State<PostAuthGate> createState() => _PostAuthGateState();
}

class _PostAuthGateState extends State<PostAuthGate> {
  late Future<_PostAuthState> _future = _load();

  Future<_PostAuthState> _load() async {
    final profile = await profileService.currentProfile();
    final onboardingDone = await onboardingService.isComplete();
    return _PostAuthState(
      needsUsername: profile?.username == null || profile!.username!.isEmpty,
      needsOnboarding: !onboardingDone,
    );
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_PostAuthState>(
      future: _future,
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return const NightScaffold(
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final state = snapshot.data!;
        if (state.needsUsername) {
          return UsernameSetupScreen(key: ValueKey(_future));
        }
        if (state.needsOnboarding) {
          return const OnboardingScreen();
        }
        return const HomeShell();
      },
    );
  }
}

class _PostAuthState {
  const _PostAuthState({
    required this.needsUsername,
    required this.needsOnboarding,
  });

  final bool needsUsername;
  final bool needsOnboarding;
}

class ConfigurationScreen extends StatefulWidget {
  const ConfigurationScreen({super.key});

  @override
  State<ConfigurationScreen> createState() => _ConfigurationScreenState();
}

class _ConfigurationScreenState extends State<ConfigurationScreen> {
  bool retrying = false;
  String? message;

  Future<void> retryConnection() async {
    setState(() {
      retrying = true;
      message = null;
    });
    try {
      final nextConfig = await loadAppConfig();
      if (!nextConfig.isConfigured) {
        setState(
          () => message =
              'Still unable to connect. Check your internet connection and try again.',
        );
        return;
      }
      appConfig = nextConfig;
      await Supabase.initialize(
        url: appConfig.supabaseUrl,
        publishableKey: appConfig.supabaseAnonKey,
      );
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const AuthGate()),
      );
    } catch (_) {
      setState(
        () => message =
            'Could not reach NightCapt servers. Please try again in a moment.',
      );
    } finally {
      if (mounted) setState(() => retrying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      child: NightCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const BrandHeader(),
            const SizedBox(height: 24),
            const Text(
              'Unable to connect',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            const Text(
              'NightCapt could not connect to its servers. Check your internet connection, then try again.',
              style: TextStyle(color: NightColors.muted),
            ),
            if (message != null) StatusText(message!),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: retrying ? null : retryConnection,
                child: Text(retrying ? 'Connecting...' : 'Try again'),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.of(context).pushNamed('/support'),
                child: const Text('Contact support'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  bool showSignUp = false;

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      child: NightCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const BrandHeader(),
            const SizedBox(height: 12),
            Text(
              showSignUp ? 'Create account' : 'Sign in',
              style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            showSignUp ? const SignUpForm() : const SignInForm(),
            const SizedBox(height: 16),
            Center(
              child: TextButton(
                onPressed: () => setState(() => showSignUp = !showSignUp),
                child: Text(
                  showSignUp
                      ? 'Already have an account? Sign in'
                      : 'Need an account? Sign up',
                ),
              ),
            ),
            Center(
              child: Wrap(
                alignment: WrapAlignment.center,
                spacing: 16,
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pushNamed('/terms'),
                    child: const Text('Terms'),
                  ),
                  TextButton(
                    onPressed: () => Navigator.of(context).pushNamed('/privacy'),
                    child: const Text('Privacy'),
                  ),
                  TextButton(
                    onPressed: () =>
                        Navigator.of(context).pushNamed('/support'),
                    child: const Text('Support'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SignInForm extends StatefulWidget {
  const SignInForm({super.key});

  @override
  State<SignInForm> createState() => _SignInFormState();
}

class _SignInFormState extends State<SignInForm> {
  final national = TextEditingController();
  final code = TextEditingController();
  String countryIso = 'GB';
  String? e164;
  bool awaitingCode = false;
  String? message;
  bool loading = false;

  @override
  void dispose() {
    national.dispose();
    code.dispose();
    super.dispose();
  }

  Future<void> sendCode() async {
    final country = countryByIso(countryIso);
    final parsed = parsePhoneInput(country.dial, national.text);
    if (parsed == null) {
      setState(() => message = 'Enter a valid mobile number.');
      return;
    }
    setState(() {
      loading = true;
      message = null;
    });
    try {
      await supabase.auth.signInWithOtp(phone: parsed, shouldCreateUser: true);
      setState(() {
        e164 = parsed;
        awaitingCode = true;
        message = 'We sent a 6-digit code to ${formatPhoneForDisplay(parsed)}.';
      });
    } on AuthException catch (error) {
      setState(() => message = error.message);
    } catch (_) {
      setState(() => message = 'We could not send a text. Try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> verifyCode() async {
    final phone = e164;
    final token = digitsOnly(code.text);
    if (phone == null || token.length != 6) {
      setState(() => message = 'Enter the 6-digit code from your text.');
      return;
    }
    setState(() {
      loading = true;
      message = null;
    });
    try {
      await supabase.auth.verifyOTP(
        phone: phone,
        token: token,
        type: OtpType.sms,
      );
    } on AuthException catch (error) {
      setState(() => message = error.message);
    } catch (_) {
      setState(() => message = 'That code did not work. Try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (awaitingCode) {
      return Column(
        children: [
          Text(
            'Code sent to ${formatPhoneForDisplay(e164 ?? '')}',
            style: const TextStyle(color: NightColors.muted),
          ),
          TextButton(
            onPressed: loading
                ? null
                : () => setState(() {
                      awaitingCode = false;
                      code.clear();
                      message = null;
                    }),
            child: const Text('Change number'),
          ),
          NightTextField(
            controller: code,
            label: '6-digit code',
            keyboardType: TextInputType.number,
          ),
          if (message != null) StatusText(message!),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: loading ? null : verifyCode,
              child: Text(loading ? 'Verifying...' : 'Continue'),
            ),
          ),
          TextButton(
            onPressed: loading ? null : sendCode,
            child: const Text('Resend code'),
          ),
        ],
      );
    }

    return Column(
      children: [
        PhoneNumberFields(
          countryIso: countryIso,
          onCountryChanged: (value) => setState(() => countryIso = value),
          national: national,
        ),
        if (message != null) StatusText(message!),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: loading ? null : sendCode,
            child: Text(loading ? 'Sending code...' : 'Text me a code'),
          ),
        ),
      ],
    );
  }
}

class SignUpForm extends StatefulWidget {
  const SignUpForm({super.key});

  @override
  State<SignUpForm> createState() => _SignUpFormState();
}

class _SignUpFormState extends State<SignUpForm> {
  final displayName = TextEditingController();
  final national = TextEditingController();
  final code = TextEditingController();
  String countryIso = 'GB';
  String? e164;
  bool awaitingCode = false;
  bool acceptedTerms = false;
  bool loading = false;
  String? message;

  @override
  void dispose() {
    displayName.dispose();
    national.dispose();
    code.dispose();
    super.dispose();
  }

  Future<void> sendCode() async {
    if (!acceptedTerms) {
      setState(() => message = 'You must accept the Terms and Privacy Policy.');
      return;
    }
    final country = countryByIso(countryIso);
    final parsed = parsePhoneInput(country.dial, national.text);
    if (parsed == null) {
      setState(() => message = 'Enter a valid mobile number.');
      return;
    }
    setState(() {
      loading = true;
      message = null;
    });
    final acceptedAt = DateTime.now().toUtc().toIso8601String();
    try {
      await supabase.auth.signInWithOtp(
        phone: parsed,
        shouldCreateUser: true,
        data: {
          'full_name': displayName.text.trim(),
          'terms_accepted_at': acceptedAt,
        },
      );
      setState(() {
        e164 = parsed;
        awaitingCode = true;
        message = 'We sent a 6-digit code to ${formatPhoneForDisplay(parsed)}.';
      });
    } on AuthException catch (error) {
      setState(() => message = error.message);
    } catch (_) {
      setState(() => message = 'We could not send a text. Try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> verifyCode() async {
    final phone = e164;
    final token = digitsOnly(code.text);
    if (phone == null || token.length != 6) {
      setState(() => message = 'Enter the 6-digit code from your text.');
      return;
    }
    setState(() {
      loading = true;
      message = null;
    });
    try {
      final response = await supabase.auth.verifyOTP(
        phone: phone,
        token: token,
        type: OtpType.sms,
      );
      final userId = response.user?.id;
      if (userId != null) {
        await supabase.from('profiles').update({
          'display_name': displayName.text.trim(),
          'terms_accepted_at': DateTime.now().toUtc().toIso8601String(),
        }).eq('id', userId);
      }
    } on AuthException catch (error) {
      setState(() => message = error.message);
    } catch (_) {
      setState(() => message = 'That code did not work. Try again.');
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (awaitingCode) {
      return Column(
        children: [
          Text(
            'Code sent to ${formatPhoneForDisplay(e164 ?? '')}',
            style: const TextStyle(color: NightColors.muted),
          ),
          TextButton(
            onPressed: loading
                ? null
                : () => setState(() {
                      awaitingCode = false;
                      code.clear();
                      message = null;
                    }),
            child: const Text('Change number'),
          ),
          NightTextField(
            controller: code,
            label: '6-digit code',
            keyboardType: TextInputType.number,
          ),
          if (message != null) StatusText(message!),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: loading ? null : verifyCode,
              child: Text(loading ? 'Verifying...' : 'Continue'),
            ),
          ),
        ],
      );
    }

    return Column(
      children: [
        NightTextField(controller: displayName, label: 'Display name'),
        const SizedBox(height: 12),
        PhoneNumberFields(
          countryIso: countryIso,
          onCountryChanged: (value) => setState(() => countryIso = value),
          national: national,
        ),
        CheckboxListTile(
          value: acceptedTerms,
          onChanged: (value) => setState(() => acceptedTerms = value ?? false),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          title: const Text(
            'I accept the Terms, Privacy Policy, and zero-tolerance safety policy.',
          ),
        ),
        if (message != null) StatusText(message!),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: loading ? null : sendCode,
            child: Text(loading ? 'Sending code...' : 'Text me a code'),
          ),
        ),
      ],
    );
  }
}

class PhoneNumberFields extends StatelessWidget {
  const PhoneNumberFields({
    required this.countryIso,
    required this.onCountryChanged,
    required this.national,
    super.key,
  });

  final String countryIso;
  final ValueChanged<String> onCountryChanged;
  final TextEditingController national;

  @override
  Widget build(BuildContext context) {
    final country = countryByIso(countryIso);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        DropdownButtonFormField<String>(
          initialValue: countryIso,
          dropdownColor: NightColors.card,
          decoration: nightInputDecoration('Country'),
          items: [
            for (final item in countries)
              DropdownMenuItem(
                value: item.iso,
                child: Text('${item.flag} ${item.name} +${item.dial}'),
              ),
          ],
          onChanged: (value) {
            if (value != null) onCountryChanged(value);
          },
        ),
        const SizedBox(height: 12),
        NightTextField(
          controller: national,
          label: country.placeholder,
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 8),
        const Text(
          'We’ll text you a one-time code. Standard SMS rates may apply.',
          style: TextStyle(color: NightColors.muted, fontSize: 12),
        ),
      ],
    );
  }
}
