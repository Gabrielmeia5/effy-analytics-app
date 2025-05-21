import express from 'express';
import path from 'path';
import metricsRoutes from './routes/metricsRoutes';

const app = express();

app.use(express.json());

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '..', 'public')));

// Rotas da API
app.use('/api/metrics', metricsRoutes);

export default app;
