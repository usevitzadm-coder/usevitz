export const WHATSAPP_CONSENT_TEXT = "Quero receber novidades e promoções da Vitz pelo WhatsApp";
export const GYMRATS_CONSENT_TEXT = "Quero receber novidades, lançamentos e ofertas da Vitz por e-mail e WhatsApp. (opcional)";
export const WHATSAPP_DEFAULT = false;

// Retain real E.164 dialing digits, including Brazil's ninth mobile digit.
export function normalizeMarketingPhone(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 40 || !/^\+?[\d\s().-]+$/.test(raw.trim())) return null;
  const digits = raw.replace(/\D/g, "");
  if (!raw.trim().startsWith("+") && (digits.length === 10 || digits.length === 11)) return `+55${digits}`;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  if (digits.startsWith("55") && digits.length !== 12 && digits.length !== 13) return null;
  return raw.trim().startsWith("+") || digits.startsWith("55") ? `+${digits}` : null;
}

export function consentPhoneAliases(phone: string): string[] {
  if (!phone.startsWith("+55")) return [phone];
  if (phone.length === 14 && phone[5] === "9") return [phone, phone.slice(0, 5) + phone.slice(6)];
  if (phone.length === 13) return [phone, phone.slice(0, 5) + "9" + phone.slice(5)];
  return [phone];
}

export function optInFields(source: string, consentText: string, now: string) {
  return { whatsapp_opt_in: true, opted_in_at: now, opted_out_at: null, source, consent_text: consentText };
}
export function optOutFields(source: "whatsapp" | "minha_conta", now: string) {
  return { whatsapp_opt_in: false, opted_out_at: now, source };
}

export type ConsentRow = {
  phone: string; name: string | null; email?: string | null; whatsapp_opt_in: boolean;
  opted_in_at: string | null; opted_out_at: string | null; source: string; updated_at: string;
};
export function consentPayload(row: ConsentRow) {
  return { phone: row.phone, name: row.name, whatsapp_opt_in: row.whatsapp_opt_in,
    opted_in_at: row.opted_in_at, opted_out_at: row.opted_out_at, source: row.source };
}

export function consentBelongsToEmail(recordEmail: string | null | undefined, verifiedEmail: string) {
  return typeof recordEmail === "string" && recordEmail.trim().toLowerCase() === verifiedEmail.trim().toLowerCase();
}