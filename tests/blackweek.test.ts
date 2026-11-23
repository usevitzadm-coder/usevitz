import { describe, expect, test } from 'bun:test';
import { BLACK_WEEK as dates, campaignPhase, setPairDiscount, needsCouponConfirmation, paymentTotal, interestFree, isSet, isClothing, campaignItem } from '../supabase/functions/_shared/blackweek';
import { issueEarlyToken, verifyEarlyToken } from '../supabase/functions/_shared/blackweek-token';
const set = (price: number, quantity = 1) => ({ price, quantity, eligible: true });
describe('Black Week rules', () => {
 test('early access only on November 26 Brasília', () => { expect(campaignPhase(dates.earlyStart - 1, true)).toBe('off'); expect(campaignPhase(dates.earlyStart, true)).toBe('early'); expect(campaignPhase(dates.earlyStart, false)).toBe('teaser'); });
 test('public November 27 through November 30, stops December 1', () => { expect(campaignPhase(dates.publicStart)).toBe('public'); expect(campaignPhase(dates.end - 1)).toBe('public'); expect(campaignPhase(dates.end)).toBe('off'); });
 test('one set has no free item', () => expect(setPairDiscount([set(225)], true)).toBe(0));
 test('Essential 225 + Daily 187 discounts 187', () => expect(setPairDiscount([set(225), set(187)], true)).toBe(187));
 test('three sets only one free, lower of first pair', () => expect(setPairDiscount([set(225), set(187), set(180)], true)).toBe(187));
 test('four sets give one free per pair', () => expect(setPairDiscount([set(225), set(187), set(180), set(160)], true)).toBe(347));
 test('two units of same set are eligible', () => expect(setPairDiscount([set(225, 2)], true)).toBe(225));
 test('clothing includes individual pieces without a category and outlet clothing', () => {
  for (const [category, name] of [[null, 'Short Daily'], [null, 'Top Essential'], [null, 'Legging Essential'], ['outlet', 'Jaqueta Flow'], ['looks-prontos', 'Macaquinho Move']] as const) expect(isClothing(category, name)).toBe(true);
  expect(isSet('looks-prontos', 'Macaquinho Move')).toBe(false);
  expect(isSet('looks-prontos', 'Conjunto Flow')).toBe(true);
 });
 test('accessories never participate even with a missing or incorrect category', () => {
  for (const name of ['Boné Vitz', 'Headband', 'Ecobag']) { expect(isClothing(null, name)).toBe(false); expect(isClothing('looks-prontos', name)).toBe(false); }
  expect(isClothing('acessorios', 'Top Essential')).toBe(false);
  expect(isClothing(null, 'Produto desconhecido')).toBe(false);
  expect(setPairDiscount([campaignItem(225, 1, 'looks-prontos', 'Conjunto Essential'), campaignItem(49.9, 1, 'acessorios', 'Boné Vitz')], true)).toBe(0);
 });
 test('user example pairs Daily/Essential sets then Short Daily/Top Essential', () => {
  const items = [campaignItem(187, 1, 'looks-prontos', 'Conjunto Daily'), campaignItem(102, 1, null, 'Short Daily'), campaignItem(225, 1, 'looks-prontos', 'Conjunto Essential'), campaignItem(85, 1, null, 'Top Essential')];
  expect(setPairDiscount(items, true)).toBe(272);
  expect(paymentTotal(599, 0, setPairDiscount(items, true), 0, 0).total).toBe(327);
  expect(setPairDiscount([...items].reverse(), true)).toBe(272);
 });
 test('grouping takes precedence over global price sorting', () => {
  expect(setPairDiscount([campaignItem(300, 1, 'looks-prontos', 'Conjunto Daily'), campaignItem(50, 1, 'looks-prontos', 'Conjunto Essential'), campaignItem(200, 1, null, 'Short Daily'), campaignItem(100, 1, null, 'Top Essential')], true)).toBe(150);
 });
 test('a remaining set pairs with a remaining individual garment', () => {
  expect(setPairDiscount([campaignItem(225, 1, 'looks-prontos', 'Conjunto Essential'), campaignItem(85, 1, null, 'Top Essential')], true)).toBe(85);
 });
 test('individual quantities form pairs and trigger coupon confirmation', () => {
  const items = [campaignItem(102, 3, null, 'Short Daily')];
  expect(setPairDiscount(items, true)).toBe(102);
  expect(needsCouponConfirmation(items, true)).toBe(true);
  expect(setPairDiscount(items, true, true)).toBe(0);
 });
 test('coupon never accumulates', () => expect(setPairDiscount([set(225), set(187)], true, true)).toBe(0));
 test('requires confirmation at two sets only in campaign', () => { expect(needsCouponConfirmation([set(225, 2)], true)).toBe(true); expect(needsCouponConfirmation([set(225)], true)).toBe(false); expect(needsCouponConfirmation([set(225, 2)], false)).toBe(false); });
 test('disabled outside dates', () => expect(setPairDiscount([set(225, 2)], false)).toBe(0));
 test('payment charges 225 for 412 pair', () => expect(paymentTotal(412, 0, 187, 0, 0).total).toBe(225));
 test('coupon replaces Black in payment and gift card remains payment credit', () => expect(paymentTotal(412, 10, 187, 61.8, 20)).toEqual({ discount: 61.8, giftCard: 20, total: 340.2 }));
 test('campaign allows up to 3 installments without interest', () => { expect(interestFree(100, 3, true)).toBe(true); expect(interestFree(100, 4, true)).toBe(false); expect(interestFree(100, 3, false)).toBe(false); });
 test('early token cannot be forged or reused after November 26', async () => { const token = await issueEarlyToken('test-secret'); expect(await verifyEarlyToken(token, 'test-secret', dates.earlyStart)).toBe(true); expect(await verifyEarlyToken(token, 'different', dates.earlyStart)).toBe(false); expect(await verifyEarlyToken(token, 'test-secret', dates.publicStart)).toBe(false); expect(await verifyEarlyToken('preview=grupo', 'test-secret', dates.earlyStart)).toBe(false); });
});
