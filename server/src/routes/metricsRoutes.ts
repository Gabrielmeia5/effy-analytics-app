import express from 'express';
import {
  getLatestMetric,
  createMetric,
  getHistory,
  getStats
} from '../controllers/metricsController';

const router = express.Router();

// Criar nova métrica (registrar no banco)
router.post('/', createMetric);

// Obter a última métrica registrada (sem salvar nada novo)
router.get('/latest', (req, res, next) => {
  getLatestMetric(req, res).catch(next);
});

// Histórico de métricas
router.get('/history', (req, res, next) => {
  getHistory(req, res).catch(next);
});

// Estatísticas agregadas
router.get('/stats', async (req, res, next) => {
  try {
    await getStats(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
