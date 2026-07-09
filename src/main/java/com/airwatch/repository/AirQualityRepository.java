package com.airwatch.repository;

import com.airwatch.model.AirQualityRecord;
import org.springframework.stereotype.Repository;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@Repository
public class AirQualityRepository {

    private static final String DB_URL = "jdbc:sqlite:airwatch.db";

    public List<AirQualityRecord> findLatestRecords() throws SQLException {
        List<AirQualityRecord> records = new ArrayList<>();

        String sql = """
                SELECT id, timestamp, pm10, pm25, temperature, pressure
                FROM air_quality
                ORDER BY timestamp DESC
                LIMIT 100
                """;

        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement stmt = conn.prepareStatement(sql);
             ResultSet rs = stmt.executeQuery()) {

            while (rs.next()) {
                records.add(new AirQualityRecord(
                        rs.getInt("id"),
                        rs.getString("timestamp"),
                        getNullableDouble(rs, "pm10"),
                        getNullableDouble(rs, "pm25"),
                        getNullableDouble(rs, "temperature"),
                        getNullableDouble(rs, "pressure")
                ));
            }
        }

        return records;
    }

    private Double getNullableDouble(ResultSet rs, String column) throws SQLException {
        double value = rs.getDouble(column);
        return rs.wasNull() ? null : value;
    }
}