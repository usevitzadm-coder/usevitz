import { describe, expect, test } from "bun:test";
import { handleRequest, type OrderReader } from "../supabase/functions/xevek-orders/handler";
import { mappedStatus, phonesMatch, type OrderRow } from "../supabase/functions/xevek-orders/logic";

const order: OrderRow = {
  id: "example-id", order_number: "VITZ-EXAMPLE", customer_name: "Cliente Exemplo", customer_email: "example@example.com",
  customer_phone: "(11) 99999-8888", created_at: "2026-11-02T14:30:00-03:00", status: "shipped", payment_status: "approved",
  total: 199.9, shipping_cost: 15, payment_method: "pix", shipping_method: "SEDEX", tracking_code: "AA123456789BR",
  shipping_city: "São Paulo", shipping_state: "SP",
};
function request(path: string, body: unknown, authorized = true, method = "POST", origin = false) {
  const req = new Request(`https://example.com/xevek-orders/orders/${path}`, {
    method, headers: { "content-type": "application/json", ...(origin ? { origin: "https://example.com" } : {}) },
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
  const reader: OrderReader = {
    byNumber: async n => n === order.order_number ? order : null,
    byPhone: async () => Array.from({ length: 12 }, (_, i) => ({ ...order, id: String(i), created_at: new Date(Date.UTC(2026, 10, i + 1)).toISOString() })),
    items: async ids => ids.map(order_id => ({ order_id, product_name: "Top", variant_info: "M / Coffee", quantity: 2, unit_price: 92.45 })),
  };
  return handleRequest(req, { authorized: async () => authorized, reader: () => reader, headers: {} });
}
describe("Xevek read-only lookup rules", () => {
  test("missing or wrong authorization returns exact 401", async () => {
    const res = await request("by-phone", { phone: "+5511999998888" }, false);
    expect(res.status).toBe(401); expect(await res.json()).toEqual({ error: "unauthorized" });
  });
  test("Brazilian phones match formatting, DDI and optional ninth digit", () => {
    for (const stored of ["(11) 99999-8888", "1199998888", "551199998888", "+55 (11) 99999-8888"]) {
      expect(phonesMatch("+5511999998888", stored)).toBe(true);
    }
    expect(phonesMatch("+5511999998888", "(21) 99999-8888")).toBe(false);
    expect(phonesMatch("123", "123")).toBe(false);
  });
  test("returns only ten orders newest first", async () => {
    const res = await request("by-phone", { phone: "+5511999998888" });
    const payload = await res.json();
    expect(res.status).toBe(200); expect(payload.orders).toHaveLength(10);
    expect(payload.orders[0].created_at).toBe("2026-11-12T00:00:00.000Z");
    expect(payload.orders[9].created_at).toBe("2026-11-03T00:00:00.000Z");
  });
  test("mismatching identity is indistinguishable from a nonexistent order", async () => {
    for (const body of [{ order_number: order.order_number, email: "other@example.com" }, { order_number: "MISSING", email: order.customer_email }]) {
      const res = await request("by-number", body);
      expect(res.status).toBe(404); expect(await res.json()).toEqual({ error: "order_not_found" });
    }
  });
  test("email matching is case insensitive and phone matching allows DDI", async () => {
    for (const identity of [{ email: "EXAMPLE@EXAMPLE.COM" }, { phone: "1199998888" }]) {
      expect((await request("by-number", { order_number: order.order_number, ...identity })).status).toBe(200);
    }
  });
  test("no matching phone returns customer_not_found", async () => {
    const res = await request("by-phone", { phone: "+5521999998888" });
    expect(res.status).toBe(404); expect(await res.json()).toEqual({ error: "customer_not_found" });
  });
  test("rejects invalid inputs, GET and browser origins", async () => {
    for (const body of [null, [], { phone: "123" }, { phone: 5511999998888 }]) {
      expect((await request("by-phone", body)).status).toBe(400);
    }
    expect((await request("by-phone", {}, true, "GET")).status).toBe(400);
    expect((await request("by-phone", { phone: "+5511999998888" }, true, "POST", true)).status).toBe(400);
    expect((await request("by-number", { order_number: order.order_number })).status).toBe(400);
  });
  test("uses only allowed response fields and does not invent delivery data", async () => {
    const payload = await (await request("by-number", { order_number: order.order_number, email: order.customer_email })).json();
    expect(Object.keys(payload.customer).sort()).toEqual(["email", "name"]);
    expect(payload.orders[0].total).toBe(199.9);
    expect(payload.orders[0].items[0]).toEqual({ name: "Top", variant: "M / Coffee", quantity: 2, unit_price: 92.45 });
    expect(payload.orders[0].shipping).toEqual({ carrier: null, method: "SEDEX", tracking_code: "AA123456789BR", tracking_url: null, shipped_at: null, estimated_delivery: null, delivered_at: null, city: "São Paulo", state: "SP" });
    expect(Object.keys(payload.orders[0]).sort()).toEqual(["created_at", "items", "order_number", "payment_method", "shipping", "shipping_cost", "status", "status_label", "total"]);
  });
  test("maps every store status to the fixed Xevek values", () => {
    const rows = [["pending", "pending_payment"], ["confirmed", "paid"], ["processing", "processing"], ["shipped", "shipped"], ["delivered", "delivered"], ["cancelled", "canceled"]];
    for (const [status, mapped] of rows) expect(mappedStatus(status, "pending").status).toBe(mapped);
    expect(mappedStatus("cancelled", "refunded")).toEqual({ status: "refunded", status_label: "Reembolsado" });
    expect(() => mappedStatus("unknown", "pending")).toThrow();
  });
});