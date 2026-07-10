let airChart;

async function loadAirQualityData() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    const response = await fetch(`/api/airquality?start=${start}&end=${end}`);
    const data = await response.json();

    const labels = data.map(record => record.timestamp);
    const pm10Values = data.map(record => record.pm10);
    const pm25Values = data.map(record => record.pm25);

    const ctx = document.getElementById("airChart");

    if (airChart) {
        airChart.destroy();
    }

    airChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "PM10",
                    data: pm10Values,
                    borderWidth: 2,
                    tension: 0.2
                },
                {
                    label: "PM2.5",
                    data: pm25Values,
                    borderWidth: 2,
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        maxTicksLimit: 10
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: "µg/m³"
                    }
                }
            }
        }
    });
}

loadAirQualityData();