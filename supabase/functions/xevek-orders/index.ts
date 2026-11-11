import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { handleRequest, type OrderReader } from "./handler.ts";
import { phoneIdentity, phonesMatch, type OrderRow, type ItemRow } from "./logic.ts";

const fields = "id,order_number,customer_name,customer_email,customer_phone,created_at,status,payment_status,total,shipping_cost,payment_method,shipping_method,tracking_code,shipping_city,shipping_state";

async function authorized(key: string | null): Promise<boolean> {
  const expected = Deno.env.get("XEVEK_API_KEY");
  if (!expected || !key) return false;
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([key, expected].map(value => crypto.subtle.digest("SHA-256", encoder.encode(value))));
  const aa = new Uint8Array(a), bb = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < aa.length; i++) difference |= aa[i] ^ bb[i];
  return difference === 0;
}

function reader(): OrderReader {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) throw new Error("Unavailable configuration");
  const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  return {
    async byNumber(number) {
      const { data, error } = await db.from("orders").select(fields).eq("order_number", number).maybeSingle();
      if (error) throw error;
      return data as OrderRow | null;
    },
    async byPhone(phone) {
      const identity = phoneIdentity(phone);
      if (!identity) return [];
      // SQL wildcard gaps accept stored punctuation, optional DDI and optional ninth digit.
      // Exact canonical matching below excludes unrelated candidate numbers.
      const pattern = "%" + identity.split("").join("%") + "%";
      const matches: OrderRow[] = [];
      for (let offset = 0; ; offset += 200) {
        const { data, error } = await db.from("orders").select(fields)
          .ilike("customer_phone", pattern).order("created_at", { ascending: false })
          .order("id", { ascending: false }).range(offset, offset + 199);
        if (error) throw error;
        const rows = data as OrderRow[];
        matches.push(...rows.filter(order => phonesMatch(phone, order.customer_phone)));
        if (matches.length >= 10 || rows.length < 200) return matches.slice(0, 10);
      }
    },
    async items(ids) {
      const { data, error } = await db.from("order_items")
        .select("order_id,product_name,variant_info,quantity,unit_price")
        .in("order_id", ids).order("created_at", { ascending: true });
      if (error) throw error;
      return data as ItemRow[];
    },
  };
}

Deno.serve(req => handleRequest(req, { authorized, reader, headers: corsHeaders }));