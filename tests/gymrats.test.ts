import { describe, expect, test } from "bun:test";
import { getGymratsCountdown, gymratsCompetition } from "../src/data/gymrats";
import { formatNationalPhone, internationalPhone, phoneCountries } from "../src/lib/gymrats-phone";

describe("GymRats country telephone rules", () => {
  test("prioritizes Brazil, USA and Belgium", () => {
    expect(phoneCountries.slice(0, 3).map(({ code, ddi }) => [code, ddi])).toEqual([["BR", "+55"], ["US", "+1"], ["BE", "+32"]]);
    expect(phoneCountries.length).toBeGreaterThan(200);
  });
  test("masks Brazilian numbers with DDD and saves +55", () => {
    expect(formatNationalPhone("11987654321", "BR")).toBe("(11) 98765-4321");
    expect(internationalPhone("(11) 98765-4321", "BR")).toBe("+5511987654321");
  });
  test("masks USA numbers and saves +1", () => {
    expect(formatNationalPhone("2025550123", "US")).toBe("(202) 555-0123");
    expect(internationalPhone("(202) 555-0123", "US")).toBe("+12025550123");
  });
  test("masks Belgian numbers and removes the national trunk zero", () => {
    expect(formatNationalPhone("0470123456", "BE")).toBe("0470 12 34 56");
    expect(internationalPhone("0470 12 34 56", "BE")).toBe("+32470123456");
  });
  test("accepts other countries using their own dialing rules", () => {
    expect(internationalPhone(formatNationalPhone("912345678", "PT"), "PT")).toBe("+351912345678");
  });
  test("rejects incomplete numbers and does not duplicate pasted DDI", () => {
    expect(internationalPhone("123", "BR")).toBeUndefined();
    expect(internationalPhone(formatNationalPhone("+32470123456", "BE"), "BE")).toBe("+32470123456");
  });
});

describe("GymRats competition rules", () => {
  test("marketing starts unchecked by default", () => {
    expect(gymratsCompetition.marketingOptInDefault).toBe(false);
  });
  test("starts on November 15 at midnight Brasília time", () => {
    expect(gymratsCompetition.start).toBe(Date.parse("2026-11-15T03:00:00Z"));
    expect(getGymratsCountdown(Date.parse("2026-11-15T02:59:59Z"))).toEqual({ started: false, remaining: 1000 });
    expect(getGymratsCountdown(Date.parse("2026-11-15T03:00:00Z")).started).toBe(true);
  });
  test("ends on November 30 Brasília time", () => {
    expect(gymratsCompetition.end).toBe(Date.parse("2026-12-01T02:59:59Z"));
    expect(getGymratsCountdown(Date.parse("2026-12-01T03:00:00Z")).remaining).toBe(0);
  });
  test("all five winners receive 30 percent off", () => {
    expect(gymratsCompetition.prizes.map(({ place, discount }) => [place, discount])).toEqual([[1, 30], [2, 30], [3, 30], [4, 30], [5, 30]]);
  });
  test("all signups unlock 15 percent off", () => {
    expect(gymratsCompetition.signupDiscount).toBe(15);
  });
  test("second place receives an ecobag", () => {
    expect(gymratsCompetition.prizes.find(({ place }) => place === 2)?.gift).toBe("Ecobag");
  });
  test("third place receives a headband", () => {
    expect(gymratsCompetition.prizes.find(({ place }) => place === 3)?.gift).toBe("Headband");
  });
  test("discounts are not cumulative", () => {
    expect(gymratsCompetition.discountsCumulative).toBe(false);
  });
});