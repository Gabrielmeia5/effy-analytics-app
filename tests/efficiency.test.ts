import { calculateEfficiency } from "../server/src/services/efficiencyService";

describe("calculateEfficiency", () => {
  it("retorna 100% para temperaturas ≥ 28", () => {
    expect(calculateEfficiency(30)).toBe(100);
  });

  it("retorna 75% para temperaturas ≤ 24", () => {
    expect(calculateEfficiency(22)).toBe(75);
  });

  it("interpola corretamente entre 24°C e 28°C", () => {
    expect(calculateEfficiency(26)).toBeCloseTo(87.5);
    expect(calculateEfficiency(25)).toBeCloseTo(81.25);
  });
});
