<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: PUT, OPTIONS');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

$input = json_decode(file_get_contents('php://input'), true);

$recordId = isset($input['id']) ? (int) $input['id'] : 0;
$siteName = isset($input['site_name']) ? trim((string) $input['site_name']) : '';
$barangay = isset($input['barangay']) ? trim((string) $input['barangay']) : '';
$latitude = isset($input['latitude']) ? trim((string) $input['latitude']) : '';
$longitude = isset($input['longitude']) ? trim((string) $input['longitude']) : '';
$species = isset($input['species']) ? trim((string) $input['species']) : '';
$datePlanted = isset($input['date_planted']) ? trim((string) $input['date_planted']) : '';
$plantingMethod = isset($input['planting_method']) ? trim((string) $input['planting_method']) : '';
$numberSeedlings = isset($input['number_seedlings']) ? trim((string) $input['number_seedlings']) : '';
$monitoringDate = isset($input['monitoring_date']) ? trim((string) $input['monitoring_date']) : '';
$condition = isset($input['condition_status']) ? trim((string) $input['condition_status']) : '';
$currentHeightCm = isset($input['current_height_cm']) ? trim((string) $input['current_height_cm']) : '';
$survivalStatus = isset($input['survival_status']) ? trim((string) $input['survival_status']) : '';
$remarks = isset($input['remarks']) ? trim((string) $input['remarks']) : '';
$soilType = isset($input['soil_type']) ? trim((string) $input['soil_type']) : '';
$waterCondition = isset($input['water_condition']) ? trim((string) $input['water_condition']) : '';
$waterSalinity = isset($input['water_salinity']) ? trim((string) $input['water_salinity']) : '';
$tideCondition = isset($input['tide_condition']) ? trim((string) $input['tide_condition']) : '';
$status = isset($input['status']) ? trim((string) $input['status']) : 'published';

if ($recordId <= 0) {
    send_json(400, ['message' => 'Invalid record ID.']);
}

if ($siteName === '' || $barangay === '' || $latitude === '' || $longitude === '' || $species === '' || $datePlanted === '' || $numberSeedlings === '' || $monitoringDate === '' || $condition === '' || $survivalStatus === '') {
    send_json(400, ['message' => 'Missing required fields.']);
}

$latitudeValue = filter_var($latitude, FILTER_VALIDATE_FLOAT);
$longitudeValue = filter_var($longitude, FILTER_VALIDATE_FLOAT);
$numberSeedlingsValue = filter_var($numberSeedlings, FILTER_VALIDATE_INT);
$currentHeightValue = $currentHeightCm === '' ? null : filter_var($currentHeightCm, FILTER_VALIDATE_INT);

if ($latitudeValue === false || $longitudeValue === false) {
    send_json(400, ['message' => 'Latitude and longitude must be valid numbers.']);
}

if ($latitudeValue < -90 || $latitudeValue > 90) {
    send_json(400, ['message' => 'Latitude must be between -90 and 90.']);
}

if ($longitudeValue < -180 || $longitudeValue > 180) {
    send_json(400, ['message' => 'Longitude must be between -180 and 180.']);
}

if ($numberSeedlingsValue === false) {
    send_json(400, ['message' => 'Number of seedlings must be a whole number.']);
}

if ($currentHeightCm !== '' && $currentHeightValue === false) {
    send_json(400, ['message' => 'Current height must be a whole number.']);
}

try {
    $pdo = get_pdo($config);

    $stmt = $pdo->prepare('SELECT site_name FROM monitoring_records WHERE id = ?');
    $stmt->execute([$recordId]);
    $oldRecord = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$oldRecord) {
        send_json(404, ['message' => 'Record not found.']);
    }
    $oldSiteName = $oldRecord['site_name'];

    $stmt = $pdo->prepare(
        'UPDATE monitoring_records SET
            site_name = :site_name,
            barangay = :barangay,
            latitude = :latitude,
            longitude = :longitude,
            species = :species,
            date_planted = :date_planted,
            planting_method = :planting_method,
            number_seedlings = :number_seedlings,
            monitoring_date = :monitoring_date,
            condition_status = :condition_status,
            current_height_cm = :current_height_cm,
            survival_status = :survival_status,
            remarks = :remarks,
            soil_type = :soil_type,
            water_condition = :water_condition,
            water_salinity = :water_salinity,
            tide_condition = :tide_condition,
            status = :status
        WHERE id = :id'
    );

    $stmt->execute([
        'site_name' => $siteName,
        'barangay' => $barangay,
        'latitude' => $latitudeValue,
        'longitude' => $longitudeValue,
        'species' => $species,
        'date_planted' => $datePlanted,
        'planting_method' => $plantingMethod,
        'number_seedlings' => $numberSeedlingsValue,
        'monitoring_date' => $monitoringDate,
        'condition_status' => $condition,
        'current_height_cm' => $currentHeightValue,
        'survival_status' => $survivalStatus,
        'remarks' => $remarks,
        'soil_type' => $soilType,
        'water_condition' => $waterCondition,
        'water_salinity' => $waterSalinity,
        'tide_condition' => $tideCondition,
        'status' => $status,
        'id' => $recordId,
    ]);

    // If site name changed, update all other logs for this site to match the new site name
    if ($oldSiteName !== $siteName && $oldSiteName !== '') {
        $updateAllStmt = $pdo->prepare('UPDATE monitoring_records SET site_name = ? WHERE site_name = ?');
        $updateAllStmt->execute([$siteName, $oldSiteName]);
    }
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while updating the monitoring record.']);
}

send_json(200, ['message' => 'Monitoring record updated successfully.']);
