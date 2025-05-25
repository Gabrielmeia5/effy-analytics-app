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
  const template = `
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <style>
    * {
      box-sizing: border-box;
      font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
    }

    body {
      font-size: 12px;
      background-color: #ffffff;
      color: #1e1e1e;
      padding: 32px;
      max-width: 840px;
      margin: 0 auto;
      line-height: 1.6;
    }

    h1 {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #111;
    }

    h2 {
      font-size: 16px;
      margin: 32px 0 16px;
      color: #222;
      font-weight: 600;
      border-bottom: 1px solid #ccc;
      padding-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .meta-info {
      font-size: 11px;
      color: #555;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    }

    .section {
      margin-bottom: 40px;
    }

    .current-status {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      background: #f5f5f5;
      border: 1px solid #dcdcdc;
      border-radius: 12px;
      padding: 24px;
    }

    .status-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .status-icon {
      width: 28px;
      height: 28px;
      margin-bottom: 8px;
      opacity: 0.8;
    }

    .status-value {
      font-size: 22px;
      font-weight: 700;
      color: #111;
    }

    .status-label {
      font-size: 10px;
      color: #666;
      margin-top: 4px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      background-color: #fff;
      border: 1px solid #ccc;
      border-radius: 6px;
      overflow: hidden;
    }

    th, td {
      padding: 10px 14px;
      border-bottom: 1px solid #e5e5e5;
    }

    th {
      background: #f3f3f3;
      text-align: left;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 10px;
      color: #333;
    }

    td {
      color: #222;
    }

    tbody tr:last-child td {
      border-bottom: none;
    }

    .numeric {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .chart-container {
      text-align: center;
      padding: 24px;
      background: #f8f8f8;
      border-radius: 10px;
      border: 1px solid #ddd;
      margin-top: 32px;
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 6px;
    }

    p.note {
      font-size: 10px;
      color: #444;
      margin-top: 8px;
    }

    .icon {
      width: 16px;
      height: 16px;
      vertical-align: middle;
      opacity: 0.6;
    }

    @media print {
      .section {
        break-inside: avoid;
      }

      h2 {
        color: #000;
        border-color: #000;
      }

      .chart-container {
        background: none;
        border: none;
      }
    }
  </style>
</head>
<body>
  <h1>Relatório de Eficiência Industrial</h1>
  <p class="meta-info">
    <strong>Data:</strong> {{hoje}} &nbsp;&nbsp;&nbsp; <strong>Local:</strong> {{local}}
  </p>

  <div class="section">
    <h2>
      <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
      </svg>
      Status Atual
    </h2>
    <div class="current-status">
      <div class="status-box">
        <svg class="icon" fill="none" stroke-width="1"  stroke="currentColor" viewBox="0 0 100 100" enable-background="new 0 0 100 100" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g>
        <path d="M50,82.3c7.6,0,13.8-6.2,13.8-13.8c0-4.4-2-8.4-5.5-11V26c0-2.2-0.9-4.3-2.4-5.9c-1.6-1.6-3.7-2.4-5.9-2.4   c-4.6,0-8.3,3.7-8.3,8.3v31.5c-3.4,2.6-5.5,6.6-5.5,11C36.2,76.1,42.4,82.3,50,82.3z M44.8,60.3l0.9-0.6V48.2H50v-4h-4.3v-1.8H50   v-4h-4.3v-1.8H50v-4h-4.3v-1.8H50v-4h-4.3V26c0-2.4,1.9-4.3,4.3-4.3c1.1,0,2.2,0.4,3,1.3c0.8,0.8,1.3,1.9,1.3,3v33.6l0.9,0.6   c2.8,1.8,4.5,4.9,4.5,8.2c0,5.4-4.4,9.8-9.8,9.8s-9.8-4.4-9.8-9.8C40.2,65.1,41.9,62.1,44.8,60.3z"/>
        <path d="M50,76.6c4.5,0,8.1-3.6,8.1-8.1c0-3.8-2.6-6.9-6.1-7.8v-8.1h-4v8.1c-3.5,0.9-6.1,4.1-6.1,7.8C41.9,73,45.5,76.6,50,76.6z    M50,64.4c2.3,0,4.1,1.8,4.1,4.1s-1.8,4.1-4.1,4.1s-4.1-1.8-4.1-4.1S47.7,64.4,50,64.4z"/>
        </g>
        </svg>
        <div class="status-value">{{ultima.temperature}}°C</div>
        <div class="status-label">Temperatura</div>
      </div>
      <div class="status-box">
        <svg class="status-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M3 17l6-6 4 4 8-8" />
        </svg>
        <div class="status-value">{{ultima.efficiency}}%</div>
        <div class="status-label">Eficiência</div>
      </div>
      <div class="status-box">
        <svg class="status-icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
        <div class="status-value">{{ultima.hora}}</div>
        <div class="status-label">Última Leitura</div>
      </div>
    </div>
    <p class="note"><strong>{{ultima.data}}</strong></p>
  </div>

  <div class="section">
    <h2>
      <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M3 3h18M3 9h18M3 15h18M3 21h18" />
      </svg>
      Resumo Estatístico
    </h2>
    <table>
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
          <td><strong>Temperatura (°C)</strong></td>
          <td class="numeric">{{stats.temp.min}}</td>
          <td class="numeric">{{stats.temp.avg}}</td>
          <td class="numeric">{{stats.temp.max}}</td>
        </tr>
        <tr>
          <td><strong>Eficiência (%)</strong></td>
          <td class="numeric">{{stats.eff.min}}</td>
          <td class="numeric">{{stats.eff.avg}}</td>
          <td class="numeric">{{stats.eff.max}}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>
          <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M4 20h16M4 10h4v10H4zm6-6h4v16h-4zm6 8h4v8h-4z" />
      </svg>
        <path d="M3 8h18M8 3v18" />
      </svg>
      Histórico de Leituras
    </h2>
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
            <td>{{hora}}</td>
            <td class="numeric">{{temperature}}°C</td>
            <td class="numeric">{{efficiency}}%</td>
            <td>{{location}}</td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </div>

  <div class="section chart-container">
    <h2>
      <svg class="icon" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M4 20h16M4 10h4v10H4zm6-6h4v16h-4zm6 8h4v8h-4z" />
      </svg>
      Gráfico de Desempenho
    </h2>
    <img src="{{chartImage}}" alt="Gráfico de eficiência" />
  </div>
</body>
</html>

  `;


  const compiled = Handlebars.compile(template);
  return compiled(data);
}
