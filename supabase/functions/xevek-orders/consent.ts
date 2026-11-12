import { normalizeMarketingPhone, consentPayload, type ConsentRow } from "../_shared/marketing-rules.ts";
export { consentPayload };
export type { ConsentRow };
export type ConsentQuery = { kind: "lookup" | "out"; phone: string } | { kind: "list"; since?: string; cursor?: { at: string; phone: string }; limit: number };
export function parseConsentQuery(path: string, body: unknown): ConsentQuery | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const b = body as Record<string, unknown>;
  if (path === "/customers/consent" || path === "/customers/opt-out") {
    const phone = normalizeMarketingPhone(b.phone);
    return phone ? { kind: path.endsWith("opt-out") ? "out" : "lookup", phone } : null;
  }
  if (path !== "/customers/opted-in") return null;
  const limit = b.limit === undefined ? 500 : b.limit;
  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > 500) return null;
  const iso = (value: unknown) => typeof value === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
  if (b.since !== undefined && !iso(b.since)) return null;
  let cursor: { at: string; phone: string } | undefined;
  if (b.cursor !== undefined) {
    if (typeof b.cursor !== "string" || b.cursor.length > 512) return null;
    try {
      const value = JSON.parse(atob(b.cursor));
      if (!value || !iso(value.at) || normalizeMarketingPhone(value.phone) !== value.phone) return null;
      cursor = { at: value.at, phone: value.phone };
    } catch { return null; }
  }
  return { kind: "list", limit, since: b.since as string | undefined, cursor };
}
export function consentPage(rows: ConsentRow[], limit: number) {
  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  return { customers: page.map(consentPayload), next_cursor: rows.length > limit && last ? btoa(JSON.stringify({ at: last.updated_at, phone: last.phone })) : null };
}
export interface ConsentStore {
  lookup(phone: string): Promise<ConsentRow | null>;
  changes(query: Extract<ConsentQuery, { kind: "list" }>): Promise<ConsentRow[]>;
  optOut(phone: string): Promise<void>;
}