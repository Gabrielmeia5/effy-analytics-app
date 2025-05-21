import { Request, Response } from 'express';
import { collectAndSaveMetric, metricService } from '../services/metricService';
import { pool } from '../db/pgClient';

export async function collectMetric(req: Request, res: Response) {
  try {
    // 1️⃣ Salva nova métrica
    const metric = await collectAndSaveMetric();

    // 2️⃣ Busca o penúltimo registro (o mais recente antes desse)
    const previousResult = await pool.query(
      `
      SELECT * FROM metric
      WHERE id <> $1
      ORDER BY "createdAt" DESC
      LIMIT 1;
      `,
      [metric.id]
    );

    const previous = previousResult.rows[0];

    
    let trend = 'stable';

    if (previous) {
      if (metric.temperature > previous.temperature) {
        trend = 'up';
      } else if (metric.temperature < previous.temperature) {
        trend = 'down';
      }
    }

    // 4️⃣ Retorna métrica + clima + tendência
    res.status(201).json({
      ...metric, // id, temperature, efficiency, location, createdAt
      clima: metric.clima, // descrição do clima, já vem do collectAndSaveMetric
      trend,                
    });

  } catch (error) {
    console.error('Erro ao coletar métrica:', error);
    res.status(500).json({ error: 'Erro ao coletar métrica.' });
  }
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


function isValidRange(range: any): range is 'day' | 'week' | 'month' {
  return ['day', 'week', 'month'].includes(range);
}
