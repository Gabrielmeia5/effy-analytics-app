import { getWeatherFromAPI } from "./weatherService";
import { calculateEfficiency } from "./efficiencyService";
import prisma from "../db/prisma";
import { subDays, startOfDay } from "date-fns";

export async function collectAndSaveMetric() {
  const city = process.env.LOCATION_DEFAULT || "Patos de Minas";
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
  getHistoryByRange: (range: "day" | "week" | "month") => {
    const now = new Date();
    let from: Date;

    switch (range) {
      case "day":
        from = startOfDay(now);
        break;
      case "week":
        from = startOfDay(subDays(now, 7));
        break;
      case "month":
        from = startOfDay(subDays(now, 30));
        break;
      default:
        throw new Error("Invalid range");
    }

    return prisma.metric.findMany({
      where: {
        createdAt: {
          gte: from,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  },



  getStatsByRange: async (range: "day" | "week" | "month") => {
    const now = new Date();
    let from: Date;

    switch (range) {
      case "day":
        from = startOfDay(now);
        break;
      case "week":
        from = startOfDay(subDays(now, 7));
        break;
      case "month":
        from = startOfDay(subDays(now, 30));
        break;
      default:
        throw new Error("Invalid range");
    }
    
    const stats = await prisma.metric.aggregate({
      where: {
        createdAt: {
          gte: from,
        },
      },
      _avg: {
        temperature: true,
        efficiency: true,
      },
      _min: {
        temperature: true,
        efficiency: true,
      },
      _max: {
        temperature: true,
        efficiency: true,
      },
    });

    return {
      temperature: {
        avg: stats._avg.temperature,
        min: stats._min.temperature,
        max: stats._max.temperature,
      },
      efficiency: {
        avg: stats._avg.efficiency,
        min: stats._min.efficiency,
        max: stats._max.efficiency,
      },
    };
  },
};
