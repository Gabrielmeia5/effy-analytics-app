"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metricService = void 0;
exports.collectAndSaveMetric = collectAndSaveMetric;
exports.getComparativeMetrics = getComparativeMetrics;
exports.getPreviousMetric = getPreviousMetric;
const weatherService_1 = require("./weatherService");
const efficiencyService_1 = require("./efficiencyService");
const pgClient_1 = require("../db/pgClient");
const date_fns_1 = require("date-fns");
// Função para registrar uma nova métrica
async function collectAndSaveMetric(location) {
    const city = location || process.env.LOCATION_DEFAULT || "Patos de Minas";
    const { temperature, description } = await (0, weatherService_1.getWeatherFromAPI)(city);
    const efficiency = (0, efficiencyService_1.calculateEfficiency)(temperature);
    const insertQuery = `
    INSERT INTO metric (temperature, efficiency, location)
    VALUES ($1, $2, $3)
    RETURNING *;
  `;
    const values = [temperature, efficiency, city];
    const result = await pgClient_1.pool.query(insertQuery, values);
    const metric = result.rows[0];
    return { ...metric, clima: description };
}
// Função auxiliar para calcular data inicial por escopo
function getStartDate(range) {
    const now = new Date();
    switch (range) {
        case "day":
            return (0, date_fns_1.startOfDay)(now);
        case "week":
            return (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 7));
        case "month":
            return (0, date_fns_1.startOfDay)((0, date_fns_1.subDays)(now, 30));
        default:
            throw new Error("Invalid range");
    }
}
// Serviço principal
exports.metricService = {
    // Histórico por escopo
    getHistoryByRange: async (range) => {
        const from = getStartDate(range);
        const query = `
      SELECT * FROM metric
      WHERE "createdAt" >= $1
      ORDER BY "createdAt" ASC;
    `;
        const result = await pgClient_1.pool.query(query, [from]);
        return result.rows;
    },
    // Estatísticas agregadas por escopo
    getStatsByRange: async (range) => {
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
        const result = await pgClient_1.pool.query(query, [from]);
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
        const result = await pgClient_1.pool.query(query);
        return result.rows[0];
    }
};
async function getComparativeMetrics(referenceDate) {
    const hour = referenceDate.getHours();
    const minute = referenceDate.getMinutes();
    const dates = {
        yesterday: (0, date_fns_1.subDays)(referenceDate, 1),
        lastWeek: (0, date_fns_1.subWeeks)(referenceDate, 1),
        lastMonth: (0, date_fns_1.subMonths)(referenceDate, 1),
    };
    const results = {};
    for (const [key, date] of Object.entries(dates)) {
        // Base: mesma hora:minuto do referenceDate, mas no período anterior
        const base = (0, date_fns_1.setMinutes)((0, date_fns_1.setHours)(date, hour), minute);
        // Arredonda: pega uma janela de ±15 minutos em torno da base
        const start = (0, date_fns_1.subMinutes)(base, 15);
        const end = (0, date_fns_1.addMinutes)(base, 15);
        const query = `
      SELECT * FROM metric
      WHERE "createdAt" BETWEEN $1 AND $2
      ORDER BY ABS(EXTRACT(EPOCH FROM "createdAt" - $3)) ASC
      LIMIT 1;
    `;
        // $3: tempo de referência exato, para ordenar por proximidade
        const result = await pgClient_1.pool.query(query, [start, end, base]);
        results[key] = result.rows[0] || null;
    }
    return results;
}
async function getPreviousMetric(currentId) {
    const result = await pgClient_1.pool.query(`
    SELECT * FROM metric
    WHERE id <> $1
    ORDER BY "createdAt" DESC
    LIMIT 1;
  `, [currentId]);
    return result.rows[0];
}
