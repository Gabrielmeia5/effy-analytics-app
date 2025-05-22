import express from 'express';
import path from 'path';
import metricsRoutes from './routes/metricsRoutes';

const app = express();

// Middleware para JSON
app.use(express.json());

// Pasta pública para HTML, CSS e JS
const publicPath = path.join(__dirname, '..', '..', 'public');
app.use(express.static(publicPath));

// Rotas da API
app.use('/api/metrics', metricsRoutes);

// Rota principal para abrir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

export default app;
