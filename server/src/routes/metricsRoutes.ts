import express from 'express';
import { getLatestMetric, getHistory } from '../controllers/metricsController';

const router = express.Router();

// Rota para buscar a última métrica
router.get('/latest', getLatestMetric);

// Rota para buscar o histórico de métricas
router.get('/history', (req, res, next) => {
  getHistory(req, res).catch(next);
});

export default router;
