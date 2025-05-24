import {
  fetchMetrics,
  fetchLatest,
  fetchStats,
  fetchComparative,
  fetchHistory,
  fetchExportCSV,
  fetchExportPDF,
  fetchLocation,
  updateLocation
} from "./apiService.js";
import {
  formatDisplayValue,
  formatDateTime,
  capitalizeWords,
  showToast,
  formatComparative
} from './utils.js';



const REFRESH_INTERVAL = 30;
let timer = REFRESH_INTERVAL;
let currentPeriod = "day";
let chart;
let lastTimestamp = null;
let currentLocationValue = null;





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
const btnEditLocation = document.getElementById('btn-edit-location');
const formLocation = document.getElementById('form-location');
const inputLocation = document.getElementById('input-location');
const btnCancelLocation = document.getElementById('btn-cancel-location');


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
async function updateChart() {
  try {
    const data = await fetchHistory(currentPeriod);

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


async function fetchData() {
  try {
    const data = await fetchMetrics();
    processData(data);
  } catch (error) {
    console.warn("Erro na API /collect, tentando fallback em /latest", error);
    showToast("Erro na atualização automática. Dados offline carregados.", 'warning');
    await fetchFallbackLatest();
  }
}

async function fetchFallbackLatest() {
  try {
    const data = await fetchLatest();
    processData({
      ...data,
      clima: '--',
      trendTemp: 'stable',
      trendEff: 'stable'
    });
  } catch (error) {
    console.error("Erro ao buscar dados offline (/latest):", error);
    showToast("Erro geral. Não foi possível carregar nenhum dado.", 'error');
  }
}

async function fetchStatsUI() {
  try {
    const data = await fetchStats(currentPeriod);

    document.querySelector(".value-temp-avg").textContent = formatDisplayValue(data.temperature.avg, 'temp');
    document.querySelector(".value-temp-min").textContent = formatDisplayValue(data.temperature.min, 'temp');
    document.querySelector(".value-temp-max").textContent = formatDisplayValue(data.temperature.max, 'temp');

    document.querySelector(".value-eff-avg").textContent = formatDisplayValue(data.efficiency.avg, 'eff');
    document.querySelector(".value-eff-min").textContent = formatDisplayValue(data.efficiency.min, 'eff');
    document.querySelector(".value-eff-max").textContent = formatDisplayValue(data.efficiency.max, 'eff');

    document.querySelector(".value-eff-status").textContent = formatDisplayValue(100 - data.efficiency.avg, 'eff');
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}


async function fetchComparativeUI() {
  try {
    const data = await fetchComparative();

    const yesterdayTemp = document.querySelector('.value-yesterday-temperature');
    const yesterdayEff = document.querySelector('.value-yesterday-efficiency');
    const lastWeekTemp = document.querySelector('.value-last-week-temperature');
    const lastWeekEff = document.querySelector('.value-last-week-efficiency');
    const lastMonthTemp = document.querySelector('.value-last-month-temperature');
    const lastMonthEff = document.querySelector('.value-last-month-efficiency');
    
    yesterdayTemp.textContent = formatComparative(data.comparative.yesterday?.temperature, data.reference.temperature, 'temp');
    yesterdayEff.textContent = formatComparative(data.comparative.yesterday?.efficiency, data.reference.efficiency, 'eff');
    lastWeekTemp.textContent = formatComparative(data.comparative.lastWeek?.temperature, data.reference.temperature, 'temp');
    lastWeekEff.textContent = formatComparative(data.comparative.lastWeek?.efficiency, data.reference.efficiency, 'eff');
    lastMonthTemp.textContent = formatComparative(data.comparative.lastMonth?.temperature, data.reference.temperature, 'temp');
    lastMonthEff.textContent = formatComparative(data.comparative.lastMonth?.efficiency, data.reference.efficiency, 'eff');
  } catch (error) {
    console.error('Erro ao carregar dados comparativos:', error);
  }
}


function processData(data) {
  const dateObj = new Date(data.createdAt);
  const { date, time } = formatDateTime(dateObj);

  dateEl.textContent = date;
  timeEl.textContent = time;
  tempEl.textContent = formatDisplayValue(data.temperature, 'temp');
  effEl.textContent = formatDisplayValue(data.efficiency, 'eff'); 
  locationEl.textContent = data.location;
  climaEl.textContent = capitalizeWords(data.clima || '--');

  trendTempIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
  trendEffIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
  trendTempIcon.classList.add(`trend-${data.trendTemp}`);
  trendEffIcon.classList.add(`trend-${data.trendEff}`);

  updateChart();
  fetchStatsUI();
  fetchComparativeUI();
}


radioButtons.forEach((radio) => {
  radio.addEventListener("change", (e) => {
    currentPeriod = e.target.value;
    updateChart();
    fetchStatsUI();
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
    const blob = await fetchExportCSV(currentPeriod);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `metrics-${currentPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Erro ao exportar CSV:", err);
    showToast("Erro ao exportar CSV.", 'error');
  }
});


document.getElementById('btn-export-pdf').addEventListener('click', async () => {
  try {
    const chartImage = await chart.dataURI().then(uri => uri.imgURI);
    const [latest, stats, history] = await Promise.all([
      fetchLatest(),
      fetchStats(currentPeriod),
      fetchHistory(currentPeriod)
    ]);

    const payload = { chartImage, currentPeriod, latest, stats, history };
    const blob = await fetchExportPDF(payload);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-effy-${currentPeriod}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error('Erro ao exportar PDF:', err);
    showToast("Erro ao exportar PDF.", 'error');
  }
});


document.addEventListener("DOMContentLoaded", async () => {
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


async function fetchCurrentLocation() {
  try {
    const data = await fetchLocation();
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
    showToast('Digite um local válido.', 'error');
    return;
  }

  try {
    const data = await updateLocation(newLocation);
    showToast(data.message || 'Local alterado com sucesso!', 'success', 4000);
    locationEl.textContent = data.location;
    currentLocationValue = data.location;
    formLocation.classList.add('hidden');
    btnEditLocation.classList.remove('hidden');
    await fetchData();
  } catch (err) {
    showToast(err.message || 'Erro ao alterar local.', 'error');
    inputLocation.focus();
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
