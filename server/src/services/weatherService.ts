import axios from "axios";

export interface WeatherData {
  temperature: number;
  description: string;
}

export async function getWeatherFromAPI(city: string): Promise<WeatherData> {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    throw new Error("API KEY do OpenWeather não configurada.");
  }

  try {
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        appid: apiKey,
        units: "metric",
        lang: "pt_br",
      },
      timeout: 5000, 
    });

    const temperature = response.data.main?.temp;
    const description = response.data.weather?.[0]?.description;

    if (temperature === undefined || !description) {
      throw new Error("Resposta da API do clima está incompleta.");
    }

    return { temperature, description };
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      if (status === 404) {
        throw new Error(`Localização: "${city}" não encontrada na API OpenWeather`);
      }
      if (status === 401) {
        throw new Error("API Key inválida ou não autorizada.");
      }
      throw new Error(`Erro ao consultar API da OpenWeather: ${error.message}`);
    } else {
      throw new Error(`Erro inesperado: ${error.message}`);
    }
  }
}
