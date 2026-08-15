import 'package:flutter_test/flutter_test.dart';
import 'package:nightcapt_flutter/phone.dart';

void main() {
  test('normalises UK numbers with a leading zero', () {
    expect(parsePhoneInput('44', '07700 900123'), '+447700900123');
  });

  test('accepts pasted E.164 numbers', () {
    expect(parsePhoneInput('44', '+44 7700 900123'), '+447700900123');
  });

  test('rejects short numbers', () {
    expect(parsePhoneInput('44', '770'), isNull);
  });
}
