import { getWeatherFromAPI } from "./weatherService";
import { calculateEfficiency } from "./efficiencyService";
import { pool } from "../db/pgClient";
import { subDays, subWeeks, subMonths, setHours, setMinutes, addMinutes, subMinutes, startOfDay } from "date-fns";

// Função para registrar uma nova métrica
export async function collectAndSaveMetric(location?: string) {
  const city = location || process.env.LOCATION_DEFAULT || "Patos de Minas";
  const { temperature, description } = await getWeatherFromAPI(city);
  const efficiency = calculateEfficiency(temperature);

  const insertQuery = `
    INSERT INTO metric (temperature, efficiency, location)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
  const values = [temperature, efficiency, city];

  const result = await pool.query(insertQuery, values);
  const metric = result.rows[0];

  return { ...metric, clima: description };
}

// Função auxiliar para calcular data inicial por escopo
function getStartDate(range: "day" | "week" | "month") {
  const now = new Date();
  switch (range) {
    case "day":
      return startOfDay(now);
    case "week":
      return startOfDay(subDays(now, 7));
    case "month":
      return startOfDay(subDays(now, 30));
    default:
      throw new Error("Invalid range");
  }
}

// Serviço principal
export const metricService = {
  // Histórico por escopo
  getHistoryByRange: async (range: "day" | "week" | "month") => {
    const from = getStartDate(range);
    const query = `
      SELECT * FROM metric
      WHERE "createdAt" >= $1
      ORDER BY "createdAt" ASC;
    `;
    const result = await pool.query(query, [from]);
    return result.rows;
  },

  // Estatísticas agregadas por escopo
  getStatsByRange: async (range: "day" | "week" | "month") => {
    const from = getStartDate(range);
    const query = `
      SELECT
        AVG(temperature) AS avg_temperature,
        MIN(temperature) AS min_temperature,
        MAX(temperature) AS max_temperature,
        AVG(efficiency) AS avg_efficiency,
        MIN(efficiency) AS min_efficiency,
        MAX(efficiency) AS max_efficiency
      FROM metric
      WHERE "createdAt" >= $1;
    `;
    const result = await pool.query(query, [from]);
    const row = result.rows[0];

    return {
      temperature: {
        avg: parseFloat(row.avg_temperature),
        min: parseFloat(row.min_temperature),
        max: parseFloat(row.max_temperature),
      },
      efficiency: {
        avg: parseFloat(row.avg_efficiency),
        min: parseFloat(row.min_efficiency),
        max: parseFloat(row.max_efficiency),
      },
    };
  },

  getLatest: async () => {
    const query = `
        SELECT * FROM metric
        ORDER BY "id" DESC
        LIMIT 1;
    `;
    const result = await pool.query(query);
    return result.rows[0];
  },
};

export async function getComparativeMetrics(referenceDate: Date) {
  const hour = referenceDate.getHours();
  const minute = referenceDate.getMinutes();

  const dates = {
    yesterday: subDays(referenceDate, 1),
    lastWeek: subWeeks(referenceDate, 1),
    lastMonth: subMonths(referenceDate, 1),
  };

  const results: Record<string, any> = {};

  for (const [key, date] of Object.entries(dates)) {
    // Base: mesma hora:minuto do referenceDate, mas no período anterior
    const base = setMinutes(setHours(date, hour), minute);

    // Arredonda: pega uma janela de ±15 minutos em torno da base
    const start = subMinutes(base, 15);
    const end = addMinutes(base, 15);

    const query = `
      SELECT * FROM metric
      WHERE "createdAt" BETWEEN $1 AND $2
      ORDER BY ABS(EXTRACT(EPOCH FROM "createdAt" - $3)) ASC
      LIMIT 1;
    `;

    // $3: tempo de referência exato, para ordenar por proximidade
    const result = await pool.query(query, [start, end, base]);
    results[key] = result.rows[0] || null;
  }

  return results;
}

export async function getPreviousMetric(currentId: number) {
  const result = await pool.query(
    `
    SELECT * FROM metric
    WHERE id <> $1
    ORDER BY "createdAt" DESC
    LIMIT 1;
  `,
    [currentId]
  );
  return result.rows[0];
}
