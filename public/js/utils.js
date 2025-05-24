export function formatDisplayValue(value, type = null) {
  if (value === null || value === undefined || value === '') return '--';

  const num = Number(value);
  if (isNaN(num)) return '--';

  let formatted = Number.isInteger(num) ? `${num}` : `${num.toFixed(2)}`;
  formatted = formatted.replace('.', ',');

  if (type === 'temp') return `${formatted}°C`;
  if (type === 'eff') return `${formatted}%`;
  return formatted;
}

export function formatDateTime(date) {
  return {
    date: date.toLocaleDateString("pt-BR"),
    time: date.toLocaleTimeString("pt-BR"),
  };
}

export function capitalizeWords(str) {
  if (!str) return '--';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function showToast(message, type = 'success', duration = 5000) {
  const toast = document.getElementById('toast');
  const messageSpan = toast.querySelector('.toast-message');
  const progressBar = toast.querySelector('.toast-progress');

  messageSpan.textContent = message;
  toast.className = 'toast show ' + type;

  // Reinicia a animação da barra de progresso
  progressBar.style.animation = 'none';
  progressBar.offsetHeight; // força reflow
  progressBar.style.animation = `toast-progress-animation ${duration}ms linear forwards`;


  setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
}

export function formatComparative(value, reference, type) {
  if (!value && !reference) return '--';

  const diff = reference - value;
  if (diff > 0) {
    return `+ ${formatDisplayValue(diff, type)}`;
  } else {
    return formatDisplayValue(diff, type);
  }
}
