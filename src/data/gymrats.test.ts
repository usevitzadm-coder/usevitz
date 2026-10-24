import { describe, expect, test } from "bun:test";
import { getGymratsCountdown, gymratsCompetition } from "./gymrats";

describe("GymRats competition rules", () => {
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