package com.airwatch.service;

import com.airwatch.model.AirQualityRecord;
import com.airwatch.repository.AirQualityRepository;
import org.springframework.stereotype.Service;

import java.sql.SQLException;
import java.util.List;

@Service
public class AirQualityService {

    private final AirQualityRepository repository;

    public AirQualityService(AirQualityRepository repository) {
        this.repository = repository;
    }

    public List<AirQualityRecord> getLatestRecords() throws SQLException {
        return repository.findLatestRecords();
    }
}