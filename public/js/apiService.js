export async function fetchMetrics() {
  return fetchJSON('/api/metrics/collect');
}

export async function fetchLatest() {
  return fetchJSON('/api/metrics/latest');
}

export async function fetchStats(range) {
  return fetchJSON(`/api/metrics/stats?range=${range}`);
}

export async function fetchComparative() {
  return fetchJSON('/api/metrics/comparative');
}

export async function fetchHistory(range) {
  return fetchJSON(`/api/metrics/history?range=${range}`);
}

export async function fetchExportCSV(range) {
  return fetchBlob(`/api/metrics/export?range=${range}`);
}

export async function fetchExportPDF(payload) {
  const res = await fetch('/api/metrics/export/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.blob();
}

export async function fetchLocation() {
  return fetchJSON('/api/metrics/location');
}

export async function updateLocation(location) {
  const res = await fetch('/api/metrics/location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao alterar localização');
  return data;
}

// Helpers internos

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao acessar ${url}`);
  return res.json();
}

async function fetchBlob(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao baixar arquivo de ${url}`);
  return res.blob();
}
