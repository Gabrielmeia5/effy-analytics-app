import { Request, Response } from "express";
import { collectAndSaveMetric, getComparativeMetrics, getPreviousMetric, metricService } from "../services/metricService";
import { pool } from "../db/pgClient";

import { getWeatherFromAPI } from "../services/weatherService";

let currentLocation: string | null = null; // Mantém o local atual em memória

export async function getCurrentLocation(): Promise<string> {
  if (currentLocation) return currentLocation;
  // Busca o último local salvo no banco
  const latest = await metricService.getLatest();
  if (latest?.location) {
    currentLocation = latest.location;
    return currentLocation as string;
  }
  // Default
  currentLocation = process.env.LOCATION_DEFAULT || "Patos de Minas";
  return currentLocation as string;
}

export async function setLocation(req: Request, res: Response) {
  const { location } = req.body;
  if (!location || typeof location !== "string" || location.trim().length < 2) {
    return res.status(400).json({ error: "Localização inválida." });
  }
  try {
    // Valida se o local existe na API do clima
    await getWeatherFromAPI(location.trim());
    currentLocation = location.trim();
    res.json({ message: `Local de monitoramento alterado para "${currentLocation}".`, location: currentLocation });
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Localização inválida." });
  }
}

export async function getLocation(req: Request, res: Response) {
  const location = await getCurrentLocation();
  res.json({ location });
}

export async function collectMetric(req: Request, res: Response) {
  try {
    const location = await getCurrentLocation();
    const metric = await collectAndSaveMetric(location);
    const previous = await getPreviousMetric(metric.id);
    const trendTemp = calculateTrend(metric.temperature, previous?.temperature);
    const trendEff = calculateTrend(metric.efficiency, previous?.efficiency);
    res.status(201).json({
      ...metric,
      clima: metric.clima,
      trendTemp,
      trendEff,
    });
  } catch (error) {
    console.error("Erro ao coletar métrica:", error);
    res.status(500).json({ error: "Erro ao coletar métrica." });
  }
}

function calculateTrend(current: number, previous?: number): "up" | "down" | "stable" {
  if (previous === undefined) return "stable";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
}

export async function getLatestMetric(req: Request, res: Response) {
  try {
    const result = await metricService.getLatest();
    if (!result) {
      return res.status(404).json({ error: "Nenhuma métrica encontrada." });
    }
    res.json(result);
  } catch (error) {
    console.error("Erro ao buscar última métrica:", error);
    res.status(500).json({ error: "Erro ao buscar última métrica." });
  }
}

export async function getHistory(req: Request, res: Response) {
  const range = req.query.range;

  if (!isValidRange(range)) {
    return res.status(400).json({ error: "Parâmetro range inválido" });
  }

  try {
    const data = await metricService.getHistoryByRange(range);
    res.json(data);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}

export async function getStats(req: Request, res: Response) {
  const range = req.query.range;

  if (!isValidRange(range)) {
    return res.status(400).json({ error: "Parâmetro range inválido" });
  }

  try {
    const stats = await metricService.getStatsByRange(range);
    res.json(stats);
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
}

export async function getComparative(req: Request, res: Response) {
  try {
    const latest = await metricService.getLatest();

    if (!latest) {
      return res.status(404).json({ error: "Nenhuma métrica encontrada." });
    }

    const referenceDate = new Date(latest.createdAt);

    const comparative = await getComparativeMetrics(referenceDate);

    res.json({
      reference: latest,
      comparative,
    });
  } catch (error) {
    console.error("Erro no comparativo:", error);
    res.status(500).json({ error: "Erro interno no servidor." });
  }
}

function isValidRange(range: any): range is "day" | "week" | "month" {
  return ["day", "week", "month"].includes(range);
}

import { generateMockData } from "../services/mockService";

export async function generateMock(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 7;
  const interval = parseInt(req.query.interval as string) || 30;

  try {
    await generateMockData(days, interval);
    res.status(201).json({ message: `Mock data generated for ${days} days every ${interval} minutes.` });
  } catch (error) {
    console.error("Erro ao gerar mock:", error);
    res.status(500).json({ error: "Erro ao gerar mock." });
  }
}
