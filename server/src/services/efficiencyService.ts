export function calculateEfficiency(temperature: number): number {
  if (temperature >= 28) return 100;
  if (temperature <= 24) return 75;

  const efficiency = 75 + ((temperature - 24) / (28 - 24)) * 25;
  return parseFloat(efficiency.toFixed(2));
}

