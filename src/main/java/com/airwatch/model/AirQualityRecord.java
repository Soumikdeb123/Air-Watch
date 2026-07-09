package com.airwatch.model;

public class AirQualityRecord {
    public int id;
    public String timestamp;
    public Double pm10;
    public Double pm25;
    public Double temperature;
    public Double pressure;

    public AirQualityRecord(int id, String timestamp, Double pm10, Double pm25, Double temperature, Double pressure) {
        this.id = id;
        this.timestamp = timestamp;
        this.pm10 = pm10;
        this.pm25 = pm25;
        this.temperature = temperature;
        this.pressure = pressure;
    }
}