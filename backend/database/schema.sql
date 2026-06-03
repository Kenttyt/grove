CREATE DATABASE IF NOT EXISTS leoworks CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE leoworks;

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(120) NOT NULL,
    email VARCHAR(190) NOT NULL UNIQUE,
    google_sub VARCHAR(255) NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS email_verification_codes (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(190) NOT NULL UNIQUE,
    code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_expires_at (expires_at)
);

CREATE TABLE IF NOT EXISTS monitoring_records (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    barangay VARCHAR(190) NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    species VARCHAR(190) NOT NULL,
    date_planted DATE NOT NULL,
    planting_method VARCHAR(190) DEFAULT NULL,
    number_seedlings INT UNSIGNED NOT NULL,
    monitoring_date DATE NOT NULL,
    condition_status VARCHAR(64) NOT NULL,
    current_height_cm INT DEFAULT NULL,
    survival_status VARCHAR(64) NOT NULL,
    remarks TEXT DEFAULT NULL,
    soil_type VARCHAR(190) DEFAULT NULL,
    water_condition VARCHAR(190) DEFAULT NULL,
    water_salinity VARCHAR(190) DEFAULT NULL,
    tide_condition VARCHAR(190) DEFAULT NULL,
    photo_path VARCHAR(255) DEFAULT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'published',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_monitoring_date (monitoring_date)
);
