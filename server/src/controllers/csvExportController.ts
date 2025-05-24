import { Request, Response } from 'express';
import { metricService } from '../services/metricService';
import { createObjectCsvStringifier } from 'csv-writer';

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR'); // 23/05/2025
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR'); // 14:30:00
}

function formatNumber(num: number) {
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function exportMetrics(req: Request, res: Response) {
  const range = req.query.range as 'day' | 'week' | 'month';

  if (!['day', 'week', 'month'].includes(range)) {
    return res.status(400).json({ error: 'Parâmetro inválido: range' });
  }

  try {
    const data = await metricService.getHistoryByRange(range);

    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'data', title: 'Data' },
        { id: 'hora', title: 'Hora' },
        { id: 'temperature', title: 'Temperatura (°C)' },
        { id: 'efficiency', title: 'Eficiência (%)' },
        { id: 'location', title: 'Localização' },
      ]
    });

    const records = data.map((item) => ({
      data: formatDate(item.createdAt),
      hora: formatTime(item.createdAt),
      temperature: formatNumber(item.temperature),
      efficiency: formatNumber(item.efficiency),
      location: item.location
    }));

    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);

    const now = new Date();
    const filename = `relatorio-effy-${range}-${now.toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + csv); // BOM para Excel compatibilidade UTF-8
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    res.status(500).json({ error: 'Erro ao gerar CSV' });
  }
}