import { describe, expect, it } from "vitest";
import {
  gymratsCompetition,
  isValidPhone,
  normalizePhone,
} from "./gymrats";

describe("telefone do formulário GymRats", () => {
  it("aceita número brasileiro com DDD", () => {
    expect(isValidPhone("11 99999-9999")).toBe(true);
    expect(isValidPhone("11999999999")).toBe(true);
    expect(isValidPhone("11 3232-3232")).toBe(true);
  });

  it("aceita número de outro país com código internacional", () => {
    expect(isValidPhone("+1 212 555 0123")).toBe(true);
    expect(isValidPhone("+44 20 7946 0958")).toBe(true);
    expect(isValidPhone("+61 412 345 678")).toBe(true);
    expect(isValidPhone("+351 21 345 6789")).toBe(true);
  });

  it("recusa números curtos, longos demais ou com letras", () => {
    expect(isValidPhone("1234567")).toBe(false);
    expect(isValidPhone("1234567890123456")).toBe(false);
    expect(isValidPhone("11 99999-9999 ramal 12")).toBe(false);
    expect(isValidPhone("")).toBe(false);
  });

  it("normaliza mantendo o código do país quando informado", () => {
    expect(normalizePhone("+55 (11) 99999-9999")).toBe("+5511999999999");
    expect(normalizePhone("11 99999-9999")).toBe("1199999999");
  });
});

describe("regras da competição GymRats", () => {
  it("acontece de 15/11 a 30/11/2026", () => {
    expect(gymratsCompetition.start).toBe(new Date("2026-11-15T00:00:00-03:00").getTime());
    expect(gymratsCompetition.end).toBe(new Date("2026-11-30T23:59:59-03:00").getTime());
  });

  it("dá 30% OFF às cinco primeiras e 15% OFF a todas as inscritas", () => {
    expect(gymratsCompetition.signupDiscount).toBe(15);
    expect(gymratsCompetition.prizes).toHaveLength(5);
    expect(gymratsCompetition.prizes.every((p) => p.discount === 30)).toBe(true);
  });

  it("não acumula descontos", () => {
    expect(gymratsCompetition.discountsCumulative).toBe(false);
  });
});
