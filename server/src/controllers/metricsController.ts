import { Request, Response } from 'express';
import { collectAndSaveMetric, getComparativeMetrics, getPreviousMetric, metricService } from '../services/metricService';
import { pool } from '../db/pgClient';

export async function collectMetric(req: Request, res: Response) {
  try {
    const metric = await collectAndSaveMetric();
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
    console.error('Erro ao coletar métrica:', error);
    res.status(500).json({ error: 'Erro ao coletar métrica.' });
  }
}

function calculateTrend(current: number, previous?: number): 'up' | 'down' | 'stable' {


  if (previous === undefined) return 'stable';
  if (current > previous) return 'up';
  if (current < previous) return 'down';
  return 'stable';
}

export async function getLatestMetric(req: Request, res: Response) {
  try {
    const result = await metricService.getLatest();
    if (!result) {
      return res.status(404).json({ error: 'Nenhuma métrica encontrada.' });
    }
    res.json(result);
  } catch (error) {
    console.error('Erro ao buscar última métrica:', error);
    res.status(500).json({ error: 'Erro ao buscar última métrica.' });
  }
}

export async function getHistory(req: Request, res: Response) {
  const range = req.query.range;

  if (!isValidRange(range)) {
    return res.status(400).json({ error: 'Parâmetro range inválido' });
  }

  try {
    const data = await metricService.getHistoryByRange(range);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}


export async function getStats(req: Request, res: Response) {
  const range = req.query.range;

  if (!isValidRange(range)) {
    return res.status(400).json({ error: 'Parâmetro range inválido' });
  }

  try {
    const stats = await metricService.getStatsByRange(range);
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}

export async function getComparative(req: Request, res: Response) {
  try {
    const latest = await metricService.getLatest();

    if (!latest) {
      return res.status(404).json({ error: 'Nenhuma métrica encontrada.' });
    }

    const referenceDate = new Date(latest.createdAt);

    const comparative = await getComparativeMetrics(referenceDate);

    res.json({
      reference: latest,
      comparative,
    });

  } catch (error) {
    console.error('Erro no comparativo:', error);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}



function isValidRange(range: any): range is 'day' | 'week' | 'month' {
  return ['day', 'week', 'month'].includes(range);
}









import { generateMockData } from '../services/mockService';

export async function generateMock(req: Request, res: Response) {
  const days = parseInt(req.query.days as string) || 7;
  const interval = parseInt(req.query.interval as string) || 30;

  try {
    await generateMockData(days, interval);
    res.status(201).json({ message: `Mock data generated for ${days} days every ${interval} minutes.` });
  } catch (error) {
    console.error('Erro ao gerar mock:', error);
    res.status(500).json({ error: 'Erro ao gerar mock.' });
  }
}
