export const gymratsCompetition = {
  start: new Date("2026-11-15T00:00:00-03:00").getTime(),
  end: new Date("2026-11-30T23:59:59-03:00").getTime(),
  signupDiscount: 15,
  discountsCumulative: false,
  prizes: [
    { place: 1, discount: 30, gift: "Conjunto Vitz" },
    { place: 2, discount: 30, gift: "Ecobag" },
    { place: 3, discount: 30, gift: "Headband" },
    { place: 4, discount: 30, gift: null },
    { place: 5, discount: 30, gift: null },
  ],
} as const;

export function getGymratsCountdown(now: number) {
  const started = now >= gymratsCompetition.start;
  return {
    started,
    remaining: Math.max(0, (started ? gymratsCompetition.end : gymratsCompetition.start) - now),
  };
}