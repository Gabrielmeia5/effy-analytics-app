let chartInstance = null;

export function initChart(containerElement) {
  const options = {
    chart: {
      type: "line",
      height: 500,
      toolbar: { show: false },
    },
    grid: {
      borderColor: "#E5E7EB",
      row: {
        colors: ["#F9FAFB", "transparent"],
        opacity: 0.5,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: 2,
    },
    series: [
      { name: "Temperatura (°C)", data: [] },
      { name: "Eficiência (%)", data: [] },
    ],
    xaxis: {
      type: "datetime",
      labels: {
        datetimeFormatter: {
          hour: "HH:mm",
          minute: "HH:mm",
        },
        rotate: -45,
      },
    },
    yaxis: [
      {
        title: { text: "Temperatura (°C)" },
        labels: {
          formatter: (val) => (Number.isInteger(val) ? `${val}°C` : `${val.toFixed(2)}°C`),
        },
      },
      {
        opposite: true,
        title: { text: "Eficiência (%)" },
        labels: {
          formatter: (val) => (Number.isInteger(val) ? `${val}%` : `${val.toFixed(2)}%`),
        },
        min: 75,
        max: 100,
      },
    ],
    tooltip: {
      x: {
        format: "dd/MM/yyyy HH:mm:ss",
      },
    },
    colors: ["#FF4560", "#00E396"],
    legend: {
      position: "top",
    },
  };

  chartInstance = new ApexCharts(containerElement, options);
  chartInstance.render();
}

export function updateChart(tempData, effData) {
  if (!chartInstance) return;

  chartInstance.updateSeries([
    { name: "Temperatura (°C)", data: tempData },
    { name: "Eficiência (%)", data: effData },
  ]);
}

export async function exportChartImage() {
  if (!chartInstance) return null;
  const { imgURI } = await chartInstance.dataURI();
  return imgURI;
}
