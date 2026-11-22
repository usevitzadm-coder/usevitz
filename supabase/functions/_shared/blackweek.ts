export const BLACK_WEEK = {
  earlyStart: Date.parse('2026-11-26T00:00:00-03:00'),
  publicStart: Date.parse('2026-11-27T00:00:00-03:00'),
  lastDay: Date.parse('2026-11-30T00:00:00-03:00'),
  end: Date.parse('2026-12-01T00:00:00-03:00'),
};
export function campaignPhase(now: number, earlyAccess = false) {
  if (now >= BLACK_WEEK.publicStart && now < BLACK_WEEK.end) return 'public';
  if (now >= BLACK_WEEK.earlyStart && now < BLACK_WEEK.publicStart) return earlyAccess ? 'early' : 'teaser';
  return 'off';
}
export function isSet(category?: string | null, name?: string) {
  return ['conjuntos', 'looks-prontos'].includes(category?.trim().toLowerCase() || '') && (name === undefined || /^conjunto\b/i.test(name.trim()));
}
export interface CampaignItem { price: number; quantity: number; eligible: boolean }
export function setPairDiscount(items: CampaignItem[], active: boolean, hasCoupon = false) {
  if (!active || hasCoupon) return 0;
  const prices: number[] = [];
  for (const item of items) {
    if (!item.eligible || !Number.isFinite(item.price) || item.price < 0 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 1000) continue;
    for (let n = 0; n < item.quantity; n++) prices.push(Math.round(item.price * 100));
  }
  prices.sort((a, b) => b - a);
  return prices.reduce((sum, price, index) => sum + (index % 2 === 1 ? price : 0), 0) / 100;
}
export function eligibleCount(items: CampaignItem[]) {
  return items.reduce((sum, item) => sum + (item.eligible ? item.quantity : 0), 0);
}
export function needsCouponConfirmation(items: CampaignItem[], active: boolean) {
  return active && eligibleCount(items) >= 2;
}
export function paymentTotal(subtotal: number, shipping: number, promotion: number, coupon: number, giftCard: number) {
  // A valid coupon always replaces (never adds to) the campaign discount.
  const discount = coupon > 0 ? coupon : promotion;
  const gift = Math.min(giftCard, Math.max(0, subtotal - discount));
  return { discount, giftCard: gift, total: Math.round(Math.max(0, subtotal - discount - gift + shipping) * 100) / 100 };
}
export function interestFree(total: number, installments: number, campaignActive: boolean) {
  return installments === 1 || (installments <= 3 && (campaignActive || total >= 180));
}
