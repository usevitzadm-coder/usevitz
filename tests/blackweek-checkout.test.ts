import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { campaignPhase, isSet, setPairDiscount, paymentTotal, interestFree } from '../supabase/functions/_shared/blackweek';
import { verifyEarlyToken } from '../supabase/functions/_shared/blackweek-token';

// Exercise the real handler with isolated store and payment doubles: no live charge,
// stock changes, customer messages or test rows in the production database.
async function checkout(couponCode?: string) {
 let handler: ((req: Request) => Promise<Response>) | undefined;
 let providerBody: any;
 let savedOrder: any;
 const writes: Record<string, any[]> = {};
 const products = [
  { id: 'essential', name: 'Conjunto Essential', price: 225, is_active: true, categories: { slug: 'looks-prontos' } },
  { id: 'daily', name: 'Conjunto Daily', price: 187, is_active: true, categories: { slug: 'looks-prontos' } },
 ];
 const client = {
  auth: { getUser: async () => ({ data: { user: { id: 'test-user' } } }) },
  rpc: async () => ({ error: null }),
  from(table: string) {
   let inserted: any;
   const result = () => {
    if (table === 'products') return { data: products };
    if (table === 'coupons') return { data: { id: 'coupon', code: 'TEST15', discount_type: 'percentage', discount_value: 15, used_count: 0 } };
    if (table === 'orders') { savedOrder = inserted; return { data: { id: 'test-order', ...inserted } }; }
    return { data: [], error: null };
   };
   const query: any = {};
   for (const name of ['select','in','eq','update']) query[name] = () => query;
   query.insert = (value: any) => { inserted=value; (writes[table] ||= []).push(value); return query; };
   query.single = query.maybeSingle = async () => result();
   query.then = (resolve: any, reject: any) => Promise.resolve(result()).then(resolve,reject);
   return query;
  },
 };
 const source = readFileSync(new URL('../supabase/functions/create-pagarme-checkout/index.ts', import.meta.url), 'utf8').replace(/^import .*;\s*$/gm, '');
 const js = new Bun.Transpiler({ loader: 'ts' }).transformSync(source);
 const fakeDate = class extends Date { static now() { return Date.parse('2026-11-27T12:00:00-03:00'); } };
 new Function('serve','createClient','Deno','fetch','Date','campaignPhase','isSet','setPairDiscount','paymentTotal','interestFree','verifyEarlyToken', js)(
  (h: typeof handler) => { handler=h; }, () => client,
  { env: { get: () => 'isolated-test-secret' } },
  async (url: string, options: any) => {
   if (url.includes('api.pagar.me')) { providerBody=JSON.parse(options.body); return new Response(JSON.stringify({ id: 'fake-provider-order', charges: [{ id: 'fake-charge', status: 'pending', last_transaction: { qr_code: 'test-qr' } }] }), { status: 200 }); }
   return new Response('{}');
  }, fakeDate,campaignPhase,isSet,setPairDiscount,paymentTotal,interestFree,verifyEarlyToken,
 );
 if (!handler) throw new Error('Handler not registered');
 const response = await handler(new Request('http://localhost/checkout', { method: 'POST', headers: { authorization: 'Bearer test' }, body: JSON.stringify({
  items: products.map(p => ({ id: p.id, name: p.name, price: p.price, quantity: 1 })),
  customer: { name: 'Test', email: 'test@example.invalid', cpf: '00000000000', phone: '11999999999' },
  shipping: { street: 'Test', number: '1', neighborhood: 'Test', city: 'Test', state: 'SP', zipCode: '00000000' },
  shippingOption: { price: 0 }, paymentMethod: 'pix', couponCode,
  expectedTotal: couponCode ? 350.2 : 225,
 }) }));
 expect(response.status).toBe(200);
 expect((await response.json()).internalOrderId).toBe('test-order');
 return { providerBody, savedOrder, writes };
}
test('real checkout handler sends 22500 cents and saves 225 for Essential + Daily', async () => {
 const { providerBody, savedOrder, writes } = await checkout();
 expect(providerBody.payments[0].amount).toBe(22500);
 expect(providerBody.items.reduce((sum: number, item: any) => sum + item.amount * item.quantity, 0)).toBe(22500);
 expect(savedOrder.discount).toBe(187);
 expect(savedOrder.total).toBe(225);
 expect(writes.order_items[0]).toHaveLength(2);
});
test('real checkout handler charges coupon only, never coupon plus Black', async () => {
 const { providerBody, savedOrder } = await checkout('TEST15');
 expect(providerBody.payments[0].amount).toBe(35020);
 expect(savedOrder.discount).toBe(61.8);
 expect(savedOrder.total).toBe(350.2);
});
