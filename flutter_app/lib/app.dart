import 'package:flutter/material.dart';

import 'config.dart';
import 'screens/auth_screens.dart';
import 'screens/profile_screens.dart';
import 'theme.dart';

class NightCaptApp extends StatelessWidget {
  const NightCaptApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NightCapt',
      debugShowCheckedModeBanner: false,
      theme: buildNightTheme(),
      routes: {
        '/support': (_) => const SupportScreen(),
        '/terms': (_) => const TermsScreen(),
        '/privacy': (_) => const PrivacyScreen(),
      },
      home: appConfig.isConfigured
          ? const AuthGate()
          : const ConfigurationScreen(),
    );
  }
}
