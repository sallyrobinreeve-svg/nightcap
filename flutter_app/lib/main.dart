import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'app.dart';
import 'config.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  appConfig = await loadAppConfig();
  if (appConfig.isConfigured) {
    await Supabase.initialize(
      url: appConfig.supabaseUrl,
      publishableKey: appConfig.supabaseAnonKey,
    );
  }
  runApp(const NightCaptApp());
}
