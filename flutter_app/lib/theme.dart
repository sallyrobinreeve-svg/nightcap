import 'package:flutter/material.dart';

class NightColors {
  static const background = Color(0xFF1E1B24);
  static const card = Color(0xFF2B2633);
  static const accent = Color(0xFFFF6B9D);
  static const mint = Color(0xFF7AF0C2);
  static const muted = Color(0xFFB8AFC2);
  static const yellow = Color(0xFFFFDC7A);
}

InputDecoration nightInputDecoration(String label) {
  return InputDecoration(
    labelText: label,
    filled: true,
    fillColor: NightColors.background.withValues(alpha: 0.68),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.10)),
    ),
  );
}

ThemeData buildNightTheme() {
  return ThemeData(
    brightness: Brightness.dark,
    colorScheme: ColorScheme.fromSeed(
      seedColor: NightColors.accent,
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: NightColors.background,
    useMaterial3: true,
  );
}
