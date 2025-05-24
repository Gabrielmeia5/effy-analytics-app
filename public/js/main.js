import * as utils from './utils.js'




const REFRESH_INTERVAL = 30;
let timer = REFRESH_INTERVAL;
let currentPeriod = "day";
let chart;
let lastTimestamp = null;

const timerEl = document.querySelector(".value-timer");
const locationEl = document.querySelector(".value-localization");
const climaEl = document.querySelector(".value-clima");
const tempEl = document.querySelector(".value-temp");
const effEl = document.querySelector(".value-efficiency");
const dateEl = document.querySelector(".value-date");
const timeEl = document.querySelector(".value-time");
const trendEl = document.querySelector(".trend-icon");
const radioButtons = document.querySelectorAll('input[name="period"]');
const chartEl = document.querySelector("#chart");

const trendTempIcon = document.querySelector('.trend-temp');
const trendEffIcon = document.querySelector('.trend-eff');






function startTimer() {
  clearInterval(window.timerInterval);
  timer = REFRESH_INTERVAL;
  timerEl.textContent = timer;

  window.timerInterval = setInterval(() => {
    timer--;
    timerEl.textContent = timer;
    if (timer === 0) {
      fetchData();
      timer = REFRESH_INTERVAL;
    }
  }, 1000);
}
async function updateChart() {
  try {
    const res = await fetch(`/api/metrics/history?range=${currentPeriod}`);
    const data = await res.json();

const tempData = data.map(item => ({
  x: new Date(item.createdAt).getTime() - new Date().getTimezoneOffset() * 60000,
  y: item.temperature
}));

const effData = data.map(item => ({
  x: new Date(item.createdAt).getTime() - new Date().getTimezoneOffset() * 60000,
  y: item.efficiency
}));
    chart.updateSeries([
      { name: "Temperatura (°C)", data: tempData },
      { name: "Eficiência (%)", data: effData }
    ]);
  } catch (err) {
    console.error("Erro ao atualizar gráfico:", err);
  }
}





async function fetchFallbackLatest() {
  try {
    const res = await fetch("/api/metrics/latest");
    if (!res.ok) throw new Error('API /latest falhou');
    const data = await res.json();

    processData({
      ...data,
      clima: '--',
      trendTemp: 'stable',
      trendEff: 'stable'
    });

  } catch (error) {
    console.error("Erro ao buscar dados offline (/latest):", error);
    utils.showToast("Erro geral. Não foi possível carregar nenhum dado.", 'error');
  }
}

function processData(data) {
  const dateObj = new Date(data.createdAt);
  const { date, time } = utils.formatDateTime(dateObj);

  dateEl.textContent = date;
  timeEl.textContent = time;
  tempEl.textContent = utils.formatDisplayValue(data.temperature, 'temp');
  effEl.textContent = utils.formatDisplayValue(data.efficiency, 'eff'); 
  locationEl.textContent = data.location;
  climaEl.textContent = utils.capitalizeWords(data.clima || '--');

  trendTempIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
  trendEffIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
  trendTempIcon.classList.add(`trend-${data.trendTemp}`);
  trendEffIcon.classList.add(`trend-${data.trendEff}`);

  updateChart();
  fetchStats();
  fetchComparative();
}

async function fetchData() {
  try {
    const res = await fetch("/api/metrics/collect", { timeout: 7000 }); // Timeout manual (não funciona nativo no fetch, pode usar AbortController se quiser melhorar)
    if (!res.ok) throw new Error('API /collect falhou');
    const data = await res.json();
    processData(data);
  } catch (error) {
    console.warn("Erro na API /collect, tentando fallback em /latest", error);
    utils.showToast("Erro na atualização automática. Dados offline carregados.", 'warning');
    await fetchFallbackLatest();
  }
}

async function fetchStats() {
  try {
    
    const response = await fetch(`/api/metrics/stats?range=${currentPeriod}`);
    const data = await response.json();

    document.querySelector(".value-temp-avg").textContent = utils.formatDisplayValue(data.temperature.avg, 'temp');
    document.querySelector(".value-temp-min").textContent = utils.formatDisplayValue(data.temperature.min, 'temp');
    document.querySelector(".value-temp-max").textContent = utils.formatDisplayValue(data.temperature.max, 'temp');

    document.querySelector(".value-eff-avg").textContent = utils.formatDisplayValue(data.efficiency.avg, 'eff');
    document.querySelector(".value-eff-min").textContent = utils.formatDisplayValue(data.efficiency.min, 'eff');
    document.querySelector(".value-eff-max").textContent = utils.formatDisplayValue(data.efficiency.max, 'eff');

    document.querySelector(".value-eff-status").textContent = utils.formatDisplayValue(100 - data.efficiency.avg, 'eff');
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}






async function fetchComparative() {
  try {
    const res = await fetch("/api/metrics/comparative");
    if (!res.ok) throw new Error('Erro ao buscar dados comparativos');

    const data = await res.json();

    const yesterdayTemp = document.querySelector('.value-yesterday-temperature');


    
    const yesterdayEff = document.querySelector('.value-yesterday-efficiency');
    const lastWeekTemp = document.querySelector('.value-last-week-temperature');
    const lastWeekEff = document.querySelector('.value-last-week-efficiency');
    const lastMonthTemp = document.querySelector('.value-last-month-temperature');
    const lastMonthEff = document.querySelector('.value-last-month-efficiency');
    
    // Ontem
    yesterdayTemp.textContent = utils.formatComparative(data.comparative.yesterday?.temperature, data.reference.temperature, 'temp');
    yesterdayEff.textContent = utils.formatComparative(data.comparative.yesterday?.efficiency, data.reference.efficiency, 'eff');

    // Semana passada
    lastWeekTemp.textContent = utils.formatComparative(data.comparative.lastWeek?.temperature, data.reference.temperature, 'temp');
    lastWeekEff.textContent = utils.formatComparative(data.comparative.lastWeek?.efficiency, data.reference.efficiency, 'eff');

    // Mês passado
    lastMonthTemp.textContent = utils.formatComparative(data.comparative.lastMonth?.temperature, data.reference.temperature, 'temp');
    lastMonthEff.textContent = utils.formatComparative(data.comparative.lastMonth?.efficiency, data.reference.efficiency, 'eff');
    
  } catch (error) {
    console.error('Erro ao carregar dados comparativos:', error);
  }
}

function initChart() {
  const options = {
    chart: {
      type: 'line',
      height: 500,
      toolbar: { show: false }
    },
    grid: {
      borderColor: '#E5E7EB',
      row: {
        colors: ['#F9FAFB', 'transparent'], // linhas alternadas bem suaves
        opacity: 0.5
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    series: [
      { name: 'Temperatura (°C)', data: [] },
      { name: 'Eficiência (%)', data: [] }
    ],
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeFormatter: {
          hour: 'HH:mm',
          minute: 'HH:mm',
        },
        rotate: -45
      }
    },
    yaxis: [
      {
        title: { text: 'Temperatura (°C)' },
        labels: {
          formatter: val => Number.isInteger(val) ? `${val}°C` : `${val.toFixed(2)}°C`
        }
      },
      {
        opposite: true,
        title: { text: 'Eficiência (%)' },
        labels: {
          formatter: val => Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`
        },
        min: 75,
        max: 100
      }
    ],
    tooltip: {
      x: {
        format: 'dd/MM/yyyy HH:mm:ss'
      }
    },
    colors: ['#FF4560', '#00E396'],
    legend: {
      position: 'top'
    }
  };

  chart = new ApexCharts(chartEl, options);
  chart.render();
}



radioButtons.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    currentPeriod = e.target.value;
    updateChart();
    fetchStats();
  });
});

window.addEventListener("DOMContentLoaded", async () => {
  await loadAllData();
  startTimer();

  const loader = document.getElementById('loader');
  loader.classList.add('fade-out');
  setTimeout(() => loader.remove(), 500);
});

async function loadAllData() {
  initChart();             // Inicializa gráfico vazio
  await fetchData();       // Aguarda dados, updateChart(), stats, comparativo
}

document.getElementById('btn-export-csv').addEventListener('click', async () => {
  try {
    const res = await fetch(`/api/metrics/export?range=${currentPeriod}`);
    const blob = await res.blob();

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${currentPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Erro ao exportar CSV:", err);
    utils.showToast("Erro ao exportar CSV.", 'error');
  }
});

document.getElementById('btn-export-pdf').addEventListener('click', exportToPDF);

async function exportToPDF() {
  try {
    const chartImage = await chart.dataURI().then(uri => uri.imgURI);

    const [latestRes, statsRes, historyRes] = await Promise.all([
      fetch('/api/metrics/latest'),
      fetch(`/api/metrics/stats?range=${currentPeriod}`),
      fetch(`/api/metrics/history?range=${currentPeriod}`)
    ]);

    const [latest, stats, history] = await Promise.all([
      latestRes.json(),
      statsRes.json(),
      historyRes.json()
    ]);

    const payload = {
      chartImage,
      currentPeriod,
      latest,
      stats,
      history
    };

    const res = await fetch('/api/metrics/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-effy-${currentPeriod}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error('Erro ao exportar PDF:', err);
    utils.showToast("Erro ao exportar PDF.", 'error');
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const chartSection = document.querySelector("#chart");
  const navButtons = document.querySelectorAll("nav .nav-button");
  const homeButton = navButtons[0];
  const chartButton = navButtons[1];

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.8) {
          chartButton.classList.add("active");
          homeButton.classList.remove("active");
        } else {
          chartButton.classList.remove("active");
          homeButton.classList.add("active");
        }
      });
    },
    {
      threshold: 0.8,
    }
  );

  if (chartSection) {
    observer.observe(chartSection);
  }
});


// ...existing code...

const btnEditLocation = document.getElementById('btn-edit-location');
const formLocation = document.getElementById('form-location');
const inputLocation = document.getElementById('input-location');
const btnCancelLocation = document.getElementById('btn-cancel-location');

let currentLocationValue = null;

// Carrega o local atual ao iniciar
async function fetchCurrentLocation() {
  try {
    const res = await fetch('/api/metrics/location');
    const data = await res.json();
    locationEl.textContent = data.location || '--';
    currentLocationValue = data.location || '--';
  } catch {
    locationEl.textContent = '--';
    currentLocationValue = '--';
  }
}

// Mostra o formulário de edição
btnEditLocation.addEventListener('click', () => {
  formLocation.classList.remove('hidden');
  btnEditLocation.classList.add('hidden');
  inputLocation.value = currentLocationValue || '';
  inputLocation.focus();
});

// Cancela edição
btnCancelLocation.addEventListener('click', (e) => {
  e.preventDefault();
  formLocation.classList.add('hidden');
  btnEditLocation.classList.remove('hidden');
  inputLocation.value = '';
});

// Submete novo local
formLocation.addEventListener('submit', async (e) => {
  e.preventDefault();
  const newLocation = inputLocation.value.trim();
  if (!newLocation) {
    utils.showToast('Digite um local válido.', 'error');
    return;
  }
  try {
    const res = await fetch('/api/metrics/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location: newLocation })
    });
    const data = await res.json();
    if (res.ok) {
      utils.showToast(data.message || 'Local alterado com sucesso!', 'success',4000);
      locationEl.textContent = data.location;
      currentLocationValue = data.location;
      formLocation.classList.add('hidden');
      btnEditLocation.classList.remove('hidden');
      await fetchData(); // Atualiza dados para o novo local
    } else {
      utils.showToast(data.error || 'Local inválido.', 'warning');
      inputLocation.focus();
    }
  } catch {
    utils.showToast('Erro ao alterar local.','error') ;
  }
});

// Ao carregar a página, busca o local atual
window.addEventListener("DOMContentLoaded", async () => {
  await fetchCurrentLocation();
  await loadAllData();
  startTimer();

  const loader = document.getElementById('loader');
  loader.classList.add('fade-out');
  setTimeout(() => loader.remove(), 500);
});

