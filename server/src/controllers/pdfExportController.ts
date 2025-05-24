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
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-size: 12px;
        color: #1F2937;
        background: #FFFFFF;
        padding: 20px;
        line-height: 1.6;
      }

      h1, h2 {
        text-align: center;
        color: #1F2937;
        margin-bottom: 12px;
      }

      .section {
        margin: 24px 0;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
        font-size: 11px;
      }

      th, td {
        border: 1px solid #E5E7EB;
        padding: 6px 8px;
        text-align: center;
      }

      th {
        background-color: #F9FAFB;
        color: #374151;
      }

      td {
        background-color: #FFFFFF;
      }
      .section { margin: 20px 0; }
      .page-break { page-break-before: always; }
      
    </style>
  </head>
  <body>
    <h1>Relatório Técnico – Effy Analytics</h1>
    <p><strong>Data:</strong> {{hoje}} &nbsp;&nbsp;&nbsp; <strong>Local:</strong> {{local}}</p>

    <div class="section">
      <h2>Último Registro</h2>
      <p>Temperatura: <strong>{{ultima.temperature}}°C</strong></p>
      <p>Eficiência: <strong>{{ultima.efficiency}}%</strong></p>
      <p>Data/Hora: <strong>{{ultima.data}} às {{ultima.hora}}</strong></p>
    </div>
    <div class="section">
      <h2>Resumo Estatístico</h2>
      <table>
        <thead><tr><th>Data</th><th>Hora</th><th>Temperatura (°C)</th><th>Eficiência (%)</th></tr></thead>
        <tbody>
          {{#each history}}
            <tr><td>{{data}}</td><td>{{hora}}</td><td>{{temperature}}</td><td>{{efficiency}}</td></tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h2>Histórico Completo</h2>
      <table>
        <thead><tr><th>Data</th><th>Hora</th><th>Temperatura (°C)</th><th>Eficiência (%)</th><th>Local</th></tr></thead>
        <tbody>
          {{#each history}}
            <tr><td>{{data}}</td><td>{{hora}}</td><td>{{temperature}}</td><td>{{efficiency}}</td><td>{{location}}</td></tr>
          {{/each}}
        </tbody>
      </table>
    </div>

    <div class="page-break"></div>

    <div class="section">
      <h2>Gráfico de Temperatura e Eficiência</h2>
      <img src="{{chartImage}}" style="width: 100%; height: auto;" />
    </div>
  </body>
  </html>`;

  const compiled = Handlebars.compile(template);
  return compiled(data);
}
