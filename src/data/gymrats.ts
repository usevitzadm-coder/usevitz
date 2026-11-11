export const gymratsCompetition = {
  start: new Date("2026-11-15T00:00:00-03:00").getTime(),
  end: new Date("2026-11-30T23:59:59-03:00").getTime(),
  signupDiscount: 15,
  discountsCumulative: false,
  prizes: [
    { place: 1, discount: 30, gift: "Conjunto Vitz" },
    { place: 2, discount: 30, gift: "Ecobag" },
    { place: 3, discount: 30, gift: "Headband" },
    { place: 4, discount: 30, gift: null },
    { place: 5, discount: 30, gift: null },
  ],
} as const;

// Telefone: aceita número brasileiro (com DDD) ou de qualquer outro país
// (com código do país, no formato +XX). Limites seguem o padrão E.164.
export const PHONE_MIN_DIGITS = 8;
export const PHONE_MAX_DIGITS = 15;

const PHONE_ALLOWED_CHARS = /^[0-9()+\-\s.]+$/;

export function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  return trimmed.startsWith("+") ? `+${digits}` : digits;
}

export function isValidPhone(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed || !PHONE_ALLOWED_CHARS.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, "");
  return digits.length >= PHONE_MIN_DIGITS && digits.length <= PHONE_MAX_DIGITS;
}

export function getGymratsCountdown(now: number) {
  const started = now >= gymratsCompetition.start;
  return {
    started,
    remaining: Math.max(0, (started ? gymratsCompetition.end : gymratsCompetition.start) - now),
  };
}