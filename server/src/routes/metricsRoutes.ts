import express from 'express';
import {
  collectMetric,
  getLatestMetric,
  getHistory,
  getStats,
  getComparative,
  generateMock
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


router.get('/comparative', (req, res, next) => {
  getComparative(req, res).catch(next);
});

router.get('/mock', generateMock);

export default router;
