import axios from "axios";

export interface WeatherData {
  temperature: number;
  description: string;
}

export async function getWeatherFromAPI(city: string): Promise<WeatherData> {
  const apiKey = process.env.WEATHER_API_KEY!;
  const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
    params: {
      q: city,
      appid: apiKey,
      units: 'metric',
      lang: 'pt_br' // para retornar "céu limpo" em português
    },
  });

  const temperature = response.data.main.temp;
  const description = response.data.weather[0].description; // Ex: "céu limpo"

  return { temperature, description };
}
