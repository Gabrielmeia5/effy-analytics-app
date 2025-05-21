import { Request, Response } from 'express';
import prisma from '../db/prisma';
import { getWeatherFromAPI } from '../services/weatherService';
import { calculateEfficiency } from '../services/efficiencyService';

export async function getLatestMetric(req: Request, res: Response) {
  try {
    const city = process.env.LOCATION_DEFAULT || 'Patos de Minas';
    const { temperature, description } = await getWeatherFromAPI(city);
    const efficiency = calculateEfficiency(temperature);

    const metric = await prisma.metric.create({
      data: {
        temperature,
        efficiency,
        location: city,
      },
    });


    res.json({
      ...metric,
      clima: description 
    });
  } catch (error) {
    console.error('Erro ao buscar temperatura:', error);
    res.status(500).json({ error: 'Erro ao buscar dados de temperatura.' });
  }
}
