let airChart;

async function loadAirQualityData() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    const response = await fetch(`/api/airquality?start=${start}&end=${end}`);
    const data = await response.json();
    updateSummary(data);

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
function updateSummary(data) {
    const messageBox = document.getElementById("messageBox");
    const conditionTitle = document.getElementById("conditionTitle");
    const conditionMessage = document.getElementById("conditionMessage");

    const validPm10 = data
        .map(record => record.pm10)
        .filter(value => value !== null && Number.isFinite(value));

    const validPm25 = data
        .map(record => record.pm25)
        .filter(value => value !== null && Number.isFinite(value));

    document.getElementById("readingCount").textContent = data.length;

    if (validPm10.length === 0 && validPm25.length === 0) {
        document.getElementById("averagePm10").textContent = "--";
        document.getElementById("averagePm25").textContent = "--";
        document.getElementById("highestPm10").textContent = "--";

        messageBox.className = "condition-card";
        conditionTitle.textContent = "No usable readings";
        conditionMessage.textContent =
            "No valid PM10 or PM2.5 readings were available for this date range.";
        return;
    }

    const averagePm10 = calculateAverage(validPm10);
    const averagePm25 = calculateAverage(validPm25);
    const highestPm10 =
        validPm10.length > 0 ? Math.max(...validPm10) : null;

    document.getElementById("averagePm10").textContent =
        formatValue(averagePm10);

    document.getElementById("averagePm25").textContent =
        formatValue(averagePm25);

    document.getElementById("highestPm10").textContent =
        formatValue(highestPm10);

    /*
     * Prototype interpretation based on Australian 24-hour standards:
     * PM10: 50 µg/m³
     * PM2.5: 25 µg/m³
     *
     * Good: both averages are at or below 50% of their standards.
     * Moderate: both averages remain at or below their standards.
     * Poor: either average exceeds its standard.
     */

    const pm10Ratio = averagePm10 === null ? 0 : averagePm10 / 50;
    const pm25Ratio = averagePm25 === null ? 0 : averagePm25 / 25;
    const worstRatio = Math.max(pm10Ratio, pm25Ratio);

    messageBox.className = "condition-card";

    if (worstRatio <= 0.5) {
        messageBox.classList.add("good");
        conditionTitle.textContent = "Good";
        conditionMessage.textContent =
            "Average particle levels for the selected period were well below the referenced Australian standards.";
    } else if (worstRatio <= 1) {
        messageBox.classList.add("moderate");
        conditionTitle.textContent = "Moderate";
        conditionMessage.textContent =
            "Average particle levels were below the referenced standards, but one or more pollutants were elevated.";
    } else {
        messageBox.classList.add("poor");
        conditionTitle.textContent = "Poor";
        conditionMessage.textContent =
            "At least one average particle level exceeded the referenced Australian standard for the selected period.";
    }
}

function calculateAverage(values) {
    if (values.length === 0) {
        return null;
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    return total / values.length;
}

function formatValue(value) {
    return value === null ? "--" : value.toFixed(1);
}
loadAirQualityData();