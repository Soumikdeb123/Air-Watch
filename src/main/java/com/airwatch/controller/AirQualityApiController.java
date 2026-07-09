package com.airwatch.controller;

import com.airwatch.model.AirQualityRecord;
import com.airwatch.service.AirQualityService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.sql.SQLException;
import java.util.List;

@RestController
public class AirQualityApiController {

    private final AirQualityService service;

    public AirQualityApiController(AirQualityService service) {
        this.service = service;
    }

    @GetMapping("/api/airquality")
    public List<AirQualityRecord> getAirQuality() throws SQLException {
        return service.getLatestRecords();
    }
}