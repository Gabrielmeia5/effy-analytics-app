import { fetchMetrics, fetchLatest, fetchStats, fetchComparative, fetchHistory, fetchExportCSV, fetchExportPDF, fetchLocation, updateLocation } from "./apiService.js";

import { formatDisplayValue, showToast } from "./utils.js";

import { initChart, updateChart, exportChartImage } from "./chartManager.js";

import { updateMainMetrics, updateStats, updateComparative, updateLocationDisplay } from "./domUpdater.js";

const REFRESH_INTERVAL = 30;
let timer = REFRESH_INTERVAL;
let currentPeriod = "day";
let currentLocationValue = null;

window.addEventListener("DOMContentLoaded", async () => {
  await fetchCurrentLocation();
  await loadAllData();
  startTimer();
  animationNavBar()

  const loader = document.getElementById("loader");
  loader.classList.add("fade-out");
  setTimeout(() => loader.remove(), 500);
});

function startTimer() {
  clearInterval(window.timerInterval);
  timer = REFRESH_INTERVAL;
  document.querySelector(".value-timer").textContent = timer;

  window.timerInterval = setInterval(() => {
    timer--;
    document.querySelector(".value-timer").textContent = timer;
    if (timer === 0) {
      fetchData();
      timer = REFRESH_INTERVAL;
    }
  }, 1000);
}
async function loadAllData() {
  initChart(document.querySelector("#chart"));
  await fetchData();
}

async function fetchData() {
  try {
    const data = await fetchMetrics();
    processData(data);
  } catch (error) {
    console.warn("Erro na API /collect, tentando fallback em /latest", error);
    showToast("Erro na atualização automática. Dados offline carregados.", "warning");
    await fetchFallbackLatest();
  }
}

async function fetchFallbackLatest() {
  try {
    const data = await fetchLatest();
    processData({
      ...data,
      clima: "--",
      trendTemp: "stable",
      trendEff: "stable",
    });
  } catch (error) {
    console.error("Erro ao buscar dados offline (/latest):", error);
    showToast("Erro geral. Não foi possível carregar nenhum dado.", "error");
  }
}

function processData(data) {
  updateMainMetrics(data);
  updateChartUI();
  fetchStatsUI();
  fetchComparativeUI();
}

async function updateChartUI() {
  try {
    const data = await fetchHistory(currentPeriod);

    const tempData = data.map((item) => ({
      x: new Date(item.createdAt).getTime() - new Date().getTimezoneOffset() * 60000,
      y: item.temperature,
    }));

    const effData = data.map((item) => ({
      x: new Date(item.createdAt).getTime() - new Date().getTimezoneOffset() * 60000,
      y: item.efficiency,
    }));

    updateChart(tempData, effData);
  } catch (err) {
    console.error("Erro ao atualizar gráfico:", err);
  }
}

async function fetchStatsUI() {
  try {
    const data = await fetchStats(currentPeriod);
    updateStats(data);
  } catch (error) {
    console.error("Erro ao atualizar estatísticas:", error);
  }
}

async function fetchComparativeUI() {
  try {
    const data = await fetchComparative();
    updateComparative(data);
  } catch (error) {
    console.error("Erro ao carregar dados comparativos:", error);
  }
}

async function fetchCurrentLocation() {
  try {
    const data = await fetchLocation();
    updateLocationDisplay(data.location);
    currentLocationValue = data.location || "--";
  } catch {
    updateLocationDisplay("--");
    currentLocationValue = "--";
  }
}

document.querySelectorAll('input[name="period"]').forEach((radio) => {
  radio.addEventListener("change", (e) => {
    currentPeriod = e.target.value;
    updateChartUI();
    fetchStatsUI();
  });
});

const exportCSVButton = document.getElementById("btn-export-csv");
const exportPDFButton = document.getElementById("btn-export-pdf");

document.getElementById("btn-export-csv").addEventListener("click", async () => {
  exportCSVButton.classList.add("loading");
  try {
    const blob = await fetchExportCSV(currentPeriod);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `metrics-${currentPeriod}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Erro ao exportar CSV:", err);
    showToast("Erro ao exportar CSV.", "error");
  } finally {
    exportCSVButton.classList.remove("loading"); 
  }
});

document.getElementById("btn-export-pdf").addEventListener("click", async () => {
  exportPDFButton.classList.add("loading"); 
  try {
    const chartImage = await exportChartImage();
    const [latest, stats, history] = await Promise.all([fetchLatest(), fetchStats(currentPeriod), fetchHistory(currentPeriod)]);

    const payload = { chartImage, currentPeriod, latest, stats, history };
    const blob = await fetchExportPDF(payload);

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-effy-${currentPeriod}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch (err) {
    console.error("Erro ao exportar PDF:", err);
    showToast("Erro ao exportar PDF.", "error");
  } finally {
    exportPDFButton.classList.remove("loading"); // Remove loading
  }

});

const btnEditLocation = document.getElementById("btn-edit-location");
const formLocation = document.getElementById("form-location");
const inputLocation = document.getElementById("input-location");
const btnCancelLocation = document.getElementById("btn-cancel-location");

btnEditLocation.addEventListener("click", () => {
  formLocation.classList.remove("hidden");
  btnEditLocation.classList.add("hidden");
  inputLocation.value = currentLocationValue || "";
  inputLocation.focus();
});

btnCancelLocation.addEventListener("click", (e) => {
  e.preventDefault();
  formLocation.classList.add("hidden");
  btnEditLocation.classList.remove("hidden");
  inputLocation.value = "";
});

formLocation.addEventListener("submit", async (e) => {
  e.preventDefault();
  const newLocation = inputLocation.value.trim();
  if (!newLocation) {
    showToast("Digite um local válido.", "error");
    return;
  }

  try {
    const data = await updateLocation(newLocation);
    showToast(data.message || "Local alterado com sucesso!", "success", 4000);
    updateLocationDisplay(data.location);
    currentLocationValue = data.location;
    formLocation.classList.add("hidden");
    btnEditLocation.classList.remove("hidden");
    await fetchData();
    startTimer();
  } catch (err) {
    showToast(err.message || "Erro ao alterar local.", "error");
    inputLocation.focus();
  }
});


async function animationNavBar() {
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
}