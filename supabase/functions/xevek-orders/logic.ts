export type OrderRow = {
  id: string; order_number: string; customer_name: string; customer_email: string;
  customer_phone: string | null; created_at: string; status: string; payment_status: string;
  total: number; shipping_cost: number; payment_method: string | null;
  shipping_method: string | null; tracking_code: string | null;
  shipping_city: string | null; shipping_state: string | null;
};
export type ItemRow = { order_id: string; product_name: string; variant_info: string | null; quantity: number; unit_price: number };

export function phoneIdentity(value: string): string | null {
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  if (digits.length !== 10 && digits.length !== 11) return null;
  if (digits.length === 11) {
    if (digits[2] !== "9") return null;
    digits = digits.slice(0, 2) + digits.slice(3);
  }
  return digits;
}
export function phonesMatch(a: string, b: string | null): boolean {
  const identity = phoneIdentity(a);
  return identity !== null && b !== null && identity === phoneIdentity(b);
}
type Lookup = { route: "phone"; phone: string } | { route: "number"; order_number: string; phone?: string; email?: string };
export function parseLookup(path: string, body: unknown): Lookup | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const v = body as Record<string, unknown>;
  const phone = typeof v.phone === "string" && v.phone.length <= 40 && phoneIdentity(v.phone) ? v.phone : undefined;
  if (path === "/orders/by-phone") return phone ? { route: "phone", phone } : null;
  if (path !== "/orders/by-number" || typeof v.order_number !== "string") return null;
  const number = v.order_number.trim();
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(number)) return null;
  const email = typeof v.email === "string" && v.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim()) ? v.email.trim().toLowerCase() : undefined;
  if ((v.phone !== undefined && !phone) || (v.email !== undefined && !email) || (!phone && !email)) return null;
  return { route: "number", order_number: number, phone, email };
}
export function identityMatches(order: OrderRow, lookup: { phone?: string; email?: string }): boolean {
  return Boolean((lookup.phone && phonesMatch(lookup.phone, order.customer_phone)) ||
    (lookup.email && lookup.email.toLowerCase() === order.customer_email.trim().toLowerCase()));
}
export function mappedStatus(status: string, payment: string): { status: string; status_label: string } {
  if (payment === "refunded" || status === "refunded") return { status: "refunded", status_label: "Reembolsado" };
  const mapping: Record<string, [string, string]> = {
    pending: ["pending_payment", "Pendente"], confirmed: ["paid", "Confirmado"],
    processing: ["processing", "Preparando"], shipped: ["shipped", "Enviado"],
    delivered: ["delivered", "Entregue"], cancelled: ["canceled", "Cancelado"],
  };
  const result = mapping[status];
  if (!result) throw new Error("Unsupported order status");
  return { status: result[0], status_label: result[1] };
}
export function responsePayload(orders: OrderRow[], items: ItemRow[]) {
  const first = orders[0];
  return {
    customer: { name: first?.customer_name ?? null, email: first?.customer_email ?? null },
    orders: orders.map(order => ({
      order_number: order.order_number, created_at: new Date(order.created_at).toISOString(),
      ...mappedStatus(order.status, order.payment_status), total: Number(order.total),
      shipping_cost: Number(order.shipping_cost), payment_method: order.payment_method ?? null,
      items: items.filter(item => item.order_id === order.id).map(item => ({
        name: item.product_name, variant: item.variant_info ?? null,
        quantity: item.quantity, unit_price: Number(item.unit_price),
      })),
      shipping: { carrier: null, method: order.shipping_method ?? null,
        tracking_code: order.tracking_code ?? null, tracking_url: null,
        shipped_at: null, estimated_delivery: null, delivered_at: null,
        city: order.shipping_city ?? null, state: order.shipping_state ?? null },
    })),
  };
}