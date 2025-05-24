import {
  formatDisplayValue,
  formatDateTime,
  capitalizeWords,
  formatComparative
} from './utils.js';

const dateEl = document.querySelector(".value-date");
const timeEl = document.querySelector(".value-time");
const tempEl = document.querySelector(".value-temp");
const effEl = document.querySelector(".value-efficiency");
const locationEl = document.querySelector(".value-localization");
const climaEl = document.querySelector(".value-clima");
const trendTempIcon = document.querySelector('.trend-temp');
const trendEffIcon = document.querySelector('.trend-eff');

export function updateMainMetrics(data) {
  const dateObj = new Date(data.createdAt);
  const { date, time } = formatDateTime(dateObj);

  dateEl.textContent = date;
  timeEl.textContent = time;
  tempEl.textContent = formatDisplayValue(data.temperature, 'temp');
  effEl.textContent = formatDisplayValue(data.efficiency, 'eff');
  locationEl.textContent = data.location;
  climaEl.textContent = capitalizeWords(data.clima || '--');

  // Corrigir a manipulação de SVGs
  trendTempIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
  trendTempIcon.classList.add(`trend-${data.trendTemp}`);

  trendEffIcon.classList.remove('trend-up', 'trend-down', 'trend-stable');
  trendEffIcon.classList.add(`trend-${data.trendEff}`);
}

export function updateStats(data) {
  document.querySelector(".value-temp-avg").textContent = formatDisplayValue(data.temperature.avg, 'temp');
  document.querySelector(".value-temp-min").textContent = formatDisplayValue(data.temperature.min, 'temp');
  document.querySelector(".value-temp-max").textContent = formatDisplayValue(data.temperature.max, 'temp');

  document.querySelector(".value-eff-avg").textContent = formatDisplayValue(data.efficiency.avg, 'eff');
  document.querySelector(".value-eff-min").textContent = formatDisplayValue(data.efficiency.min, 'eff');
  document.querySelector(".value-eff-max").textContent = formatDisplayValue(data.efficiency.max, 'eff');

  document.querySelector(".value-eff-status").textContent = formatDisplayValue(100 - data.efficiency.avg, 'eff');
}

export function updateComparative(data) {
  document.querySelector('.value-yesterday-temperature').textContent =
    formatComparative(data.comparative.yesterday?.temperature, data.reference.temperature, 'temp');
  document.querySelector('.value-yesterday-efficiency').textContent =
    formatComparative(data.comparative.yesterday?.efficiency, data.reference.efficiency, 'eff');

  document.querySelector('.value-last-week-temperature').textContent =
    formatComparative(data.comparative.lastWeek?.temperature, data.reference.temperature, 'temp');
  document.querySelector('.value-last-week-efficiency').textContent =
    formatComparative(data.comparative.lastWeek?.efficiency, data.reference.efficiency, 'eff');

  document.querySelector('.value-last-month-temperature').textContent =
    formatComparative(data.comparative.lastMonth?.temperature, data.reference.temperature, 'temp');
  document.querySelector('.value-last-month-efficiency').textContent =
    formatComparative(data.comparative.lastMonth?.efficiency, data.reference.efficiency, 'eff');
}

export function updateLocationDisplay(location) {
  locationEl.textContent = location || '--';
}
