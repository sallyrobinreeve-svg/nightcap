class Country {
  const Country({
    required this.iso,
    required this.name,
    required this.dial,
    required this.flag,
    required this.placeholder,
  });

  final String iso;
  final String name;
  final String dial;
  final String flag;
  final String placeholder;
}

const countries = <Country>[
  Country(iso: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧', placeholder: '07700 900123'),
  Country(iso: 'IE', name: 'Ireland', dial: '353', flag: '🇮🇪', placeholder: '085 123 4567'),
  Country(iso: 'US', name: 'United States', dial: '1', flag: '🇺🇸', placeholder: '(555) 123-4567'),
  Country(iso: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦', placeholder: '(416) 555-0123'),
  Country(iso: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺', placeholder: '0412 345 678'),
  Country(iso: 'NZ', name: 'New Zealand', dial: '64', flag: '🇳🇿', placeholder: '021 123 4567'),
  Country(iso: 'FR', name: 'France', dial: '33', flag: '🇫🇷', placeholder: '06 12 34 56 78'),
  Country(iso: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪', placeholder: '0151 12345678'),
  Country(iso: 'ES', name: 'Spain', dial: '34', flag: '🇪🇸', placeholder: '612 34 56 78'),
  Country(iso: 'IT', name: 'Italy', dial: '39', flag: '🇮🇹', placeholder: '312 345 6789'),
  Country(iso: 'NL', name: 'Netherlands', dial: '31', flag: '🇳🇱', placeholder: '06 12345678'),
];

Country countryByIso(String iso) {
  return countries.firstWhere(
    (country) => country.iso == iso,
    orElse: () => countries.first,
  );
}

String digitsOnly(String value) => value.replaceAll(RegExp(r'\D'), '');

String? parsePhoneInput(String dial, String input) {
  final trimmed = input.trim();
  if (trimmed.isEmpty) return null;
  if (trimmed.startsWith('+')) {
    final e164 = '+${digitsOnly(trimmed)}';
    return _isValidE164(e164) ? e164 : null;
  }
  final dialDigits = digitsOnly(dial);
  var national = digitsOnly(trimmed);
  if (dialDigits.isEmpty || national.isEmpty) return null;
  if (national.startsWith('0')) {
    national = national.substring(1);
  }
  if (national.startsWith(dialDigits)) {
    national = national.substring(dialDigits.length);
  }
  final e164 = '+$dialDigits$national';
  return _isValidE164(e164) ? e164 : null;
}

bool _isValidE164(String phone) =>
    RegExp(r'^\+[1-9]\d{7,14}$').hasMatch(phone);

String formatPhoneForDisplay(String e164) {
  if (e164.isEmpty) return e164;
  final sorted = [...countries]..sort((a, b) => b.dial.length.compareTo(a.dial.length));
  final digits = digitsOnly(e164);
  for (final country in sorted) {
    if (digits.startsWith(country.dial)) {
      final rest = digits.substring(country.dial.length);
      return '+${country.dial} $rest';
    }
  }
  return e164;
}
