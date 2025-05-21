import { getWeatherFromAPI } from './weatherService';
import { calculateEfficiency } from './efficiencyService';
import prisma from '../db/prisma';
import { subDays, startOfDay } from "date-fns";

export async function collectAndSaveMetric() {
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

  return { ...metric, clima: description };
}




export const metricService = {
  getHistoryByRange: (range: 'day' | 'week' | 'month') => {
    const now = new Date();
    let from: Date;

    switch (range) {
      case 'day':
        from = startOfDay(now);
        break;
      case 'week':
        from = startOfDay(subDays(now, 7));
        break;
      case 'month':
        from = startOfDay(subDays(now, 30));
        break;
      default:
        throw new Error('Invalid range');
    }

    return prisma.metric.findMany({
      where: {
        createdAt: {
          gte: from,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  },
};