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

function formatDisplayValue(value, type = null) {
  if (value === null || value === undefined || value === '') return '--';

  const num = Number(value);
  if (isNaN(num)) return '--';

  let formatted = Number.isInteger(num) ? `${num}` : `${num.toFixed(2)}`;
  formatted = formatted.replace('.', ',');

  if (type === 'temp') return `${formatted}°C`;
  if (type === 'eff') return `${formatted}%`;
  return formatted;
}

function capitalizeWords(str) {
  if (!str) return '--';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatDateTime(date) {
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR"),
  };
}

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

function showToast(message, duration = 7000) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.add('hidden');
  }, duration);
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
    showToast("Erro geral. Não foi possível carregar nenhum dado.");
  }
}



async function fetchData() {
  try {
    const res = await fetch("/api/metrics/collect", { timeout: 5000 });
    if (!res.ok) throw new Error('API /collect falhou');
    const data = await res.json();

    const dateObj = new Date(data.createdAt);
    const { date, time } = formatDateTime(dateObj);

    dateEl.textContent = date;
    timeEl.textContent = time;
    tempEl.textContent = formatDisplayValue(data.temperature, 'temp');
    effEl.textContent = formatDisplayValue(data.efficiency, 'eff'); 
    locationEl.textContent = data.location;
    climaEl.textContent = capitalizeWords(data.clima);

        trendTempIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
        trendEffIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');

        // Adiciona nova classe conforme tendência
        trendTempIcon.classList.add(`trend-${data.trendTemp}`);
        trendEffIcon.classList.add(`trend-${data.trendEff}`);


    updateChart();
    fetchStats();
    fetchComparative();
  } catch (error) {
      console.warn("Erro na API /collect, tentando fallback em /latest", error);
      showToast("Erro na atualização automática. Dados offline carregados.");
      await fetchFallbackLatest();
  }
}

async function fetchStats() {
  try {
    
    const response = await fetch(`/api/metrics/stats?range=${currentPeriod}`);
    const data = await response.json();

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


function formatValue(value, reference, type) {
  if (value === null || value === undefined || reference === null || reference === undefined) {
    return '--';
  }

  return formatDisplayValue(reference - value, type);
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
    yesterdayTemp.textContent = formatValue(data.comparative.yesterday?.temperature, data.reference.temperature, 'temp');
    yesterdayEff.textContent = formatValue(data.comparative.yesterday?.efficiency, data.reference.efficiency, 'eff');

    // Semana passada
    lastWeekTemp.textContent = formatValue(data.comparative.lastWeek?.temperature, data.reference.temperature, 'temp');
    lastWeekEff.textContent = formatValue(data.comparative.lastWeek?.efficiency, data.reference.efficiency, 'eff');

    // Mês passado
    lastMonthTemp.textContent = formatValue(data.comparative.lastMonth?.temperature, data.reference.temperature, 'temp');
    lastMonthEff.textContent = formatValue(data.comparative.lastMonth?.efficiency, data.reference.efficiency, 'eff');
    
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
