import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});


import { collectAndSaveMetric } from './services/metricService';

setInterval(async () => {
  try {
    await collectAndSaveMetric();
    console.log('Métrica registrada com sucesso.');
  } catch (error) {
    console.error('Erro ao registrar métrica periódica:', error);
  }
}, 30 * 1000); // a cada 30 segundos
