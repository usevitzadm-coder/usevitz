import { GYMRATS_CONSENT_TEXT, normalizeMarketingPhone, WHATSAPP_CONSENT_TEXT } from "../_shared/marketing-rules.ts";

export function parseSubmission(body: unknown) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (!["gymrats", "newsletter", "cadastro", "checkout"].includes(String(b.source))) return null;
  if (typeof b.email !== "string" || b.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return null;
  if (typeof b.opt_in !== "boolean") return null;
  const name = typeof b.name === "string" ? b.name.trim() : null;
  if (name && name.length > 100) return null;
  if (b.source !== "newsletter" && (!name || name.length < 2)) return null;
  const phone = b.phone ? normalizeMarketingPhone(b.phone) : null;
  if ((b.phone && !phone) || ((b.opt_in || b.source !== "newsletter") && !phone)) return null;
  if (b.source === "gymrats" && b.accepted_terms !== true) return null;
  return { source: String(b.source), phone, name, email: b.email.trim().toLowerCase(), optIn: b.opt_in,
    consentText: b.source === "gymrats" ? GYMRATS_CONSENT_TEXT : WHATSAPP_CONSENT_TEXT };
}