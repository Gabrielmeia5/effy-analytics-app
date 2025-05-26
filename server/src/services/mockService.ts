import { pool } from "../db/pgClient";
import { calculateEfficiency } from "./efficiencyService";

export async function generateMockData(days = 7, intervalMinutes = 30) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const queries = [];

  for (let d = new Date(startDate); d <= now; d.setMinutes(d.getMinutes() + intervalMinutes)) {
    const temperature = +(26 + Math.random() * 1).toFixed(2); // entre 26 e 28
    const efficiency = calculateEfficiency(temperature);

    const query = {
      text: `
        INSERT INTO metric (temperature, efficiency, location, "createdAt")
        VALUES ($1, $2, $3, $4);
      `,
      values: [temperature, efficiency, "Patos de Minas", d.toISOString()],
    };

    queries.push(pool.query(query));
  }

  await Promise.all(queries);
}

