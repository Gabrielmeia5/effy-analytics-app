"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler"); // ajuste o caminho conforme sua estrutura
const metricsController_1 = require("../controllers/metricsController");
const csvExportController_1 = require("../controllers/csvExportController");
const pdfExportController_1 = require("../controllers/pdfExportController");
const router = express_1.default.Router();
router.get('/collect', (0, asyncHandler_1.asyncHandler)(metricsController_1.collectMetric));
router.get('/latest', (0, asyncHandler_1.asyncHandler)(metricsController_1.getLatestMetric));
router.get('/history', (0, asyncHandler_1.asyncHandler)(metricsController_1.getHistory));
router.get('/stats', (0, asyncHandler_1.asyncHandler)(metricsController_1.getStats));
router.get('/comparative', (0, asyncHandler_1.asyncHandler)(metricsController_1.getComparative));
router.get('/mock', (0, asyncHandler_1.asyncHandler)(metricsController_1.generateMock));
router.get('/export', (0, asyncHandler_1.asyncHandler)(csvExportController_1.exportMetrics));
router.post('/export/pdf', (0, asyncHandler_1.asyncHandler)(pdfExportController_1.exportPDF));
router.get('/location', (0, asyncHandler_1.asyncHandler)(metricsController_1.getLocation));
router.post('/location', (0, asyncHandler_1.asyncHandler)(metricsController_1.setLocation));
exports.default = router;
