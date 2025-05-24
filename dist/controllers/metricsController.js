"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentLocation = getCurrentLocation;
exports.setLocation = setLocation;
exports.getLocation = getLocation;
exports.collectMetric = collectMetric;
exports.getLatestMetric = getLatestMetric;
exports.getHistory = getHistory;
exports.getStats = getStats;
exports.getComparative = getComparative;
exports.generateMock = generateMock;
const metricService_1 = require("../services/metricService");
const weatherService_1 = require("../services/weatherService");
let currentLocation = null; // Mantém o local atual em memória
async function getCurrentLocation() {
    if (currentLocation)
        return currentLocation;
    // Busca o último local salvo no banco
    const latest = await metricService_1.metricService.getLatest();
    if (latest?.location) {
        currentLocation = latest.location;
        return currentLocation;
    }
    // Default
    currentLocation = process.env.LOCATION_DEFAULT || 'Patos de Minas';
    return currentLocation;
}
async function setLocation(req, res) {
    const { location } = req.body;
    if (!location || typeof location !== 'string' || location.trim().length < 2) {
        return res.status(400).json({ error: 'Localização inválida.' });
    }
    try {
        // Valida se o local existe na API do clima
        await (0, weatherService_1.getWeatherFromAPI)(location.trim());
        currentLocation = location.trim();
        res.json({ message: `Local de monitoramento alterado para "${currentLocation}".`, location: currentLocation });
    }
    catch (error) {
        res.status(400).json({ error: error.message || 'Localização inválida.' });
    }
}
async function getLocation(req, res) {
    const location = await getCurrentLocation();
    res.json({ location });
}
// Modifique collectMetric para usar o local atual
async function collectMetric(req, res) {
    try {
        const location = await getCurrentLocation();
        const metric = await (0, metricService_1.collectAndSaveMetric)(location);
        const previous = await (0, metricService_1.getPreviousMetric)(metric.id);
        const trendTemp = calculateTrend(metric.temperature, previous?.temperature);
        const trendEff = calculateTrend(metric.efficiency, previous?.efficiency);
        res.status(201).json({
            ...metric,
            clima: metric.clima,
            trendTemp,
            trendEff,
        });
    }
    catch (error) {
        console.error('Erro ao coletar métrica:', error);
        res.status(500).json({ error: 'Erro ao coletar métrica.' });
    }
}
function calculateTrend(current, previous) {
    if (previous === undefined)
        return 'stable';
    if (current > previous)
        return 'up';
    if (current < previous)
        return 'down';
    return 'stable';
}
async function getLatestMetric(req, res) {
    try {
        const result = await metricService_1.metricService.getLatest();
        if (!result) {
            return res.status(404).json({ error: 'Nenhuma métrica encontrada.' });
        }
        res.json(result);
    }
    catch (error) {
        console.error('Erro ao buscar última métrica:', error);
        res.status(500).json({ error: 'Erro ao buscar última métrica.' });
    }
}
async function getHistory(req, res) {
    const range = req.query.range;
    if (!isValidRange(range)) {
        return res.status(400).json({ error: 'Parâmetro range inválido' });
    }
    try {
        const data = await metricService_1.metricService.getHistoryByRange(range);
        res.json(data);
    }
    catch (error) {
        console.error('Erro ao buscar histórico:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
}
async function getStats(req, res) {
    const range = req.query.range;
    if (!isValidRange(range)) {
        return res.status(400).json({ error: 'Parâmetro range inválido' });
    }
    try {
        const stats = await metricService_1.metricService.getStatsByRange(range);
        res.json(stats);
    }
    catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
}
async function getComparative(req, res) {
    try {
        const latest = await metricService_1.metricService.getLatest();
        if (!latest) {
            return res.status(404).json({ error: 'Nenhuma métrica encontrada.' });
        }
        const referenceDate = new Date(latest.createdAt);
        const comparative = await (0, metricService_1.getComparativeMetrics)(referenceDate);
        res.json({
            reference: latest,
            comparative,
        });
    }
    catch (error) {
        console.error('Erro no comparativo:', error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
}
function isValidRange(range) {
    return ['day', 'week', 'month'].includes(range);
}
const mockService_1 = require("../services/mockService");
async function generateMock(req, res) {
    const days = parseInt(req.query.days) || 7;
    const interval = parseInt(req.query.interval) || 30;
    try {
        await (0, mockService_1.generateMockData)(days, interval);
        res.status(201).json({ message: `Mock data generated for ${days} days every ${interval} minutes.` });
    }
    catch (error) {
        console.error('Erro ao gerar mock:', error);
        res.status(500).json({ error: 'Erro ao gerar mock.' });
    }
}
