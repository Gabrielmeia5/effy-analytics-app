import express from 'express';
import {
  collectMetric,
  getLatestMetric,
  getHistory,
  getStats
} from '../controllers/metricsController';

const router = express.Router();

// Registrar nova métrica (quando usuário acessar)
router.get('/collect', collectMetric);

router.get('/latest', (req, res, next) => {
  getLatestMetric(req, res).catch(next);
});

router.get('/history', (req, res, next) => {
  getHistory(req, res).catch(next);
});

router.get('/stats', (req, res, next) => {
  getStats(req, res).catch(next);
});

export default router;
