let airChart;

async function loadAirQualityData() {
    const start = document.getElementById("startDate").value;
    const end = document.getElementById("endDate").value;

    if (!start || !end) {
        alert("Please select both a start date and an end date.");
        return;
    }

    if (start > end) {
        alert("Start date must be before the end date.");
        return;
    }

    try {
        const response = await fetch(
            `/api/airquality?start=${start}&end=${end}`
        );

        if (!response.ok) {
            throw new Error("Unable to load air quality data.");
        }

        const data = await response.json();

        updateSummary(data);

        if (data.length === 0) {
            if (airChart) {
                airChart.destroy();
                airChart = null;
            }

            return;
        }

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
    } catch (error) {
        console.error(error);
        alert("Something went wrong while loading the data.");
    }
}

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

    updateTrend(data);

    if (validPm10.length === 0 && validPm25.length === 0) {
        document.getElementById("averagePm10").textContent = "--";
        document.getElementById("averagePm25").textContent = "--";
        document.getElementById("highestPm10").textContent = "--";

        messageBox.className = "condition-card";
        conditionTitle.textContent = "No usable readings";
        conditionMessage.textContent =
            "No valid PM10 or PM2.5 readings were available for this date range.";

        updateRecommendation("no-data");
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

    const pm10Ratio = averagePm10 === null ? 0 : averagePm10 / 50;
    const pm25Ratio = averagePm25 === null ? 0 : averagePm25 / 25;
    const worstRatio = Math.max(pm10Ratio, pm25Ratio);

    messageBox.className = "condition-card";

    if (worstRatio <= 0.5) {
        messageBox.classList.add("good");
        conditionTitle.textContent = "Good Air Quality";
        conditionMessage.textContent =
            "Average PM10 and PM2.5 values remained well below the Australian National Environment Protection standards during the selected period.";

        updateRecommendation("good");

    } else if (worstRatio <= 1) {
        messageBox.classList.add("moderate");
        conditionTitle.textContent = "Moderate Air Quality";
        conditionMessage.textContent =
            "Average particle levels remained below the referenced Australian standards, but one or more pollutants were elevated during the selected period.";

        updateRecommendation("moderate");

    } else {
        messageBox.classList.add("poor");
        conditionTitle.textContent = "Poor Air Quality";
        conditionMessage.textContent =
            "At least one average particle level exceeded the referenced Australian standard during the selected period.";

        updateRecommendation("poor");
    }
}

function updateRecommendation(condition) {
    const card = document.getElementById("recommendationCard");
    const icon = document.getElementById("recommendationIcon");
    const title = document.getElementById("recommendationTitle");
    const message = document.getElementById("recommendationMessage");

    card.className = "recommendation-card";

    if (condition === "good") {
        card.classList.add("good");
        icon.textContent = "🟢";
        title.textContent = "Usual outdoor activities may continue";
        message.textContent =
            "Particle averages for the selected period were comparatively low. Continue to monitor current official advice if you have asthma or another respiratory condition.";

    } else if (condition === "moderate") {
        card.classList.add("moderate");
        icon.textContent = "🟡";
        title.textContent = "Be aware of elevated particle levels";
        message.textContent =
            "One or more particle averages were elevated. People who are sensitive to air pollution may wish to reduce prolonged or strenuous outdoor activity.";

    } else if (condition === "poor") {
        card.classList.add("poor");
        icon.textContent = "🔴";
        title.textContent = "Consider reducing outdoor exposure";
        message.textContent =
            "At least one particle average exceeded the referenced standard. Sensitive individuals should consider limiting prolonged outdoor activity and checking current official health advice.";

    } else {
        card.classList.add("no-data");
        icon.textContent = "ℹ️";
        title.textContent = "No guidance available";
        message.textContent =
            "No usable particle readings were available for the selected date range.";
    }
}

function updateTrend(data) {
    const trendBox = document.getElementById("trendBox");
    const trendTitle = document.getElementById("trendTitle");
    const trendMessage = document.getElementById("trendMessage");

    const validRecords = data.filter(record =>
        (record.pm10 !== null && Number.isFinite(record.pm10)) ||
        (record.pm25 !== null && Number.isFinite(record.pm25))
    );

    trendBox.className = "trend-box";

    if (validRecords.length < 6) {
        trendTitle.textContent = "Not enough data";
        trendMessage.textContent = "More readings are needed";
        return;
    }

    const midpoint = Math.floor(validRecords.length / 2);

    const earlierRecords = validRecords.slice(0, midpoint);
    const recentRecords = validRecords.slice(midpoint);

    const earlierScore = calculatePollutionScore(earlierRecords);
    const recentScore = calculatePollutionScore(recentRecords);

    if (
        earlierScore === null ||
        recentScore === null ||
        earlierScore === 0
    ) {
        trendTitle.textContent = "Unavailable";
        trendMessage.textContent = "Unable to calculate trend";
        return;
    }

    const percentageChange =
        ((recentScore - earlierScore) / earlierScore) * 100;

    const stableThreshold = 5;

    if (percentageChange < -stableThreshold) {
        trendBox.classList.add("improving");
        trendTitle.textContent = "↓ Improving";
        trendMessage.textContent =
            `${Math.abs(percentageChange).toFixed(1)}% lower in the recent half`;

    } else if (percentageChange > stableThreshold) {
        trendBox.classList.add("worsening");
        trendTitle.textContent = "↑ Worsening";
        trendMessage.textContent =
            `${percentageChange.toFixed(1)}% higher in the recent half`;

    } else {
        trendBox.classList.add("stable");
        trendTitle.textContent = "→ Stable";
        trendMessage.textContent =
            `${Math.abs(percentageChange).toFixed(1)}% change`;
    }
}

function calculatePollutionScore(records) {
    const pm10Values = records
        .map(record => record.pm10)
        .filter(value => value !== null && Number.isFinite(value));

    const pm25Values = records
        .map(record => record.pm25)
        .filter(value => value !== null && Number.isFinite(value));

    if (pm10Values.length === 0 && pm25Values.length === 0) {
        return null;
    }

    const averagePm10 = calculateAverage(pm10Values);
    const averagePm25 = calculateAverage(pm25Values);

    const pm10Ratio = averagePm10 === null ? 0 : averagePm10 / 50;
    const pm25Ratio = averagePm25 === null ? 0 : averagePm25 / 25;

    return Math.max(pm10Ratio, pm25Ratio);
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