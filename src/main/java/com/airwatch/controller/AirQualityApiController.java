package com.airwatch.controller;

import com.airwatch.model.AirQualityRecord;
import com.airwatch.service.AirQualityService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
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
    public List<AirQualityRecord> getAirQuality(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end
    ) throws SQLException {

        if (start != null && end != null) {
            return service.getRecordsBetweenDates(start, end);
        }

        return service.getLatestRecords();
    }

    @GetMapping(
            value = "/api/airquality/export",
            produces = "text/csv"
    )
    public ResponseEntity<String> exportAirQuality(
            @RequestParam String start,
            @RequestParam String end
    ) throws SQLException {

        List<AirQualityRecord> records =
                service.getRecordsBetweenDates(start, end);

        StringBuilder csv = new StringBuilder();

        csv.append(
                "Date/Time,PM10 ug/m3,PM2.5 ug/m3," +
                "Temperature Deg C,Barometric Pressure atm\n"
        );

        for (AirQualityRecord record : records) {
            csv.append(escapeCsv(record.timestamp)).append(",");
            csv.append(formatNullable(record.pm10)).append(",");
            csv.append(formatNullable(record.pm25)).append(",");
            csv.append(formatNullable(record.temperature)).append(",");
            csv.append(formatNullable(record.pressure)).append("\n");
        }

        String filename =
                "air_quality_" + start + "_to_" + end + ".csv";

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\""
                )
                .contentType(new MediaType("text", "csv"))
                .body(csv.toString());
    }

    private String formatNullable(Double value) {
        return value == null ? "" : value.toString();
    }

    private String escapeCsv(String value) {
        if (value == null) {
            return "";
        }

        String escaped = value.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}