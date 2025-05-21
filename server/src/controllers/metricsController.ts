
import { Request, Response } from 'express';
import { collectAndSaveMetric, metricService } from '../services/metricService';

export async function getLatestMetric(req: Request, res: Response) {
  try {
    const metric = await collectAndSaveMetric();
    res.json(metric);
  } catch (error) {
    console.error('Erro ao buscar temperatura:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de temperatura.' });
  }
}

export async function getHistory(req: Request, res: Response) {
  const range = req.query.range as string;

  if (range !== "day" && range !== "week" && range !== "month") {
    return res.status(400).json({ error: "Invalid range" });
  }

  try {
    const data = await metricService.getHistoryByRange(range);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}


export async function getStats(req: Request, res: Response) {
  const range = req.query.range as string;

  if (range !== 'day' && range !== 'week' && range !== 'month') {
    return res.status(400).json({ error: 'Invalid range' });
  }

  try {
    const stats = await metricService.getStatsByRange(range);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
