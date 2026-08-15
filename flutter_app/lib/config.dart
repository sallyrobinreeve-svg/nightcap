import 'dart:convert';

import 'package:http/http.dart' as http;

const defaultSiteUrl = 'https://mynightcap.vercel.app';
const defaultSupabaseUrl = 'https://wnnpbjwtmayzfcdduvhq.supabase.co';

const compileTimeSupabaseUrl = String.fromEnvironment(
  'SUPABASE_URL',
  defaultValue: defaultSupabaseUrl,
);
const compileTimeSupabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
const compileTimeSiteUrl = String.fromEnvironment(
  'SITE_URL',
  defaultValue: defaultSiteUrl,
);

class AppConfig {
  const AppConfig({
    required this.supabaseUrl,
    required this.supabaseAnonKey,
    required this.siteUrl,
  });

  final String supabaseUrl;
  final String supabaseAnonKey;
  final String siteUrl;

  bool get isConfigured =>
      supabaseUrl.startsWith('http') && supabaseAnonKey.isNotEmpty;
}

Future<AppConfig> loadAppConfig() async {
  final bakedIn = AppConfig(
    supabaseUrl: compileTimeSupabaseUrl,
    supabaseAnonKey: compileTimeSupabaseAnonKey,
    siteUrl: compileTimeSiteUrl,
  );
  if (bakedIn.isConfigured) {
    return bakedIn;
  }

  try {
    final response = await http
        .get(Uri.parse('$compileTimeSiteUrl/api/mobile-config'))
        .timeout(const Duration(seconds: 12));
    if (response.statusCode != 200) {
      return bakedIn;
    }

    final payload = jsonDecode(response.body) as Map<String, dynamic>;
    final remote = AppConfig(
      supabaseUrl: payload['supabaseUrl'] as String? ?? '',
      supabaseAnonKey: payload['supabaseAnonKey'] as String? ?? '',
      siteUrl: payload['siteUrl'] as String? ?? compileTimeSiteUrl,
    );
    if (remote.isConfigured) {
      return remote;
    }
  } catch (_) {
    // Fall through to the compile-time/default config.
  }

  return bakedIn;
}

late AppConfig appConfig;
