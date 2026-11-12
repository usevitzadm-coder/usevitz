import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { parseSubmission } from "./logic.ts";
import { consentBelongsToEmail, consentPayload, consentPhoneAliases, normalizeMarketingPhone, optInFields, optOutFields, WHATSAPP_CONSENT_TEXT } from "../_shared/marketing-rules.ts";

const fields = "phone,name,whatsapp_opt_in,opted_in_at,opted_out_at,source,updated_at";
Deno.serve(async req => {
  const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "invalid_request" }, 400);
  try {
    const text = await req.text();
    if (text.length > 4096) return json({ error: "invalid_request" }, 400);
    let body;
    try { body = JSON.parse(text); } catch { return json({ error: "invalid_request" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "invalid_request" }, 400);
    const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) throw new Error("Unavailable configuration");
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    if (body.action === "preferences" || body.action === "set_preference") {
      const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (!token) return json({ error: "unauthorized" }, 401);
      const { data: { user }, error: authError } = await db.auth.getUser(token);
      if (authError || !user || !user.email || !user.email_confirmed_at) return json({ error: "unauthorized" }, 401);
      const email = user.email.trim().toLowerCase();
      const { data: owned, error: ownedError } = await db.from("marketing_consents").select(fields + ",email").eq("email", email);
      if (ownedError) throw ownedError;
      const { data: orders, error: orderError } = await db.from("orders").select("customer_phone").eq("user_id", user.id);
      if (orderError) throw orderError;
      const phones = [...new Set([user.user_metadata?.phone, ...(orders || []).map(o => o.customer_phone), ...(owned || []).map(r => r.phone)]
        .map(normalizeMarketingPhone).filter((p): p is string => p !== null))];
      if (body.action === "preferences") {
        const aliases = [...new Set(phones.flatMap(consentPhoneAliases))];
        const { data, error } = aliases.length ? await db.from("marketing_consents").select(fields + ",email").in("phone", aliases) : { data: [], error: null };
        if (error) throw error;
        return json({ customers: phones.filter(phone => !(data || []).some(r => consentPhoneAliases(phone).includes(r.phone) && r.email && !consentBelongsToEmail(r.email, email))).map(phone => {
          const row = data?.find(r => consentPhoneAliases(phone).includes(r.phone));
          return row ? consentPayload(row) : { phone, name: user.user_metadata?.full_name || null, whatsapp_opt_in: false, opted_in_at: null, opted_out_at: null, source: "minha_conta" };
        }) });
      }
      const phone = normalizeMarketingPhone(body.phone);
      if (!phone || typeof body.opt_in !== "boolean") return json({ error: "invalid_request" }, 400);
      // Never authorize an arbitrary phone/email supplied by the browser.
      if (!phones.some(p => consentPhoneAliases(p).includes(phone))) return json({ error: "forbidden" }, 403);
      const aliases = consentPhoneAliases(phone);
      const { data: existing, error: readError } = await db.from("marketing_consents").select("phone,email").in("phone", aliases);
      if (readError) throw readError;
      // User-editable phone metadata alone cannot claim another customer's consent.
      if (existing?.some(r => r.email && !consentBelongsToEmail(r.email, email))) return json({ error: "forbidden" }, 403);
      const now = new Date().toISOString();
      const change = body.opt_in ? optInFields("minha_conta", WHATSAPP_CONSENT_TEXT, now) : optOutFields("minha_conta", now);
      const targets = existing?.length ? existing.map(r => r.phone) : [phone];
      for (const target of targets) {
        const { error } = await db.from("marketing_consents").upsert({ phone: target, ...change,
          ...(body.opt_in ? { name: user.user_metadata?.full_name || null, email } : {}) });
        if (error) throw error;
      }
      return json({ ok: true });
    }
    const submission = parseSubmission(body);
    if (!submission) return json({ error: "invalid_request" }, 400);
    const { error } = await db.rpc("submit_whatsapp_consent", {
      _source: submission.source, _phone: submission.phone, _name: submission.name, _email: submission.email,
      _opt_in: submission.optIn, _consent_text: submission.consentText,
    });
    if (error) throw error;
    return json({ ok: true });
  } catch {
    return json({ error: "internal_error" }, 500);
  }
});