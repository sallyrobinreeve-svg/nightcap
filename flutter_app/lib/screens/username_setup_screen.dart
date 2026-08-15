import 'package:flutter/material.dart';

import '../services/profile_service.dart';
import '../theme.dart';
import '../widgets/night_widgets.dart';
import 'onboarding_screen.dart';

class UsernameSetupScreen extends StatefulWidget {
  const UsernameSetupScreen({super.key});

  @override
  State<UsernameSetupScreen> createState() => _UsernameSetupScreenState();
}

class _UsernameSetupScreenState extends State<UsernameSetupScreen> {
  final _username = TextEditingController();
  bool saving = false;
  String? message;

  Future<void> _save() async {
    final value = _username.text.trim().toLowerCase();
    if (value.length < 3) {
      setState(() => message = 'Username must be at least 3 characters.');
      return;
    }
    if (!RegExp(r'^[a-z0-9_]+$').hasMatch(value)) {
      setState(
        () => message = 'Use only letters, numbers, and underscores.',
      );
      return;
    }

    setState(() {
      saving = true;
      message = null;
    });
    try {
      final available = await profileService.isUsernameAvailable(value);
      if (!available) {
        setState(() {
          message = 'That username is already taken.';
          saving = false;
        });
        return;
      }
      await profileService.updateProfile(username: value);
      if (!mounted) return;
      Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(builder: (_) => const OnboardingScreen()),
      );
    } catch (_) {
      setState(() => message = 'Could not save username. Please try again.');
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  void dispose() {
    _username.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return NightScaffold(
      child: NightCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const BrandHeader(),
            const SizedBox(height: 20),
            const Text(
              'Choose your username',
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Friends can find you by @username instead of your phone number.',
              style: TextStyle(color: NightColors.muted),
            ),
            const SizedBox(height: 20),
            NightTextField(controller: _username, label: 'Username'),
            if (message != null) StatusText(message!),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: saving ? null : _save,
                child: Text(saving ? 'Saving...' : 'Continue'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
