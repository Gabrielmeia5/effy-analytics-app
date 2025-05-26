import { Request, Response } from "express";
import { metricService } from "../services/metricService";
import { getComparativeMetrics } from "../services/metricService";
import puppeteer from "puppeteer";
import Handlebars from "handlebars";

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("pt-BR");
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("pt-BR");
}

function formatNumber(num: number) {
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function exportPDF(req: Request, res: Response) {
  try {
    const { chartImage } = req.body; // base64 do gráfico (data:image/png;base64,...)
    const range = (req.query.range as "day" | "week" | "month") || "week";

    const [history, stats, latest] = await Promise.all([metricService.getHistoryByRange(range), metricService.getStatsByRange(range), metricService.getLatest()]);

    const today = new Date();
    const local = latest?.location || "Local não definido";

    const compiledHTML = compileHTMLTemplate({
      hoje: formatDate(today.toISOString()),
      local,
      ultima: {
        temperature: formatNumber(latest.temperature),
        efficiency: formatNumber(latest.efficiency),
        data: formatDate(latest.createdAt),
        hora: formatTime(latest.createdAt),
      },
      stats: {
        temp: {
          min: formatNumber(stats.temperature.min),
          avg: formatNumber(stats.temperature.avg),
          max: formatNumber(stats.temperature.max),
        },
        eff: {
          min: formatNumber(stats.efficiency.min),
          avg: formatNumber(stats.efficiency.avg),
          max: formatNumber(stats.efficiency.max),
        },
      },
      history: history.map((h) => ({
        data: formatDate(h.createdAt),
        hora: formatTime(h.createdAt),
        temperature: formatNumber(h.temperature),
        efficiency: formatNumber(h.efficiency),
        location: h.location || "Local não definido",
      })),
      chartImage,
    });

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(compiledHTML, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="relatorio-effy.pdf"');
    res.send(pdf);
  } catch (error) {
    console.error("Erro ao exportar PDF:", error);
    res.status(500).json({ error: "Erro ao gerar PDF" });
  }
}

function compileHTMLTemplate(data: any): string {
const template = `<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    :root {
      --primary: #2563eb;
      --primary-light: #dbeafe;
      --secondary: #64748b;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
      --background: #fafafa;
      --surface: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --border-light: #f1f5f9;
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --radius: 8px;
      --radius-lg: 12px;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 14px;
      background-color: var(--background);
      color: var(--text-primary);
      line-height: 1.6;
      padding: 32px;
      max-width: 1000px;
      margin: 0 auto;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    /* Header */
    .header {
      background: linear-gradient(135deg, var(--surface) 0%, #f8fafc 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      margin-bottom: 32px;
      box-shadow: var(--shadow-sm);
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 16px;
      color: var(--text-primary);
      letter-spacing: -0.025em;
    }

    .meta-info {
      display: flex;
      gap: 32px;
      font-size: 14px;
      color: var(--text-secondary);
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      font-weight: 500;
    }

    /* Section Headers */
    .section {
      margin-bottom: 32px;
    }

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 20px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--primary-light);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* Status Cards */
    .current-status {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .status-box {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      text-align: center;
      position: relative;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
    }

    .status-box:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }

    .status-box::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary) 0%, var(--success) 100%);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .status-icon {
      width: 24px;
      height: 24px;
      margin-bottom: 12px;
      color: var(--primary);
      stroke-width: 2;
    }

    .status-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--text-primary);
      margin-bottom: 4px;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }

    .status-label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 8px;
    }

    .status-description {
      font-size: 13px;
      color: var(--text-secondary);
      font-weight: 400;
    }

    .status-timestamp {
      background: var(--surface);
      border: 1px solid var(--border-light);
      border-radius: var(--radius);
      padding: 16px;
      text-align: center;
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* Tables */
    .table-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    thead {
      background: linear-gradient(135deg, #f8fafc 0%, var(--primary-light) 100%);
    }

    th {
      padding: 16px 20px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--border);
    }

    td {
      padding: 16px 20px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-light);
      font-weight: 400;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    tbody tr:hover {
      background-color: #f8fafc;
    }

    .numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
    }

    /* Statistics Table */
    .stats-table tbody td:first-child {
      font-weight: 600;
      color: var(--text-primary);
    }

    .stats-table .numeric {
      font-size: 15px;
      font-weight: 600;
    }

    /* Chart Container */
    .chart-container {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px;
      text-align: center;
      box-shadow: var(--shadow-sm);
    }

    .chart-container h2 {
      margin-bottom: 24px;
      justify-content: center;
      border-bottom: none;
      padding-bottom: 0;
    }

    .chart-container img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius);
      border: 1px solid var(--border-light);
    }

    /* Icons */
    .icon {
      width: 16px;
      height: 16px;
      color: var(--primary);
      stroke-width: 2;
    }

    /* Utility Classes */
    .font-mono { 
      font-family: 'SF Mono', 'Monaco', 'Cascadia Code', monospace;
      font-size: 13px;
    }

    /* Print Optimizations */
    @media print {
      :root {
        --background: #ffffff;
        --surface: #ffffff;
        --shadow-sm: none;
        --shadow-md: none;
      }

      body {
        padding: 20px;
        font-size: 12px;
        background: white;
      }

      .header, .status-box, .table-container, .chart-container {
        box-shadow: none !important;
        border: 1px solid #d1d5db !important;
      }

      .status-box:hover {
        transform: none;
      }

      .section {
        break-inside: avoid;
        margin-bottom: 24px;
      }

      h1 { font-size: 24px; }
      h2 { font-size: 16px; }
      
      .current-status {
        break-inside: avoid;
      }

      table { font-size: 11px; }
      th, td { padding: 12px 14px; }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      body {
        padding: 16px;
      }

      .header {
        padding: 24px;
      }

      .current-status {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .meta-info {
        flex-direction: column;
        gap: 12px;
      }

      .status-box {
        padding: 20px;
      }

      table { font-size: 13px; }
      th, td { padding: 12px 16px; }

      .chart-container {
        padding: 24px;
      }
    }

    @media (max-width: 480px) {
      h1 { font-size: 24px; }
      h2 { font-size: 16px; }
      
      .status-value { font-size: 28px; }
      
      .meta-info {
        gap: 8px;
      }
      
      .meta-item {
        padding: 6px 12px;
        font-size: 13px;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Relatório de Eficiência</h1>
    
    <div class="meta-info">
      <div class="meta-item">
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        {{hoje}}
      </div>
      <div class="meta-item">
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        {{local}}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>
      <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
      </svg>
      Status Atual
    </h2>
    
    <div class="current-status">
      <div class="status-box">
        <svg class="status-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 3v18m0 0c-1.5 0-3-.5-3-3V6c0-2.5 1.5-3 3-3s3 .5 3 3v12c0 2.5-1.5 3-3 3z"/>
          <circle cx="12" cy="18" r="3"/>
          <path d="M12 6v8"/>
        </svg>
        <div class="status-value">{{ultima.temperature}}°C</div>
        <div class="status-label">Temperatura</div>
        <div class="status-description">Medição atual do sistema</div>
      </div>
      
      <div class="status-box">
        <svg class="status-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"/>
        </svg>
        <div class="status-value">{{ultima.efficiency}}%</div>
        <div class="status-label">Eficiência</div>
        <div class="status-description">Performance operacional</div>
      </div>
      
      <div class="status-box">
        <svg class="status-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <div class="status-value">{{ultima.hora}}</div>
        <div class="status-label">Última Atualização</div>
        <div class="status-description">Timestamp da coleta</div>
      </div>
    </div>
    
    <div class="status-timestamp">
      Dados atualizados em <strong>{{ultima.data}}</strong>
    </div>
  </div>

  <div class="section">
    <h2>
      <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
      </svg>
      Resumo Estatístico
    </h2>
    
    <div class="table-container">
      <table class="stats-table">
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th class="numeric">Mínimo</th>
            <th class="numeric">Média</th>
            <th class="numeric">Máximo</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Temperatura (°C)</td>
            <td class="numeric">{{stats.temp.min}}</td>
            <td class="numeric">{{stats.temp.avg}}</td>
            <td class="numeric">{{stats.temp.max}}</td>
          </tr>
          <tr>
            <td>Eficiência (%)</td>
            <td class="numeric">{{stats.eff.min}}</td>
            <td class="numeric">{{stats.eff.avg}}</td>
            <td class="numeric">{{stats.eff.max}}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <h2>
      <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
      </svg>
      Histórico de Leituras
    </h2>
    
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Hora</th>
            <th class="numeric">Temperatura</th>
            <th class="numeric">Eficiência</th>
            <th>Local</th>
          </tr>
        </thead>
        <tbody>
          {{#each history}}
            <tr>
              <td>{{data}}</td>
              <td class="font-mono">{{hora}}</td>
              <td class="numeric">{{temperature}}°C</td>
              <td class="numeric">{{efficiency}}%</td>
              <td>{{location}}</td>
            </tr>
          {{/each}}
        </tbody>
      </table>
    </div>
  </div>

  <div class="section">
    <div class="chart-container">
      <h2>
        <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        Gráfico de Desempenho
      </h2>
      <img src="{{chartImage}}" alt="Gráfico de eficiência ao longo do tempo" />
    </div>
  </div>
</body>
</html>`

  const compiled = Handlebars.compile(template);
  return compiled(data);
}
