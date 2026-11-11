import { AsYouType, getCountries, getCountryCallingCode, getExampleNumber, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";

const names = new Intl.DisplayNames(["pt-BR"], { type: "region" });
const priority: CountryCode[] = ["BR", "US", "BE"];

export const phoneCountries = getCountries()
  .map((code) => ({ code, name: names.of(code) || code, ddi: `+${getCountryCallingCode(code)}` }))
  .sort((a, b) => {
    const aRank = priority.indexOf(a.code);
    const bRank = priority.indexOf(b.code);
    if (aRank !== -1 || bRank !== -1) return (aRank === -1 ? 3 : aRank) - (bRank === -1 ? 3 : bRank);
    return a.name.localeCompare(b.name, "pt-BR");
  });

export function formatNationalPhone(raw: string, country: CountryCode) {
  // Accept a pasted international number without duplicating the selected DDI.
  if (raw.trim().startsWith("+")) {
    const parsed = parsePhoneNumberFromString(raw);
    if (parsed && parsed.country === country) return parsed.formatNational();
  }
  return new AsYouType(country).input(raw.replace(/\D/g, "").slice(0, 15));
}

export function phonePlaceholder(country: CountryCode) {
  return getExampleNumber(country, examples)?.formatNational() || "Telefone";
}

export function internationalPhone(raw: string, country: CountryCode): string | undefined {
  const parsed = parsePhoneNumberFromString(raw, country);
  if (!parsed || !parsed.isValid() || parsed.country !== country) return undefined;
  return parsed.number;
}