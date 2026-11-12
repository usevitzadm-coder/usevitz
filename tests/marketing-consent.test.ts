import { describe, test, expect } from "bun:test";
import { consentBelongsToEmail, consentPayload, normalizeMarketingPhone, consentPhoneAliases, optInFields, optOutFields, WHATSAPP_DEFAULT } from "../supabase/functions/_shared/marketing-rules";
import { parseSubmission } from "../supabase/functions/marketing-consent/logic";
import { consentPage, parseConsentQuery, type ConsentRow, type ConsentStore } from "../supabase/functions/xevek-orders/consent";
import { handleRequest } from "../supabase/functions/xevek-orders/handler";
const row: ConsentRow = { phone: "+5511999998888", name: "Exemplo", email: "example@example.com", whatsapp_opt_in: true,
  opted_in_at: "2026-11-10T00:00:00Z", opted_out_at: null, source: "gymrats", updated_at: "2026-11-12T00:00:00.123456Z" };
const submission = { source: "gymrats", name: "Exemplo", email: "example@example.com", phone: row.phone, opt_in: false, accepted_terms: true };
describe("WhatsApp consent rules", () => {
  test("account cannot claim another customer's consent using editable phone metadata", () => {
    expect(consentBelongsToEmail("customer@example.com", "owner@example.com")).toBe(false);
    expect(consentBelongsToEmail("OWNER@example.com", "owner@example.com")).toBe(true);
    expect(consentBelongsToEmail(null, "owner@example.com")).toBe(false);
  });
  test("new forms default to unchecked", () => expect(WHATSAPP_DEFAULT).toBe(false));
  test("normalization retains E.164 and Brazil ninth digit", () => {
    expect(normalizeMarketingPhone("(11) 99999-8888")).toBe("+5511999998888");
    expect(normalizeMarketingPhone("5511999998888")).toBe("+5511999998888");
    expect(normalizeMarketingPhone("+32 470 12 34 56")).toBe("+32470123456");
    expect(normalizeMarketingPhone("123")).toBeNull();
    expect(consentPhoneAliases(row.phone)).toEqual([row.phone, "+551199998888"]);
  });
  test("unchecked signup does not request an opt-in", () => expect(parseSubmission(submission)?.optIn).toBe(false));
  test("GymRats requires terms and a phone", () => {
    expect(parseSubmission({ ...submission, accepted_terms: false })).toBeNull();
    expect(parseSubmission({ ...submission, phone: "" })).toBeNull();
  });
  test("newsletter phone is optional but required for consent", () => {
    expect(parseSubmission({ source: "newsletter", email: "example@example.com", opt_in: false })?.phone).toBeNull();
    expect(parseSubmission({ source: "newsletter", email: "example@example.com", opt_in: true })).toBeNull();
  });
  test("opt-in records current time and clears withdrawal", () => expect(optInFields("checkout", "text", "2026-11-12T00:00:00Z")).toEqual({ whatsapp_opt_in: true, opted_in_at: "2026-11-12T00:00:00Z", opted_out_at: null, source: "checkout", consent_text: "text" }));
  test("opt-out writes only flag, withdrawal time and source", () => expect(optOutFields("whatsapp", "2026-11-12T00:00:00Z")).toEqual({ whatsapp_opt_in: false, opted_out_at: "2026-11-12T00:00:00Z", source: "whatsapp" }));
  test("response never exposes email or unrelated data", () => expect(Object.keys(consentPayload(row)).sort()).toEqual(["name", "opted_in_at", "opted_out_at", "phone", "source", "whatsapp_opt_in"]));
  test("pagination includes withdrawals and preserves microsecond cursor", () => {
    const page = consentPage([row, { ...row, phone: "+32470123456", whatsapp_opt_in: false }], 1);
    expect(page.customers).toHaveLength(1);
    expect(parseConsentQuery("/customers/opted-in", { cursor: page.next_cursor, limit: 1 })).toEqual({ kind: "list", limit: 1, cursor: { at: row.updated_at, phone: row.phone }, since: undefined });
    expect(consentPage([{ ...row, whatsapp_opt_in: false }], 500).customers[0].whatsapp_opt_in).toBe(false);
  });
  test("list max is exactly 500 and invalid dates/cursors rejected", () => {
    expect(parseConsentQuery("/customers/opted-in", { limit: 500 })?.kind).toBe("list");
    for (const body of [{ limit: 501 }, { limit: 0 }, { since: "yesterday" }, { cursor: "invalid" }]) expect(parseConsentQuery("/customers/opted-in", body)).toBeNull();
  });
  const store: ConsentStore = { lookup: async phone => phone === row.phone ? row : null, changes: async () => [row], optOut: async () => {} };
  async function call(path: string, body: unknown, auth = true, origin = false, suppliedStore = store) {
    return handleRequest(new Request(`https://example.com/xevek-orders/customers/${path}`, { method: "POST", headers: { "content-type": "application/json", ...(origin ? { origin: "https://example.com" } : {}) }, body: JSON.stringify(body) }), {
      authorized: async () => auth, reader: () => { throw new Error("Consent cannot access orders"); }, consentStore: () => suppliedStore, headers: {},
    });
  }
  test("all consent endpoints require the API key and reject Origin", async () => {
    for (const [path, body] of [["consent", { phone: row.phone }], ["opt-out", { phone: row.phone }], ["opted-in", {}]] as const) {
      expect((await call(path, body, false)).status).toBe(401);
      expect((await call(path, body, true, true)).status).toBe(400);
    }
  });
  test("lookup is 404 if customer does not exist", async () => {
    const res = await call("consent", { phone: "+32470123456" });
    expect(res.status).toBe(404); expect(await res.json()).toEqual({ error: "customer_not_found" });
    expect((await call("consent", { phone: row.phone })).status).toBe(200);
  });
  test("opt-out invokes consent-only store even for unknown phones", async () => {
    let target = "";
    const res = await call("opt-out", { phone: "+32470123456" }, true, false, { ...store, optOut: async p => { target = p; } });
    expect(await res.json()).toEqual({ ok: true }); expect(target).toBe("+32470123456");
  });
});