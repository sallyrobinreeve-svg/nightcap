import 'package:flutter_test/flutter_test.dart';
import 'package:nightcapt_flutter/app.dart';
import 'package:nightcapt_flutter/config.dart';

void main() {
  setUp(() {
    appConfig = const AppConfig(
      supabaseUrl: '',
      supabaseAnonKey: '',
      siteUrl: defaultSiteUrl,
    );
  });

  testWidgets('shows connection error without Supabase credentials', (
    tester,
  ) async {
    await tester.pumpWidget(const NightCaptApp());

    expect(find.text('NightCapt'), findsOneWidget);
    expect(find.text('Unable to connect'), findsOneWidget);
    expect(find.text('Try again'), findsOneWidget);
    expect(find.text('Contact support'), findsOneWidget);
  });
}
