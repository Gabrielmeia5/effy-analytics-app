"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const metricsRoutes_1 = __importDefault(require("./routes/metricsRoutes"));
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: '10mb' })); // ou até 10mb se necessário
// Middleware para JSON
app.use(express_1.default.json());
// Pasta pública para HTML, CSS e JS
const publicPath = path_1.default.join(process.cwd(), 'public');
app.use(express_1.default.static(publicPath));
// Rotas da API
app.use('/api/metrics', metricsRoutes_1.default);
// Rota principal para abrir index.html
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(publicPath, 'index.html'));
});
exports.default = app;
