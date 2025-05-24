import express from 'express';
import { asyncHandler } from '../utils/asyncHandler'; // ajuste o caminho conforme sua estrutura
import {
  collectMetric,
  getLatestMetric,
  getHistory,
  getStats,
  getComparative,
  generateMock,
  setLocation,
  getLocation
} from '../controllers/metricsController';
import { exportMetrics } from '../controllers/csvExportController';
import { exportPDF } from '../controllers/pdfExportController';

const router = express.Router();

router.get('/collect', asyncHandler(collectMetric));
router.get('/latest', asyncHandler(getLatestMetric));
router.get('/history', asyncHandler(getHistory));
router.get('/stats', asyncHandler(getStats));
router.get('/comparative', asyncHandler(getComparative));
router.get('/mock', asyncHandler(generateMock));
router.get('/export', asyncHandler(exportMetrics));
router.post('/export/pdf', asyncHandler(exportPDF));
router.get('/location', asyncHandler(getLocation));
router.post('/location', asyncHandler(setLocation));

export default router;
