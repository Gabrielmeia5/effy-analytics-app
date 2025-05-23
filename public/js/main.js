const REFRESH_INTERVAL = 30;
let timer = REFRESH_INTERVAL;
let currentPeriod = "day";
let chart;

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


async function fetchData() {
  try {
    const res = await fetch("/api/metrics/collect");
    const data = await res.json();

    const dateObj = new Date(data.createdAt);
    const { date, time } = formatDateTime(dateObj);

    dateEl.textContent = date;
    timeEl.textContent = time;
    tempEl.textContent = `${data.temperature.toFixed(2)}°C`;
    effEl.textContent = `${data.efficiency.toFixed(2)}%`;
    locationEl.textContent = data.location;
    climaEl.textContent = data.clima;

        trendTempIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
        trendEffIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');

        console.log(data.trendTemp, data.trendEff);
        // Adiciona nova classe conforme tendência
        trendTempIcon.classList.add(`trend-${data.trendTemp}`);
        trendEffIcon.classList.add(`trend-${data.trendEff}`);


    updateChart();
    fetchStats();
    fetchComparative();
  } catch (error) {
    console.error("Erro ao coletar dados:", error);
  }
}

async function fetchStats() {
  try {
    
    const response = await fetch(`/api/metrics/stats?range=${currentPeriod}`);
    const data = await response.json();

    document.querySelector(".value-temp-avg").textContent = `${data.temperature.avg.toFixed(2)}°C`;
    document.querySelector(".value-temp-min").textContent = `${data.temperature.min.toFixed(2)}°C`;
    document.querySelector(".value-temp-max").textContent = `${data.temperature.max.toFixed(2)}°C`;

    document.querySelector(".value-eff-avg").textContent = `${data.efficiency.avg.toFixed(2)}%`;
    document.querySelector(".value-eff-min").textContent = `${data.efficiency.min.toFixed(2)}%`;
    document.querySelector(".value-eff-max").textContent = `${data.efficiency.max.toFixed(2)}%`;

    document.querySelector(".value-eff-status").textContent = `${(100 - data.efficiency.avg).toFixed(2)}%`;
  } catch (error) {
    console.error('Erro ao atualizar estatísticas:', error);
  }
}


function formatValue(value, reference) {
  return (value === null || value === undefined) ? '--' : (reference-value).toFixed(2);
}



async function fetchComparative() {
  try {
    const res = await fetch("/api/metrics/comparative");
    if (!res.ok) throw new Error('Erro ao buscar dados comparativos');

    const data = await res.json();
    
     // Ontem
    document.querySelector('.value-yesterday-temperature').textContent = formatValue(data.comparative.yesterday?.temperature, data.reference.temperature);
    document.querySelector('.value-yesterday-efficiency').textContent = formatValue(data.comparative.yesterday?.efficiency, data.reference.efficiency);

    // Semana passada
    document.querySelector('.value-last-week-temperature').textContent = formatValue(data.comparative.lastWeek?.temperature, data.reference.temperature);
    document.querySelector('.value-last-week-efficiency').textContent = formatValue(data.comparative.lastWeek?.efficiency, data.reference.efficiency);

    // Mês passado
    document.querySelector('.value-last-month-temperature').textContent = formatValue(data.comparative.lastMonth?.temperature, data.reference.temperature);
    document.querySelector('.value-last-month-efficiency').textContent = formatValue(data.comparative.lastMonth?.efficiency, data.reference.efficiency);
    
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
          formatter: val => `${val}°C`
        }
      },
      {
        opposite: true,
        title: { text: 'Eficiência (%)' },
        labels: {
          formatter: val => `${val}%`
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

window.addEventListener("DOMContentLoaded", () => {
  initChart();
  fetchData();
  startTimer();
});
