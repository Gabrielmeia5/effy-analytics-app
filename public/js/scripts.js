const timerEl = document.querySelector('.value-timer');
const locationEl = document.querySelector('.value-localization');

const tempEl = document.querySelector('.value-temp');
const effEl = document.querySelector('.value-efficiency');
const dateEl = document.querySelector('.value-date');
const timeEl = document.querySelector('.value-time');
const trendEl = document.querySelector('.trend-icon');

const radioButtons = document.querySelectorAll('input[name="period"]');

let timer = 30;
let currentPeriod = 'day';

const chartEl = document.querySelector('#chart');
let chart;

// Iniciar o timer
function startTimer() {
    clearInterval(window.timerInterval);
    timer = 30;
    timerEl.textContent = timer;
    window.timerInterval = setInterval(() => {
        timer--;
        timerEl.textContent = timer;
        if (timer === 0) {
            fetchData();
            timer = 30;
        }
    }, 1000);
}

// Atualizar o gráfico
async function updateChart() {
    const res = await fetch(`/api/metrics/history?range=${currentPeriod}`);
    const data = await res.json();

    const categories = data.map(item => new Date(item.createdAt).toLocaleTimeString('pt-BR'));
    const tempData = data.map(item => item.temperature);
    const effData = data.map(item => item.efficiency);

    chart.updateOptions({
        xaxis: { categories },
        series: [
            { name: 'Temperatura (°C)', data: tempData },
            { name: 'Eficiência (%)', data: effData }
        ]
    });
}

// Atualizar os cards principais
async function fetchData() {
    try {
        const res = await fetch('/api/metrics/collect');
        const data = await res.json();

        const dateObj = new Date(data.createdAt);
        dateEl.textContent = dateObj.toLocaleDateString('pt-BR');
        timeEl.textContent = dateObj.toLocaleTimeString('pt-BR');

        tempEl.textContent = `${data.temperature.toFixed(2)}°C`;
        effEl.textContent = `${data.efficiency.toFixed(2)}%`;

        locationEl.textContent = data.location;


        updateChart();
        fetchComparative();
        fetchStats();

    } catch (error) {
        console.error('Erro ao coletar dados:', error);
    }
}

// Atualizar o comparativo
async function fetchComparative() {
    const res = await fetch('/api/metrics/comparative');
    const data = await res.json();


    console.log('Comparative:', data);
}

// Atualizar os stats
async function fetchStats() {
    const res = await fetch(`/api/metrics/stats?range=${currentPeriod}`);
    const data = await res.json();

    console.log('Stats:', data);

}


// Inicializa o gráfico
function initChart() {
    const options = {
        chart: {
            type: 'line',
            height: 350,
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
            categories: []
        },
        yaxis: [
            {
                title: { text: 'Temperatura (°C)' },
                labels: { formatter: val => `${val}°C` }
            },
            {
                opposite: true,
                title: { text: 'Eficiência (%)' },
                labels: { formatter: val => `${val}%` }
            }
        ],
        colors: ['#FF4560', '#00E396'],
        legend: {
            position: 'top'
        }
    };

    chart = new ApexCharts(chartEl, options);
    chart.render();
}

// Mudança de scopo
radioButtons.forEach(radio => {
    radio.addEventListener('change', (e) => {
        currentPeriod = e.target.value;
        updateChart();
        fetchStats();
    });
});


window.addEventListener('DOMContentLoaded', () => {
    initChart();
    fetchData();
    startTimer();
});
