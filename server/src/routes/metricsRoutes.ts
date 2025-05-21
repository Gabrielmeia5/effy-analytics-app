import { Router } from 'express';
import { getLatestMetric } from '../controllers/metricsController';

const router = Router();

router.get('/latest', getLatestMetric);

export default router;
