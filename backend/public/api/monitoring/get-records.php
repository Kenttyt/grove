<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

try {
    $pdo = get_pdo($config);
    
    // Fetch all published monitoring records ordered by monitoring date (newest first)
    $stmt = $pdo->query(
        'SELECT 
            id,
            site_name,
            barangay,
            latitude,
            longitude,
            species,
            date_planted,
            planting_method,
            number_seedlings,
            monitoring_date,
            condition_status,
            current_height_cm,
            survival_status,
            remarks,
            soil_type,
            water_condition,
            water_salinity,
            tide_condition,
            photo_path,
            status,
            created_at
        FROM monitoring_records
        WHERE status = "published"
        ORDER BY monitoring_date DESC, id DESC'
    );
    
    $records = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    send_json(200, [
        'message' => 'Records retrieved successfully.',
        'records' => $records,
        'count' => count($records)
    ]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while retrieving monitoring records.']);
}
