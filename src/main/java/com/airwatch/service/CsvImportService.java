package com.airwatch.service;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class CsvImportService implements CommandLineRunner {

    private static final String DB_URL = "jdbc:sqlite:airwatch.db";
    private static final String DATA_FOLDER = "data";
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Override
    public void run(String... args) {
        try {
            createTable();
            importAllCsvFiles();
            System.out.println("CSV import completed successfully.");
        } catch (Exception e) {
            System.out.println("CSV import failed: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private void createTable() throws SQLException {
        String sql = """
                CREATE TABLE IF NOT EXISTS air_quality (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT UNIQUE,
                    pm10 REAL,
                    pm25 REAL,
                    temperature REAL,
                    pressure REAL
                );
                """;

        try (Connection conn = DriverManager.getConnection(DB_URL);
             Statement stmt = conn.createStatement()) {
            stmt.execute(sql);
        }
    }

    private void importAllCsvFiles() throws Exception {
        File folder = new File(DATA_FOLDER);
        File[] yearFolders = folder.listFiles(File::isDirectory);

        if (yearFolders == null) {
            throw new RuntimeException("No data folders found.");
        }

        for (File yearFolder : yearFolders) {
            File[] csvFiles = yearFolder.listFiles((dir, name) -> name.endsWith(".csv"));

            if (csvFiles == null) continue;

            for (File csvFile : csvFiles) {
                importCsvFile(csvFile);
            }
        }
    }

    private void importCsvFile(File csvFile) throws Exception {
        System.out.println("Importing: " + csvFile.getPath());

        String insertSql = """
                INSERT OR IGNORE INTO air_quality
                (timestamp, pm10, pm25, temperature, pressure)
                VALUES (?, ?, ?, ?, ?);
                """;

        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(insertSql);
             BufferedReader reader = new BufferedReader(new FileReader(csvFile))) {

            reader.readLine();

            String line;

            while ((line = reader.readLine()) != null) {
                String[] parts = line.split(",");

                if (parts.length < 5) {
                    continue;
                }

                LocalDateTime timestamp = LocalDateTime.parse(parts[0].trim(), FORMATTER);

                Double pm10 = parseValue(parts[1]);
                Double pm25 = parseValue(parts[2]);
                Double temperature = parseValue(parts[3]);
                Double pressure = parseValue(parts[4]);

                pstmt.setString(1, timestamp.toString());
                setNullableDouble(pstmt, 2, pm10);
                setNullableDouble(pstmt, 3, pm25);
                setNullableDouble(pstmt, 4, temperature);
                setNullableDouble(pstmt, 5, pressure);

                pstmt.executeUpdate();
            }
        }
    }

    private Double parseValue(String value) {
        try {
            double number = Double.parseDouble(value.trim());

            if (number < 0) {
                return null;
            }

            return number;
        } catch (Exception e) {
            return null;
        }
    }

    private void setNullableDouble(PreparedStatement pstmt, int index, Double value) throws SQLException {
        if (value == null) {
            pstmt.setNull(index, Types.REAL);
        } else {
            pstmt.setDouble(index, value);
        }
    }
}