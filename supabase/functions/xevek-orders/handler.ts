import { identityMatches, parseLookup, phonesMatch, responsePayload, type OrderRow, type ItemRow } from "./logic.ts";

export interface OrderReader {
  byNumber(number: string): Promise<OrderRow | null>;
  byPhone(phone: string): Promise<OrderRow[]>;
  items(ids: string[]): Promise<ItemRow[]>;
}

export async function handleRequest(req: Request, options: {
  authorized: (key: string | null) => Promise<boolean>;
  reader: () => OrderReader;
  headers: Record<string, string>;
}): Promise<Response> {
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { ...options.headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (!await options.authorized(req.headers.get("x-api-key"))) return json({ error: "unauthorized" }, 401);
  // Browser origins are refused even when the platform's standard CORS headers are present.
  if (req.method !== "POST" || req.headers.has("origin")) return json({ error: "invalid_request" }, 400);
  if (req.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") return json({ error: "invalid_request" }, 400);
  try {
    const text = await req.text();
    if (text.length > 4096) return json({ error: "invalid_request" }, 400);
    let body: unknown;
    try { body = JSON.parse(text); } catch { return json({ error: "invalid_request" }, 400); }
    const path = new URL(req.url).pathname.replace(/^.*\/xevek-orders(?=\/|$)/, "");
    const lookup = parseLookup(path, body);
    if (!lookup) return json({ error: "invalid_request" }, 400);
    const reader = options.reader();
    let orders: OrderRow[];
    if (lookup.route === "number") {
      const order = await reader.byNumber(lookup.order_number);
      if (!order || !identityMatches(order, lookup)) return json({ error: "order_not_found" }, 404);
      orders = [order];
    } else {
      orders = await reader.byPhone(lookup.phone);
      // Defense in depth: never trust candidate-query matches alone.
      orders = orders.filter(order => phonesMatch(lookup.phone, order.customer_phone))
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 10);
      if (!orders.length) return json({ error: "customer_not_found" }, 404);
    }
    return json(responsePayload(orders, await reader.items(orders.map(order => order.id))));
  } catch {
    // Never log request bodies, keys, database errors or customer records.
    return json({ error: "internal_error" }, 500);
  }
}