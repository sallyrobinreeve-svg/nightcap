import 'package:shared_preferences/shared_preferences.dart';

const _onboardingCompleteKey = 'onboarding_complete_v1';

class OnboardingService {
  Future<bool> isComplete() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingCompleteKey) ?? false;
  }

  Future<void> markComplete() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingCompleteKey, true);
  }
}

final onboardingService = OnboardingService();
