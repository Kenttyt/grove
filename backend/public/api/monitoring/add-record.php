<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['message' => 'Method not allowed.']);
    exit;
}

require_once __DIR__ . '/../../../src/helpers.php';
require_once __DIR__ . '/../../../src/database.php';
$config = require __DIR__ . '/../../../src/config.php';

$siteName = trim((string) ($_POST['site_name'] ?? ''));
$barangay = trim((string) ($_POST['barangay'] ?? ''));
$latitude = trim((string) ($_POST['latitude'] ?? ''));
$longitude = trim((string) ($_POST['longitude'] ?? ''));
$species = trim((string) ($_POST['species'] ?? ''));
$datePlanted = trim((string) ($_POST['date_planted'] ?? ''));
$plantingMethod = trim((string) ($_POST['planting_method'] ?? ''));
$numberSeedlings = trim((string) ($_POST['number_seedlings'] ?? ''));
$monitoringDate = trim((string) ($_POST['monitoring_date'] ?? ''));
$condition = trim((string) ($_POST['condition'] ?? ''));
$currentHeightCm = trim((string) ($_POST['current_height_cm'] ?? ''));
$survival_status = trim((string) ($_POST['survival_status'] ?? ''));
$remarks = trim((string) ($_POST['remarks'] ?? ''));
$soilType = trim((string) ($_POST['soil_type'] ?? ''));
$waterCondition = trim((string) ($_POST['water_condition'] ?? ''));
$waterSalinity = trim((string) ($_POST['water_salinity'] ?? ''));
$tideCondition = trim((string) ($_POST['tide_condition'] ?? ''));
$status = trim((string) ($_POST['status'] ?? 'published'));

if ($siteName === '' || $barangay === '' || $latitude === '' || $longitude === '' || $species === '' || $datePlanted === '' || $numberSeedlings === '' || $monitoringDate === '' || $condition === '' || $survival_status === '' ) {
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

$photoPath = null;
if (isset($_FILES['photo']) && $_FILES['photo']['error'] !== UPLOAD_ERR_NO_FILE) {
    $upload = $_FILES['photo'];
    if ($upload['error'] !== UPLOAD_ERR_OK) {
        send_json(400, ['message' => 'Failed to upload photo.']);
    }

    $allowedTypes = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
    if (!isset($allowedTypes[$upload['type']])) {
        send_json(400, ['message' => 'Only JPG, PNG, and WEBP images are allowed.']);
    }

    $storageDir = __DIR__ . '/../../../storage/monitoring_photos';
    if (!is_dir($storageDir) && !mkdir($storageDir, 0777, true) && !is_dir($storageDir)) {
        send_json(500, ['message' => 'Unable to create photo storage folder.']);
    }

    $extension = $allowedTypes[$upload['type']];
    $fileName = sprintf('%s.%s', bin2hex(random_bytes(16)), $extension);
    $targetPath = $storageDir . '/' . $fileName;

    if (!move_uploaded_file($upload['tmp_name'], $targetPath)) {
        send_json(500, ['message' => 'Unable to store uploaded photo.']);
    }

    $photoPath = 'storage/monitoring_photos/' . $fileName;
}

try {
    $pdo = get_pdo($config);
    $stmt = $pdo->prepare(
        'INSERT INTO monitoring_records (
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
            status
        ) VALUES (
            :site_name,
            :barangay,
            :latitude,
            :longitude,
            :species,
            :date_planted,
            :planting_method,
            :number_seedlings,
            :monitoring_date,
            :condition_status,
            :current_height_cm,
            :survival_status,
            :remarks,
            :soil_type,
            :water_condition,
            :water_salinity,
            :tide_condition,
            :photo_path,
            :status
        )'
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
        'survival_status' => $survival_status,
        'remarks' => $remarks,
        'soil_type' => $soilType,
        'water_condition' => $waterCondition,
        'water_salinity' => $waterSalinity,
        'tide_condition' => $tideCondition,
        'photo_path' => $photoPath,
        'status' => $status,
    ]);
} catch (Throwable $e) {
    send_json(500, ['message' => 'Database error while saving the monitoring record.']);
}

send_json(201, ['message' => 'Monitoring record saved successfully.']);
