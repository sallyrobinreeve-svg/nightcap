import 'package:flutter/material.dart';

import '../config.dart';
import '../services/onboarding_service.dart';
import '../theme.dart';
import '../widgets/night_widgets.dart';
import '../widgets/video_player_widget.dart';
import 'home_shell.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _page = 0;
  bool _finishing = false;

  static const _slides = [
    (
      icon: Icons.nightlife,
      title: 'Welcome to NightCapt',
      body: 'The social diary for nights out—where the morning-after debrief lives on.',
    ),
    (
      icon: Icons.local_fire_department,
      title: 'Your feed',
      body: 'See recaps from you and your friends — reactions, comments, and all the chaos.',
    ),
    (
      icon: Icons.edit_note,
      title: 'Log the night',
      body: 'Rate it, add photos and video, answer prompts, and build your timeline.',
    ),
    (
      icon: Icons.people,
      title: 'Friends & memories',
      body: 'Find friends by username, tag them on entries, and browse your photo grid.',
    ),
  ];

  Future<void> _finish() async {
    if (_finishing) return;
    setState(() => _finishing = true);
    await onboardingService.markComplete();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute<void>(builder: (_) => const HomeShell()),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final walkthroughUrl = '${appConfig.siteUrl}/walkthrough.mp4';

    return NightScaffold(
      child: Column(
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: TextButton(
              onPressed: _finishing ? null : _finish,
              child: const Text('Skip'),
            ),
          ),
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (index) => setState(() => _page = index),
              children: [
                _OnboardingPage(
                  icon: _slides[0].icon,
                  title: _slides[0].title,
                  body: _slides[0].body,
                  child: NightVideoPlayer(url: walkthroughUrl),
                ),
                for (var i = 1; i < _slides.length; i++)
                  _OnboardingPage(
                    icon: _slides[i].icon,
                    title: _slides[i].title,
                    body: _slides[i].body,
                  ),
              ],
            ),
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              _slides.length,
              (index) => Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: index == _page
                      ? NightColors.accent
                      : NightColors.muted.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
              onPressed: _finishing
                  ? null
                  : () {
                      if (_page < _slides.length - 1) {
                        _pageController.nextPage(
                          duration: const Duration(milliseconds: 250),
                          curve: Curves.easeOut,
                        );
                      } else {
                        _finish();
                      }
                    },
              child: Text(
                _page < _slides.length - 1 ? 'Next' : 'Get started',
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  const _OnboardingPage({
    required this.icon,
    required this.title,
    required this.body,
    this.child,
  });

  final IconData icon;
  final String title;
  final String body;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        children: [
          Icon(icon, size: 56, color: NightColors.accent),
          const SizedBox(height: 16),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          Text(
            body,
            textAlign: TextAlign.center,
            style: const TextStyle(color: NightColors.muted, height: 1.4),
          ),
          if (child != null) ...[
            const SizedBox(height: 20),
            child!,
          ],
        ],
      ),
    );
  }
}
