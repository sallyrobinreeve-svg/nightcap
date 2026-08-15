export type Country = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
  placeholder: string;
};

export const COUNTRIES: Country[] = [
  { iso: "GB", name: "United Kingdom", dial: "44", flag: "🇬🇧", placeholder: "07700 900123" },
  { iso: "IE", name: "Ireland", dial: "353", flag: "🇮🇪", placeholder: "085 123 4567" },
  { iso: "US", name: "United States", dial: "1", flag: "🇺🇸", placeholder: "(555) 123-4567" },
  { iso: "CA", name: "Canada", dial: "1", flag: "🇨🇦", placeholder: "(416) 555-0123" },
  { iso: "AU", name: "Australia", dial: "61", flag: "🇦🇺", placeholder: "0412 345 678" },
  { iso: "NZ", name: "New Zealand", dial: "64", flag: "🇳🇿", placeholder: "021 123 4567" },
  { iso: "FR", name: "France", dial: "33", flag: "🇫🇷", placeholder: "06 12 34 56 78" },
  { iso: "DE", name: "Germany", dial: "49", flag: "🇩🇪", placeholder: "0151 12345678" },
  { iso: "ES", name: "Spain", dial: "34", flag: "🇪🇸", placeholder: "612 34 56 78" },
  { iso: "IT", name: "Italy", dial: "39", flag: "🇮🇹", placeholder: "312 345 6789" },
  { iso: "NL", name: "Netherlands", dial: "31", flag: "🇳🇱", placeholder: "06 12345678" },
  { iso: "BE", name: "Belgium", dial: "32", flag: "🇧🇪", placeholder: "0470 12 34 56" },
  { iso: "PT", name: "Portugal", dial: "351", flag: "🇵🇹", placeholder: "912 345 678" },
  { iso: "SE", name: "Sweden", dial: "46", flag: "🇸🇪", placeholder: "070 123 45 67" },
  { iso: "NO", name: "Norway", dial: "47", flag: "🇳🇴", placeholder: "406 12 345" },
  { iso: "DK", name: "Denmark", dial: "45", flag: "🇩🇰", placeholder: "20 12 34 56" },
  { iso: "FI", name: "Finland", dial: "358", flag: "🇫🇮", placeholder: "040 123 4567" },
  { iso: "PL", name: "Poland", dial: "48", flag: "🇵🇱", placeholder: "512 345 678" },
  { iso: "AT", name: "Austria", dial: "43", flag: "🇦🇹", placeholder: "0664 123456" },
  { iso: "CH", name: "Switzerland", dial: "41", flag: "🇨🇭", placeholder: "078 123 45 67" },
  { iso: "IN", name: "India", dial: "91", flag: "🇮🇳", placeholder: "98765 43210" },
  { iso: "AE", name: "United Arab Emirates", dial: "971", flag: "🇦🇪", placeholder: "050 123 4567" },
  { iso: "ZA", name: "South Africa", dial: "27", flag: "🇿🇦", placeholder: "082 123 4567" },
  { iso: "BR", name: "Brazil", dial: "55", flag: "🇧🇷", placeholder: "11 91234 5678" },
  { iso: "MX", name: "Mexico", dial: "52", flag: "🇲🇽", placeholder: "55 1234 5678" },
  { iso: "JP", name: "Japan", dial: "81", flag: "🇯🇵", placeholder: "090 1234 5678" },
  { iso: "KR", name: "South Korea", dial: "82", flag: "🇰🇷", placeholder: "010 1234 5678" },
  { iso: "SG", name: "Singapore", dial: "65", flag: "🇸🇬", placeholder: "8123 4567" },
  { iso: "HK", name: "Hong Kong", dial: "852", flag: "🇭🇰", placeholder: "5123 4567" },
  { iso: "PH", name: "Philippines", dial: "63", flag: "🇵🇭", placeholder: "0917 123 4567" },
];

export const DEFAULT_COUNTRY_ISO = "GB";

const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function countryByIso(iso: string): Country {
  return COUNTRIES.find((country) => country.iso === iso) ?? COUNTRIES[0];
}

export function findCountryByE164(e164: string): Country | undefined {
  const digits = digitsOnly(e164);
  return [...COUNTRIES]
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((country) => digits.startsWith(country.dial));
}

export function nationalToE164(dial: string, national: string): string | null {
  const dialDigits = digitsOnly(dial);
  let nationalDigits = digitsOnly(national);
  if (!dialDigits || !nationalDigits) return null;
  if (nationalDigits.startsWith("0")) {
    nationalDigits = nationalDigits.slice(1);
  }
  if (nationalDigits.startsWith(dialDigits)) {
    nationalDigits = nationalDigits.slice(dialDigits.length);
  }
  const e164 = `+${dialDigits}${nationalDigits}`;
  return E164_PATTERN.test(e164) ? e164 : null;
}

/** Accept a national number for the selected country, or a full +E.164 paste. */
export function parsePhoneInput(dial: string, input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("+")) {
    const e164 = `+${digitsOnly(trimmed)}`;
    return E164_PATTERN.test(e164) ? e164 : null;
  }
  return nationalToE164(dial, trimmed);
}

export function isValidE164(phone: string): boolean {
  return E164_PATTERN.test(phone);
}

export function formatPhoneForDisplay(e164: string): string {
  if (!e164) return "";
  const country = findCountryByE164(e164);
  if (!country) return e164;
  const rest = digitsOnly(e164).slice(country.dial.length);
  return `+${country.dial} ${rest}`.trim();
}
